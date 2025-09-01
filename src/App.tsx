import { useState, useEffect, useRef } from 'react'
import { TbTrash, TbEdit, TbInfoCircle } from 'react-icons/tb'
import './App.css'
import type { Activity, ActivityType } from './types/Activity'
import { useActivities } from './hooks/useActivities'
import { ActivityItem } from './components/ActivityItem'
import { Calendar } from './components/Calendar'
import { ActivityControls } from './components/ActivityControls'
import { DayDetailModal } from './components/DayDetailModal'
import { SettingsMenu } from './components/SettingsMenu'
import { AboutModal } from './components/AboutModal'
import { UndoToast } from './components/UndoToast'
import { formatTime, formatDuration, formatLiveDuration, formatTimeForInput, parseTimeFromInput, isToday, isYesterday, isTodayOrYesterday } from './utils/dateUtils'
import { getActivityIcon, getActivityLabel } from './utils/activityUtils'
import { useTheme } from './contexts/ThemeContext'

function App() {
  // Use theme hook
  const { isDarkMode, toggleDarkMode, themeName, setTheme } = useTheme()
  
  // Use custom hook for activity management
  const {
    activities,
    currentActivity,
    recentlyDeleted,
    startActivity,
    stopActivity,
    addQuickActivity,
    updateActivityData,
    deleteActivity,
    undoDelete,
    importActivities
  } = useActivities()
  const [editingActivity, setEditingActivity] = useState<string | null>(null)
  const [expandedActivityInfo, setExpandedActivityInfo] = useState<Set<string>>(new Set())
  const [showBurgerMenu, setShowBurgerMenu] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [currentView, setCurrentView] = useState<'activities' | 'calendar'>('activities')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  // Unified touch gesture system
  const [touchState, setTouchState] = useState<{
    startX: number
    startY: number
    currentX: number
    currentY: number
    isDragging: boolean
    startTime: number
    target: EventTarget | null
    gestureType: 'none' | 'view-navigation' | 'activity-swipe'
    activityId?: string
  }>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
    startTime: 0,
    target: null,
    gestureType: 'none'
  })
  const [slidingOutItems, setSlidingOutItems] = useState<Set<string>>(new Set())
  const [currentTime, setCurrentTime] = useState(new Date())
  const feedingIconRef = useRef<HTMLSpanElement>(null)
  
  // Update current time every second for live duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  
  // Feeding animation: spawn drops when bottle changes direction
  useEffect(() => {
    if (currentActivity?.type !== 'breastfeeding' || !feedingIconRef.current) return
    
    const spawnDrops = (direction: 'left' | 'right') => {
      const emitter = feedingIconRef.current?.querySelector('.feeding-emitter')
      if (!emitter || !feedingIconRef.current) return
      
      // Position relative to the feeding icon container (so drops move with bottle)
      const emitterRect = emitter.getBoundingClientRect()
      const iconRect = feedingIconRef.current.getBoundingClientRect()
      
      const x = emitterRect.left - iconRect.left
      const y = emitterRect.top - iconRect.top
      
      // Spawn 2-3 drops with slight randomization
      const dropCount = 2 + Math.round(Math.random())
      for (let i = 0; i < dropCount; i++) {
        const drop = document.createElement('div')
        drop.className = `milk-drop ${direction}`
        drop.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>'
        
        // Position at emitter with slight randomization
        drop.style.left = (x + (Math.random() * 4 - 2)) + 'px'
        drop.style.top = (y + (Math.random() * 4 - 2)) + 'px'
        
        // Randomize timing
        const duration = 700 + Math.random() * 400 // 0.7-1.1s
        const delay = i * 40 + Math.random() * 80
        drop.style.animationDuration = duration + 'ms'
        drop.style.animationDelay = delay + 'ms'
        
        // Append to the feeding icon so drops move with the bottle
        feedingIconRef.current.appendChild(drop)
        drop.addEventListener('animationend', () => {
          if (drop.parentNode) drop.parentNode.removeChild(drop)
        }, { once: true })
      }
    }
    
    // Spawn drops synchronized with bottle direction changes
    // The bottle animation: 0s = left extreme, 2.4s = right extreme, 4.8s = left extreme
    let timeoutId: number
    
    const scheduleNextDrop = (isInitial = true) => {
      if (isInitial) {
        // Start at left extreme (0s), spawn left drops
        timeoutId = window.setTimeout(() => {
          spawnDrops('left')
          // Next: right extreme at 2.4s
          timeoutId = window.setTimeout(() => {
            spawnDrops('right')
            // Schedule the repeating pattern
            scheduleNextDrop(false)
          }, 2400)
        }, 100) // Small delay to let animation start
      } else {
        // Repeating: left at 4.8s (2.4s after last), right at 7.2s (2.4s after that)
        timeoutId = window.setTimeout(() => {
          spawnDrops('left')
          timeoutId = window.setTimeout(() => {
            spawnDrops('right')
            scheduleNextDrop(false)
          }, 2400)
        }, 2400)
      }
    }
    
    scheduleNextDrop()
    
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [currentActivity?.type])
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())


  // Close burger menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showBurgerMenu && !target.closest('.burger-menu-btn') && !target.closest('.burger-menu-dropdown')) {
        setShowBurgerMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showBurgerMenu])


  // Activity button click handlers (simplified - options handled in ActivityControls)
  const handleActivityClick = (type: ActivityType) => {
    if (currentActivity?.type === type) {
      stopActivity()
    } else {
      startActivity(type)
    }
  }

  const handleStartActivity = (type: ActivityType, feedingType?: 'left' | 'right' | 'bottle') => {
    startActivity(type, feedingType)
  }

  const handleAddQuickActivity = (type: ActivityType, diaperType?: 'pee' | 'poo' | 'both') => {
    addQuickActivity(type, diaperType)
  }

  // Wrapper for formatLiveDuration with current time
  const formatLiveDurationWrapper = (startTime: Date) => {
    return formatLiveDuration(startTime, currentTime)
  }


  // Unified touch gesture handlers
  const handleGlobalTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    const target = e.target as HTMLElement
    
    // Find if touch started on an activity item
    const activityElement = target.closest('.activity-item') as HTMLElement
    const activityId = activityElement?.getAttribute('data-activity-id')
    const isHeader = target.closest('.app-header')
    
    // Skip gesture handling in header area
    if (isHeader) return
    
    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isDragging: true,
      startTime: Date.now(),
      target: e.target,
      gestureType: 'none', // Will be determined during move
      activityId: activityId || undefined
    })
  }

  const handleGlobalTouchMove = (e: React.TouchEvent) => {
    if (!touchState.isDragging) return
    
    const touch = e.touches[0]
    const horizontalDistance = touch.clientX - touchState.startX
    const verticalDistance = Math.abs(touch.clientY - touchState.startY)
    const threshold = 30
    
    // Determine gesture type if not already set
    let gestureType = touchState.gestureType
    if (gestureType === 'none' && Math.max(Math.abs(horizontalDistance), verticalDistance) > threshold) {
      if (touchState.activityId && horizontalDistance > threshold && verticalDistance < threshold * 2) {
        // Horizontal swipe on activity = activity swipe
        gestureType = 'activity-swipe'
      } else if (Math.abs(horizontalDistance) > threshold && verticalDistance < 100) {
        // Horizontal swipe elsewhere = view navigation
        gestureType = 'view-navigation'
      }
    }
    
    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      gestureType
    }))
    
    // Prevent scrolling during active gestures
    if (gestureType !== 'none') {
      e.preventDefault()
    }
  }

  const handleGlobalTouchEnd = () => {
    if (!touchState.isDragging) return
    
    const horizontalDistance = touchState.currentX - touchState.startX
    const verticalDistance = Math.abs(touchState.currentY - touchState.startY)
    
    if (touchState.gestureType === 'activity-swipe' && touchState.activityId) {
      // Handle activity swipe-to-delete
      const swipeThreshold = window.innerWidth * 0.4
      if (horizontalDistance > swipeThreshold) {
        const activity = activities.find(a => a.id === touchState.activityId)
        if (activity && activity.endTime) { // Only allow deletion of completed activities
          setSlidingOutItems(prev => new Set(prev).add(touchState.activityId!))
          setTimeout(() => {
            deleteActivity(touchState.activityId!)
            setSlidingOutItems(prev => {
              const newSet = new Set(prev)
              newSet.delete(touchState.activityId!)
              return newSet
            })
          }, 300)
        }
      }
    } else if (touchState.gestureType === 'view-navigation') {
      // Handle view navigation
      const swipeThreshold = 100
      if (Math.abs(horizontalDistance) > swipeThreshold && verticalDistance < 100) {
        if (horizontalDistance < 0 && currentView === 'activities') {
          // Swipe left: activities → calendar
          setCurrentView('calendar')
        } else if (horizontalDistance > 0 && currentView === 'calendar') {
          // Swipe right: calendar → activities  
          setCurrentView('activities')
        }
      }
    }
    
    // Reset touch state
    setTouchState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false,
      startTime: 0,
      target: null,
      gestureType: 'none'
    })
  }

  const getSwipeTransform = (activityId: string) => {
    // If item is sliding out, move it completely off screen
    if (slidingOutItems.has(activityId)) {
      return `translateX(${window.innerWidth}px)`
    }
    
    // Check if this activity is currently being swiped
    if (touchState.gestureType === 'activity-swipe' && touchState.activityId === activityId && touchState.isDragging) {
      const totalDistance = touchState.currentX - touchState.startX
      const threshold = 30
      const movementDistance = Math.max(0, totalDistance - threshold)
      return `translateX(${movementDistance}px)`
    }
    return 'translateX(0px)'
  }

  const getSwipeOpacity = (activityId: string) => {
    if (touchState.gestureType === 'activity-swipe' && touchState.activityId === activityId && touchState.isDragging) {
      const distance = Math.max(0, touchState.currentX - touchState.startX - 30) // Subtract threshold
      const opacity = Math.max(0.4, 1 - (distance / 170)) // Smoother fade
      return opacity
    }
    return 1
  }

  const getSwipeBackgroundColor = (activityId: string) => {
    if (touchState.gestureType === 'activity-swipe' && touchState.activityId === activityId && touchState.isDragging) {
      const distance = Math.max(0, touchState.currentX - touchState.startX - 30) // Subtract threshold
      const intensity = Math.min(1, distance / 120) // Fully red at 150px total (120px after threshold)
      
      // Clean transition: transparent → light red → dark red
      const alpha = Math.min(0.8, intensity * 1.2) // Max 80% opacity
      const red = Math.floor(220 + (35 * intensity)) // From light red (220) to dark red (255)
      
      return `rgba(${red}, 60, 60, ${alpha})`
    }
    return ''
  }




  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  const groupActivitiesByDate = (activities: Activity[]) => {
    const groups: Record<string, Activity[]> = {}
    
    activities.forEach(activity => {
      const dateKey = activity.startTime.toDateString()
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(activity)
    })
    
    return groups
  }

  const toggleDateExpansion = (dateKey: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev)
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey)
      } else {
        newSet.add(dateKey)
      }
      return newSet
    })
  }

  const toggleActivityInfo = (activityId: string) => {
    setExpandedActivityInfo(prev => {
      const newSet = new Set(prev)
      if (newSet.has(activityId)) {
        newSet.delete(activityId)
      } else {
        newSet.add(activityId)
      }
      return newSet
    })
  }

  const exportData = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      appVersion: "1.0.0",
      activities: activities.map(activity => ({
        ...activity,
        startTime: activity.startTime.toISOString(),
        endTime: activity.endTime?.toISOString(),
        originalStartTime: activity.originalStartTime?.toISOString(),
        originalEndTime: activity.originalEndTime?.toISOString()
      }))
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `mamalog-activities-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)
        
        // Validate the imported data structure
        if (!importedData.activities || !Array.isArray(importedData.activities)) {
          alert('Invalid file format. Please select a valid MamaLog export file.')
          return
        }
        
        // Convert date strings back to Date objects
        const importedActivities: Activity[] = importedData.activities.map((activity: any) => ({
          ...activity,
          startTime: new Date(activity.startTime),
          endTime: activity.endTime ? new Date(activity.endTime) : undefined,
          originalStartTime: activity.originalStartTime ? new Date(activity.originalStartTime) : undefined,
          originalEndTime: activity.originalEndTime ? new Date(activity.originalEndTime) : undefined
        }))
        
        // Use hook function to import activities
        const importedCount = importActivities(importedActivities)
        
        if (importedCount === 0) {
          alert('No new activities found in the import file.')
          return
        }
        
        alert(`Successfully imported ${importedCount} new activities!`)
        
      } catch (error) {
        alert('Error reading file. Please ensure it\'s a valid MamaLog export file.')
        console.error('Import error:', error)
      }
    }
    
    reader.readAsText(file)
    // Reset the input so the same file can be imported again if needed
    event.target.value = ''
  }




  const todayActivities = activities.filter(activity => isToday(activity.startTime))
  const yesterdayActivities = activities.filter(activity => isYesterday(activity.startTime))
  const historicalActivities = activities.filter(activity => !isTodayOrYesterday(activity.startTime))
  const historicalGroups = groupActivitiesByDate(historicalActivities)

  return (
    <div 
      className="app"
      onTouchStart={handleGlobalTouchStart}
      onTouchMove={handleGlobalTouchMove}
      onTouchEnd={handleGlobalTouchEnd}
    >
      <SettingsMenu
        showBurgerMenu={showBurgerMenu}
        isDarkMode={isDarkMode}
        activities={activities}
        currentView={currentView}
        themeName={themeName}
        onToggleMenu={() => setShowBurgerMenu(!showBurgerMenu)}
        onToggleTheme={toggleDarkMode}
        onSetTheme={setTheme}
        onExportData={exportData}
        onImportData={importData}
        onToggleView={() => setCurrentView(currentView === 'activities' ? 'calendar' : 'activities')}
        onShowAbout={() => setShowAbout(true)}
        onCloseMenu={() => setShowBurgerMenu(false)}
      />

      <main className="main-content">
        {currentView === 'activities' ? (
          <div className="activities-view">
            <ActivityControls
              currentActivity={currentActivity}
              feedingIconRef={feedingIconRef}
              onActivityClick={handleActivityClick}
              onStartActivity={handleStartActivity}
              onAddQuickActivity={handleAddQuickActivity}
            />

        <div className="activity-log">
          {todayActivities.length > 0 && (
            <>
              <h3>Today</h3>
              <ul>
                {todayActivities.slice(0, 10).map(activity => (
                <li key={activity.id}>
                  <ActivityItem
                    activity={activity}
                    editingActivity={editingActivity}
                    touchState={touchState}
                    slidingOutItems={slidingOutItems}
                    expandedActivityInfo={expandedActivityInfo}
                    currentTime={currentTime}
                    getSwipeTransform={getSwipeTransform}
                    getSwipeOpacity={getSwipeOpacity}
                    getSwipeBackgroundColor={getSwipeBackgroundColor}
                    getActivityIcon={getActivityIcon}
                    getActivityLabel={getActivityLabel}
                    formatTime={formatTime}
                    formatDuration={formatDuration}
                    formatLiveDuration={formatLiveDurationWrapper}
                    formatTimeForInput={formatTimeForInput}
                    parseTimeFromInput={parseTimeFromInput}
                    updateActivityData={updateActivityData}
                    deleteActivity={deleteActivity}
                    setEditingActivity={setEditingActivity}
                    toggleActivityInfo={toggleActivityInfo}
                  />
                </li>
                ))}
              </ul>
            </>
          )}
          
          {yesterdayActivities.length > 0 && (
            <>
              <h3>Yesterday</h3>
              <ul>
                {yesterdayActivities.slice(0, 10).map(activity => (
                <li key={activity.id}>
                  <ActivityItem
                    activity={activity}
                    editingActivity={editingActivity}
                    touchState={touchState}
                    slidingOutItems={slidingOutItems}
                    expandedActivityInfo={expandedActivityInfo}
                    currentTime={currentTime}
                    getSwipeTransform={getSwipeTransform}
                    getSwipeOpacity={getSwipeOpacity}
                    getSwipeBackgroundColor={getSwipeBackgroundColor}
                    getActivityIcon={getActivityIcon}
                    getActivityLabel={getActivityLabel}
                    formatTime={formatTime}
                    formatDuration={formatDuration}
                    formatLiveDuration={formatLiveDurationWrapper}
                    formatTimeForInput={formatTimeForInput}
                    parseTimeFromInput={parseTimeFromInput}
                    updateActivityData={updateActivityData}
                    deleteActivity={deleteActivity}
                    setEditingActivity={setEditingActivity}
                    toggleActivityInfo={toggleActivityInfo}
                  />
                </li>
                ))}
              </ul>
            </>
          )}
          
          {todayActivities.length === 0 && yesterdayActivities.length === 0 && (
            <p>No recent activities</p>
          )}
        </div>

        {Object.keys(historicalGroups).length > 0 && (
          <div className="historical-log">
            <h3>History</h3>
            {Object.entries(historicalGroups)
              .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
              .map(([dateKey, dayActivities]) => (
                <div key={dateKey} className="date-group">
                  <button 
                    className="date-header"
                    onClick={() => toggleDateExpansion(dateKey)}
                  >
                    <span>{formatDate(new Date(dateKey))}</span>
                    <span className="activity-count">({dayActivities.length} activities)</span>
                    <span className="expand-icon">
                      {expandedDates.has(dateKey) ? '▼' : '▶'}
                    </span>
                  </button>
                  
                  {expandedDates.has(dateKey) && (
                    <ul className="date-activities">
                      {dayActivities.map(activity => (
                        <li key={activity.id}>
                          <div
                            className={`activity-item ${touchState.gestureType === 'activity-swipe' && touchState.activityId === activity.id ? 'swiping' : ''}`}
                            data-activity-id={activity.id}
                            style={{
                              transform: getSwipeTransform(activity.id),
                              opacity: getSwipeOpacity(activity.id),
                              backgroundColor: getSwipeBackgroundColor(activity.id),
                              transition: (touchState.gestureType === 'activity-swipe' && touchState.activityId === activity.id) ? 'none' : 
                                         slidingOutItems.has(activity.id) ? 'transform 0.3s ease-out, opacity 0.3s ease-out' :
                                         'transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease'
                            }}
                          >
                          {editingActivity === activity.id ? (
                            <div className="edit-form">
                              <div className="edit-row">
                                <span className="activity-type">
                                  {getActivityIcon(activity.type)} {getActivityLabel(activity)}
                                </span>
                                <button 
                                  className="delete-btn"
                                  onClick={() => deleteActivity(activity.id)}
                                  title="Delete activity"
                                >
                                  <TbTrash />
                                </button>
                              </div>
                              {(activity.type === 'breastfeeding' || activity.type === 'sleep') && activity.endTime && (
                                <div className="edit-row">
                                  <label>End:</label>
                                  <input
                                    type="datetime-local"
                                    value={formatTimeForInput(activity.endTime)}
                                    onChange={(e) => {
                                      const newEndTime = parseTimeFromInput(e.target.value)
                                      // Ensure end time is not before start time
                                      if (newEndTime < activity.startTime) {
                                        // If end time is before start time, also update start time
                                        updateActivityData(activity.id, { startTime: newEndTime, endTime: newEndTime })
                                      } else {
                                        updateActivityData(activity.id, { endTime: newEndTime })
                                      }
                                    }}
                                  />
                                </div>
                              )}
                              <div className="edit-row">
                                <label>{(activity.type === 'breastfeeding' || activity.type === 'sleep') ? 'Start:' : 'Time:'}</label>
                                <input
                                  type="datetime-local"
                                  value={formatTimeForInput(activity.startTime)}
                                  onChange={(e) => {
                                    const newStartTime = parseTimeFromInput(e.target.value)
                                    // Ensure start time is not after end time
                                    if (activity.endTime && newStartTime > activity.endTime) {
                                      // If start time is after end time, also update end time
                                      updateActivityData(activity.id, { startTime: newStartTime, endTime: newStartTime })
                                    } else {
                                      updateActivityData(activity.id, { startTime: newStartTime })
                                    }
                                  }}
                                />
                              </div>
                              {activity.type === 'breastfeeding' && (
                                <div className="edit-row">
                                  <label>Type:</label>
                                  <select
                                    value={activity.feedingType || 'left'}
                                    onChange={(e) => {
                                      updateActivityData(activity.id, { feedingType: e.target.value as 'left' | 'right' | 'bottle' })
                                    }}
                                  >
                                    <option value="left">Left Breast</option>
                                    <option value="right">Right Breast</option>
                                    <option value="bottle">Bottle</option>
                                  </select>
                                </div>
                              )}
                              {activity.type === 'diaper' && (
                                <div className="edit-row">
                                  <label>Type:</label>
                                  <select
                                    value={activity.diaperType || 'pee'}
                                    onChange={(e) => {
                                      updateActivityData(activity.id, { diaperType: e.target.value as 'pee' | 'poo' | 'both' })
                                    }}
                                  >
                                    <option value="pee">Pee</option>
                                    <option value="poo">Poo</option>
                                    <option value="both">Both</option>
                                  </select>
                                </div>
                              )}
                              <div className="edit-row">
                                <label>Notes:</label>
                                <textarea
                                  value={activity.notes || ''}
                                  onChange={(e) => {
                                    updateActivityData(activity.id, { notes: e.target.value })
                                  }}
                                  placeholder=" ..."
                                  rows={2}
                                />
                              </div>
                              <div className="edit-actions">
                                <button 
                                  className="save-btn"
                                  onClick={() => setEditingActivity(null)}
                                >
                                  Save
                                </button>
                                <button 
                                  className="cancel-btn"
                                  onClick={() => setEditingActivity(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <span className="activity-type">
                                <span 
                                  className="activity-icon-container"
                                  style={{
                                    transform: `scale(1)`,
                                    transition: (touchState.gestureType === 'activity-swipe' && touchState.activityId === activity.id) ? 'none' : 'transform 0.2s ease'
                                  }}
                                >
                                  {getActivityIcon(activity.type)}
                                </span>
                                {' '}
                                {getActivityLabel(activity)}
                              </span>
                              <div className="activity-info">
                                <div className="activity-time-container">
                                  <span className="activity-time">
                                    {(activity.type === 'breastfeeding' || activity.type === 'sleep') ? (
                                      <>
                                        {formatTime(activity.startTime)}
                                        {activity.endTime && ` - ${formatTime(activity.endTime)}`}
                                        {activity.endTime && (
                                          <span className="duration">
                                            ({formatDuration(activity.startTime, activity.endTime)})
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      formatTime(activity.startTime)
                                    )}
                                    {activity.feedingType && (
                                      <span className="activity-subtype"> ({activity.feedingType})</span>
                                    )}
                                    {activity.diaperType && (
                                      <span className="activity-subtype"> ({activity.diaperType})</span>
                                    )}
                                  </span>
                                  
                                  {expandedActivityInfo.has(activity.id) && activity.originalStartTime && (
                                    <div className="original-info">
                                      <span className="original-time">
                                        {(activity.type === 'breastfeeding' || activity.type === 'sleep') ? (
                                          <>
                                            {formatTime(activity.originalStartTime)}
                                            {activity.originalEndTime && ` - ${formatTime(activity.originalEndTime)}`}
                                            {activity.originalEndTime && (
                                              <span className="duration">
                                                ({formatDuration(activity.originalStartTime, activity.originalEndTime)})
                                              </span>
                                            )}
                                          </>
                                        ) : (
                                          formatTime(activity.originalStartTime)
                                        )}
                                        {activity.originalFeedingType && (
                                          <span className="activity-subtype"> ({activity.originalFeedingType})</span>
                                        )}
                                        {activity.originalDiaperType && (
                                          <span className="activity-subtype"> ({activity.originalDiaperType})</span>
                                        )}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="activity-buttons">
                                  {activity.originalStartTime && (
                                    <button 
                                      className="info-btn"
                                      onClick={() => toggleActivityInfo(activity.id)}
                                      title="View original activity info"
                                    >
                                      <TbInfoCircle />
                                    </button>
                                  )}
                                  <button 
                                    className="edit-btn"
                                    onClick={() => setEditingActivity(activity.id)}
                                    title="Edit activity"
                                  >
                                    <TbEdit />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
          </div>
        )}
          </div>
        ) : (
          <Calendar 
            activities={activities}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
          />
        )}
      </main>
      
      {/* About Modal */}
      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}
      
      {/* Day Detail Modal */}
      {selectedDay && (
        <DayDetailModal
          selectedDay={selectedDay}
          activities={activities}
          editingActivity={editingActivity}
          touchState={touchState}
          slidingOutItems={slidingOutItems}
          expandedActivityInfo={expandedActivityInfo}
          currentTime={currentTime}
          getSwipeTransform={getSwipeTransform}
          getSwipeOpacity={getSwipeOpacity}
          getSwipeBackgroundColor={getSwipeBackgroundColor}
          getActivityIcon={getActivityIcon}
          getActivityLabel={getActivityLabel}
          formatTime={formatTime}
          formatDuration={formatDuration}
          formatLiveDuration={formatLiveDurationWrapper}
          formatTimeForInput={formatTimeForInput}
          parseTimeFromInput={parseTimeFromInput}
          updateActivityData={updateActivityData}
          deleteActivity={deleteActivity}
          setEditingActivity={setEditingActivity}
          toggleActivityInfo={toggleActivityInfo}
          onClose={() => setSelectedDay(null)}
        />
      )}
      
      {/* Undo Toast */}
      {recentlyDeleted && (
        <UndoToast onUndo={undoDelete} />
      )}
    </div>
  )
}

export default App
