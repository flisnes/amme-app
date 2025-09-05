import { useState, useEffect } from 'react'
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
import { formatTime, formatDuration, formatLiveDuration, formatTimeForInput, parseTimeFromInput, isToday, isYesterday } from './utils/dateUtils'
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
    dailyStats,
    startActivity,
    stopActivity,
    addQuickActivity,
    updateActivityDataTemporary,
    commitActivityDataChanges,
    cancelActivityDataChanges,
    deleteActivity,
    undoDelete,
    importActivities,
    resumeActivity,
    getLastResumableActivity,
    startEditingActivity
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
  
  // Update current time every second for live duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  


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

  const handleStartEditing = (activityId: string) => {
    startEditingActivity(activityId)
    setEditingActivity(activityId)
  }

  const handleCancelEditing = () => {
    setEditingActivity(null)
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
    const filename = `mamalog-activities-${new Date().toISOString().split('T')[0]}.json`
    
    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    
    if (navigator.share && isMobile) {
      // Use Web Share API on mobile devices that support it
      const blob = new Blob([dataStr], { type: 'application/json' })
      const file = new File([blob], filename, { type: 'application/json' })
      
      navigator.share({
        files: [file],
        title: 'MamaLog Activities Export',
        text: 'Export of your MamaLog activities data'
      }).catch(error => {
        console.log('Share API failed, falling back to download:', error)
        fallbackDownload(dataStr, filename)
      })
    } else if (isIOSSafari) {
      // Special handling for iOS Safari
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
      const newWindow = window.open(dataUri, '_blank')
      
      if (!newWindow) {
        // Fallback if popup blocked
        copyToClipboardFallback(dataStr, filename)
      }
    } else {
      // Standard download for desktop browsers
      fallbackDownload(dataStr, filename)
    }
  }
  
  const fallbackDownload = (dataStr: string, filename: string) => {
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    
    // Add a small delay for better mobile compatibility
    setTimeout(() => {
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    }, 100)
  }
  
  const copyToClipboardFallback = (dataStr: string, filename: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(dataStr).then(() => {
        alert(`Export data copied to clipboard! You can paste it into a text file and save as "${filename}"`)
      }).catch(() => {
        showManualCopyDialog(dataStr, filename)
      })
    } else {
      showManualCopyDialog(dataStr, filename)
    }
  }
  
  const showManualCopyDialog = (dataStr: string, filename: string) => {
    const message = `Your browser doesn't support automatic downloads. Please copy the following data manually and save it as "${filename}":\n\n${dataStr.substring(0, 200)}...`
    alert(message)
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
  const hasOlderActivities = activities.some(activity => !isToday(activity.startTime) && !isYesterday(activity.startTime))

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
              onActivityClick={handleActivityClick}
              onStartActivity={handleStartActivity}
              onAddQuickActivity={handleAddQuickActivity}
            />

        <div className="activity-log">
          {todayActivities.length > 0 && (
            <>
              <h3>Today</h3>
              <ul>
                {todayActivities.map(activity => (
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
                    updateActivityDataTemporary={updateActivityDataTemporary}
                    commitActivityDataChanges={commitActivityDataChanges}
                    cancelActivityDataChanges={cancelActivityDataChanges}
                    deleteActivity={deleteActivity}
                    setEditingActivity={handleStartEditing}
                    cancelEditingActivity={handleCancelEditing}
                    toggleActivityInfo={toggleActivityInfo}
                    resumeActivity={resumeActivity}
                    currentActivity={currentActivity}
                    getLastResumableActivity={getLastResumableActivity}
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
                    updateActivityDataTemporary={updateActivityDataTemporary}
                    commitActivityDataChanges={commitActivityDataChanges}
                    cancelActivityDataChanges={cancelActivityDataChanges}
                    deleteActivity={deleteActivity}
                    setEditingActivity={handleStartEditing}
                    cancelEditingActivity={handleCancelEditing}
                    toggleActivityInfo={toggleActivityInfo}
                    resumeActivity={resumeActivity}
                    currentActivity={currentActivity}
                    getLastResumableActivity={getLastResumableActivity}
                  />
                </li>
                ))}
              </ul>
            </>
          )}
          
          {todayActivities.length === 0 && yesterdayActivities.length === 0 && (
            <div className="no-recent-activities">
              {activities.length === 0 ? (
                <>
                  <p>Welcome to your baby activity tracker!</p>
                  <p>Tap the buttons above to record feeding, sleep, and diaper changes when they happen.</p>
                </>
              ) : (
                <>
                  <p>No recent activities</p>
                  <div className="view-hint">
                    <p>{hasOlderActivities ? 'Swipe left to view calendar for older activities' : 'Swipe left for calendar view'}</p>
                  </div>
                </>
              )}
            </div>
          )}
          
          {(todayActivities.length > 0 || yesterdayActivities.length > 0) && (
            <div className="view-hint">
              <p>{hasOlderActivities ? 'Swipe left to view calendar for older activities' : 'Swipe left for calendar view'}</p>
            </div>
          )}
        </div>

          </div>
        ) : (
          <Calendar 
            activities={activities}
            dailyStats={dailyStats}
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
          updateActivityDataTemporary={updateActivityDataTemporary}
          commitActivityDataChanges={commitActivityDataChanges}
          cancelActivityDataChanges={cancelActivityDataChanges}
          deleteActivity={deleteActivity}
          setEditingActivity={handleStartEditing}
          cancelEditingActivity={handleCancelEditing}
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
