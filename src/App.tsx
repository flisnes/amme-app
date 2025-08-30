import { useState, useEffect, useRef } from 'react'
import { TbDiaper, TbBottle, TbMoon, TbArrowBigLeft, TbArrowBigRight, TbBabyBottle, TbDroplet, TbPoo, TbTrash, TbEdit } from 'react-icons/tb'
import './App.css'

type ActivityType = 'breastfeeding' | 'diaper' | 'sleep'

interface Activity {
  id: string
  type: ActivityType
  startTime: Date
  endTime?: Date
  notes?: string
  diaperType?: 'pee' | 'poo' | 'both'
  feedingType?: 'left' | 'right' | 'bottle'
}

function App() {
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [editingActivity, setEditingActivity] = useState<string | null>(null)
  const [swipeStates, setSwipeStates] = useState<Record<string, { startX: number; startY: number; currentX: number; currentY: number; isDragging: boolean; isActive: boolean }>>({})
  const [slidingOutItems, setSlidingOutItems] = useState<Set<string>>(new Set())
  const [recentlyDeleted, setRecentlyDeleted] = useState<{activity: Activity, timeoutId: number} | null>(null)
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
  const [showDiaperOptions, setShowDiaperOptions] = useState(false)
  const [showFeedingOptions, setShowFeedingOptions] = useState(false)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    const savedActivities = localStorage.getItem('babyTracker_activities')
    const savedCurrentActivity = localStorage.getItem('babyTracker_currentActivity')
    const savedDarkMode = localStorage.getItem('babyTracker_darkMode')
    
    if (savedActivities) {
      const parsed = JSON.parse(savedActivities).map((activity: any) => ({
        ...activity,
        startTime: new Date(activity.startTime),
        endTime: activity.endTime ? new Date(activity.endTime) : undefined
      }))
      setActivities(parsed)
    }
    
    if (savedCurrentActivity) {
      const parsed = JSON.parse(savedCurrentActivity)
      setCurrentActivity({
        ...parsed,
        startTime: new Date(parsed.startTime)
      })
    }
    
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('babyTracker_activities', JSON.stringify(activities))
  }, [activities])

  useEffect(() => {
    if (currentActivity) {
      localStorage.setItem('babyTracker_currentActivity', JSON.stringify(currentActivity))
    } else {
      localStorage.removeItem('babyTracker_currentActivity')
    }
  }, [currentActivity])

  useEffect(() => {
    localStorage.setItem('babyTracker_darkMode', JSON.stringify(isDarkMode))
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const startActivity = (type: ActivityType, feedingType?: 'left' | 'right' | 'bottle') => {
    // If there's already a current activity, stop it first
    if (currentActivity) {
      const completedActivity = {
        ...currentActivity,
        endTime: new Date()
      }
      setActivities(prev => prev.map(activity => 
        activity.id === currentActivity.id ? completedActivity : activity
      ))
    }

    // Start the new activity
    const activity: Activity = {
      id: Date.now().toString(),
      type,
      startTime: new Date(),
      ...(type === 'breastfeeding' && feedingType ? { feedingType } : {})
    }
    setCurrentActivity(activity)
    
    // Immediately add the ongoing activity to the log
    setActivities(prev => {
      const newActivities = [activity, ...prev]
      return newActivities.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    })
    
    // Close feeding options if they were open
    setShowFeedingOptions(false)
  }

  const stopActivity = () => {
    if (currentActivity) {
      const completedActivity = {
        ...currentActivity,
        endTime: new Date()
      }
      // Update the existing activity in the log with the end time
      setActivities(prev => prev.map(activity => 
        activity.id === currentActivity.id ? completedActivity : activity
      ))
      setCurrentActivity(null)
    }
  }

  const addQuickActivity = (type: ActivityType, diaperType?: 'pee' | 'poo' | 'both') => {
    // If there's a current activity (feeding/sleeping), stop it first
    if (currentActivity) {
      const completedActivity = {
        ...currentActivity,
        endTime: new Date()
      }
      setActivities(prev => prev.map(activity => 
        activity.id === currentActivity.id ? completedActivity : activity
      ))
      setCurrentActivity(null)
    }

    // Add the new instant activity
    const activity: Activity = {
      id: Date.now().toString(),
      type,
      startTime: new Date(),
      endTime: new Date(),
      ...(type === 'diaper' && diaperType ? { diaperType } : {})
    }
    setActivities(prev => {
      const newActivities = [activity, ...prev]
      // Sort to maintain chronological order (newest first)
      return newActivities.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    })
    
    // Close diaper options if they were open
    setShowDiaperOptions(false)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const formatDuration = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime()
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else {
      return `${minutes}m ${seconds}s`
    }
  }
  
  const formatLiveDuration = (startTime: Date) => {
    const diffMs = currentTime.getTime() - startTime.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'breastfeeding': return <TbBottle size={20} />
      case 'diaper': return <TbDiaper size={20} />
      case 'sleep': return <TbMoon size={20} />
      default: return '📝'
    }
  }

  const getActivityLabel = (activity: Activity) => {
    switch (activity.type) {
      case 'breastfeeding': 
        if (activity.feedingType) {
          return `Feeding (${activity.feedingType})`
        }
        return 'Feeding'
      case 'diaper': 
        if (activity.diaperType) {
          return `Diaper (${activity.diaperType})`
        }
        return 'Diaper'
      case 'sleep': return 'Sleep'
      default: return 'Activity'
    }
  }

  const handleActivityClick = (type: ActivityType) => {
    if (type === 'breastfeeding') {
      // Close diaper options if they're open
      setShowDiaperOptions(false)
      
      if (currentActivity?.type === 'breastfeeding') {
        stopActivity()
      } else {
        setShowFeedingOptions(true)
      }
    } else if (type === 'diaper') {
      // Close feeding options if they're open
      setShowFeedingOptions(false)
      
      setShowDiaperOptions(true)
    } else {
      // Close both option modals if user clicks another button
      setShowFeedingOptions(false)
      setShowDiaperOptions(false)
      
      if (type === 'sleep') {
        if (currentActivity?.type === 'sleep') {
          stopActivity()
        } else {
          startActivity(type)
        }
      }
    }
  }

  const deleteActivity = (id: string) => {
    const activityToDelete = activities.find(activity => activity.id === id)
    if (!activityToDelete) return
    
    // Remove from activities list
    setActivities(prev => prev.filter(activity => activity.id !== id))
    
    // Clear any existing undo timeout
    if (recentlyDeleted?.timeoutId) {
      clearTimeout(recentlyDeleted.timeoutId)
    }
    
    // Set up new undo timeout (5 seconds)
    const timeoutId = setTimeout(() => {
      setRecentlyDeleted(null)
    }, 5000)
    
    setRecentlyDeleted({
      activity: activityToDelete,
      timeoutId
    })
  }
  
  const undoDelete = () => {
    if (!recentlyDeleted) return
    
    // Clear the timeout
    clearTimeout(recentlyDeleted.timeoutId)
    
    // Restore the activity
    setActivities(prev => {
      const restored = [...prev, recentlyDeleted.activity]
      // Sort by startTime to maintain chronological order
      return restored.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    })
    
    // Clear the recently deleted state
    setRecentlyDeleted(null)
  }

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities(prev => {
      const updatedActivities = prev.map(activity => 
        activity.id === id ? { ...activity, ...updates } : activity
      )
      
      // Re-sort activities by start time (newest first) to maintain chronological order
      return updatedActivities.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    })
    setEditingActivity(null)
  }

  const formatTimeForInput = (date: Date) => {
    // Format for datetime-local input (YYYY-MM-DDTHH:MM) in local timezone
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const parseTimeFromInput = (timeString: string) => {
    // Parse datetime-local input as local time consistently across environments
    // Split the datetime-local format: "YYYY-MM-DDTHH:MM"
    const [datePart, timePart] = timeString.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hours, minutes] = timePart.split(':').map(Number)
    
    // Create date object with explicit local time components
    return new Date(year, month - 1, day, hours, minutes, 0, 0)
  }
  
  const formatTimeOnlyForInput = (date: Date) => {
    // Format for time input (HH:MM) in local timezone
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }
  
  const parseTimeOnlyFromInput = (timeString: string, baseDate: Date) => {
    // Parse time-only input and combine with existing date
    const [hours, minutes] = timeString.split(':').map(Number)
    const newDate = new Date(baseDate)
    newDate.setHours(hours, minutes, 0, 0)
    return newDate
  }

  const handleTouchStart = (e: React.TouchEvent, activityId: string) => {
    const touch = e.touches[0]
    setSwipeStates(prev => ({
      ...prev,
      [activityId]: {
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        isDragging: true,
        isActive: false
      }
    }))
  }

  const handleTouchMove = (e: React.TouchEvent, activityId: string) => {
    const touch = e.touches[0]
    const swipeState = swipeStates[activityId]
    
    if (swipeState?.isDragging) {
      const horizontalDistance = touch.clientX - swipeState.startX
      const verticalDistance = Math.abs(touch.clientY - swipeState.startY)
      const threshold = 30
      
      // Only activate if moving mostly horizontally (not vertical scrolling)
      const isHorizontalGesture = horizontalDistance > threshold && verticalDistance < threshold * 2
      
      setSwipeStates(prev => ({
        ...prev,
        [activityId]: {
          ...swipeState,
          currentX: touch.clientX,
          currentY: touch.clientY,
          isActive: isHorizontalGesture && horizontalDistance > 0
        }
      }))
    }
  }

  const handleTouchEnd = (activityId: string) => {
    const swipeState = swipeStates[activityId]
    
    if (swipeState?.isDragging) {
      const swipeDistance = swipeState.currentX - swipeState.startX
      const swipeThreshold = window.innerWidth * 0.4 // 2/5 of screen width - easier to trigger
      
      if (swipeDistance > swipeThreshold && swipeState.isActive) {
        // Start slide-out animation
        setSlidingOutItems(prev => new Set(prev).add(activityId))
        
        // Delete after animation completes
        setTimeout(() => {
          deleteActivity(activityId)
          setSlidingOutItems(prev => {
            const newSet = new Set(prev)
            newSet.delete(activityId)
            return newSet
          })
        }, 300) // Match animation duration
      }
      
      // Reset swipe state
      setSwipeStates(prev => {
        const newState = { ...prev }
        delete newState[activityId]
        return newState
      })
    }
  }

  const getSwipeTransform = (activityId: string) => {
    const swipeState = swipeStates[activityId]
    
    // If item is sliding out, move it completely off screen
    if (slidingOutItems.has(activityId)) {
      return `translateX(${window.innerWidth}px)`
    }
    
    if (swipeState?.isDragging && swipeState.isActive) {
      // Start movement from 0 when threshold is crossed, not from finger position
      const totalDistance = swipeState.currentX - swipeState.startX
      const threshold = 30
      const movementDistance = Math.max(0, totalDistance - threshold)
      return `translateX(${movementDistance}px)`
    }
    return 'translateX(0px)'
  }

  const getSwipeOpacity = (activityId: string) => {
    const swipeState = swipeStates[activityId]
    if (swipeState?.isDragging && swipeState.isActive) {
      const distance = Math.max(0, swipeState.currentX - swipeState.startX - 30) // Subtract threshold
      const opacity = Math.max(0.4, 1 - (distance / 170)) // Smoother fade
      return opacity
    }
    return 1
  }

  const getSwipeBackgroundColor = (activityId: string) => {
    const swipeState = swipeStates[activityId]
    if (swipeState?.isDragging && swipeState.isActive) {
      const distance = Math.max(0, swipeState.currentX - swipeState.startX - 30) // Subtract threshold
      const intensity = Math.min(1, distance / 120) // Fully red at 150px total (120px after threshold)
      
      // Clean transition: transparent → light red → dark red
      const alpha = Math.min(0.8, intensity * 1.2) // Max 80% opacity
      const red = Math.floor(220 + (35 * intensity)) // From light red (220) to dark red (255)
      
      return `rgba(${red}, 60, 60, ${alpha})`
    }
    return ''
  }



  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isYesterday = (date: Date) => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return date.toDateString() === yesterday.toDateString()
  }

  const isTodayOrYesterday = (date: Date) => {
    return isToday(date) || isYesterday(date)
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

  const todayActivities = activities.filter(activity => isToday(activity.startTime))
  const yesterdayActivities = activities.filter(activity => isYesterday(activity.startTime))
  const historicalActivities = activities.filter(activity => !isTodayOrYesterday(activity.startTime))
  const historicalGroups = groupActivitiesByDate(historicalActivities)

  return (
    <div className="app">
      <header className="app-header">
        <h1>MamaLog</h1>
        <button 
          className="theme-toggle"
          onClick={() => setIsDarkMode(!isDarkMode)}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </header>

      <main className="main-content">
        <div className="button-grid">
          <button 
            className={`activity-btn ${currentActivity?.type === 'breastfeeding' ? 'active' : ''}`}
            onClick={() => handleActivityClick('breastfeeding')}
          >
            <span className="activity-icon"><TbBottle size={24} /></span>
            <span className="activity-label">
              {currentActivity?.type === 'breastfeeding' ? 'Stop Feeding' : 'Start Feeding'}
            </span>
          </button>
          
          <button 
            className="activity-btn"
            onClick={() => handleActivityClick('diaper')}
          >
            <span className="activity-icon"><TbDiaper size={24} /></span>
            <span className="activity-label">Diaper</span>
          </button>
          
          <button 
            className={`activity-btn ${currentActivity?.type === 'sleep' ? 'active' : ''}`}
            onClick={() => handleActivityClick('sleep')}
          >
            <span className="activity-icon"><TbMoon size={24} /></span>
            <span className="activity-label">
              {currentActivity?.type === 'sleep' ? 'Stop Sleep' : 'Start Sleep'}
            </span>
          </button>
        </div>

        {currentActivity && (
          <div className="active-session">
            <p>
              <span 
                className={`activity-icon-animated ${currentActivity.type === 'sleep' ? 'sleeping' : currentActivity.type === 'breastfeeding' ? 'feeding' : ''}`}
                ref={currentActivity.type === 'breastfeeding' ? feedingIconRef : null}
              >
                {getActivityIcon(currentActivity.type)}
                {currentActivity.type === 'sleep' && (
                  <>
                    <span className="floating-z z1">z</span>
                    <span className="floating-z z2">z</span>
                    <span className="floating-z z3">Z</span>
                  </>
                )}
                {currentActivity.type === 'breastfeeding' && (
                  <div className="feeding-emitter" />
                )}
              </span>
              {' '}{getActivityLabel(currentActivity)} started at {formatTime(currentActivity.startTime)}
            </p>
            {(currentActivity.type === 'sleep' || currentActivity.type === 'breastfeeding') && (
              <div className={`duration-display ${currentActivity.type === 'breastfeeding' ? 'feeding-duration' : ''}`}>
                {formatLiveDuration(currentActivity.startTime)}
              </div>
            )}
            <button className="stop-session-btn" onClick={stopActivity}>
              Stop {getActivityLabel(currentActivity)}
            </button>
          </div>
        )}

        {showDiaperOptions && (
          <div className="diaper-options">
            <h3>What type of diaper change?</h3>
            <div className="diaper-buttons">
              <button 
                className="diaper-type-btn pee"
                onClick={() => addQuickActivity('diaper', 'pee')}
              >
                <TbDroplet size={20} /> Pee
              </button>
              <button 
                className="diaper-type-btn poo"
                onClick={() => addQuickActivity('diaper', 'poo')}
              >
                <TbPoo size={20} /> Poo
              </button>
              <button 
                className="diaper-type-btn both"
                onClick={() => addQuickActivity('diaper', 'both')}
              >
                <TbDroplet size={16} /><TbPoo size={16} /> Both
              </button>
            </div>
            <button 
              className="cancel-diaper-btn"
              onClick={() => setShowDiaperOptions(false)}
            >
              Cancel
            </button>
          </div>
        )}

        {showFeedingOptions && (
          <div className="feeding-options">
            <h3>What type of feeding?</h3>
            <div className="feeding-buttons">
              <div className="breast-buttons">
                <button 
                  className="feeding-type-btn left"
                  onClick={() => startActivity('breastfeeding', 'left')}
                >
                  <TbArrowBigLeft size={20} /> Left Breast
                </button>
                <button 
                  className="feeding-type-btn right"
                  onClick={() => startActivity('breastfeeding', 'right')}
                >
                  Right Breast <TbArrowBigRight size={20} />
                </button>
              </div>
              <button 
                className="feeding-type-btn bottle"
                onClick={() => startActivity('breastfeeding', 'bottle')}
              >
                <TbBabyBottle size={20} /> Bottle
              </button>
            </div>
            <button 
              className="cancel-feeding-btn"
              onClick={() => setShowFeedingOptions(false)}
            >
              Cancel
            </button>
          </div>
        )}

        <div className="activity-log">
          {todayActivities.length > 0 && (
            <>
              <h3>Today</h3>
              <ul>
                {todayActivities.slice(0, 10).map(activity => (
                <li key={activity.id}>
                  <div
                    className={`activity-item ${swipeStates[activity.id]?.isDragging ? 'swiping' : ''}`}
                    style={{
                      transform: getSwipeTransform(activity.id),
                      opacity: getSwipeOpacity(activity.id),
                      backgroundColor: getSwipeBackgroundColor(activity.id),
                      transition: swipeStates[activity.id]?.isDragging ? 'none' : 
                                 slidingOutItems.has(activity.id) ? 'transform 0.3s ease-out, opacity 0.3s ease-out' :
                                 'transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease'
                    }}
                    onTouchStart={(e) => handleTouchStart(e, activity.id)}
                    onTouchMove={(e) => handleTouchMove(e, activity.id)}
                    onTouchEnd={() => handleTouchEnd(activity.id)}
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
                              updateActivity(activity.id, { startTime: newStartTime, endTime: newStartTime })
                            } else {
                              updateActivity(activity.id, { startTime: newStartTime })
                            }
                          }}
                        />
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
                                updateActivity(activity.id, { startTime: newEndTime, endTime: newEndTime })
                              } else {
                                updateActivity(activity.id, { endTime: newEndTime })
                              }
                            }}
                          />
                        </div>
                      )}
                      {activity.type === 'breastfeeding' && (
                        <div className="edit-row">
                          <label>Type:</label>
                          <select
                            value={activity.feedingType || 'left'}
                            onChange={(e) => {
                              updateActivity(activity.id, { feedingType: e.target.value as 'left' | 'right' | 'bottle' })
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
                              updateActivity(activity.id, { diaperType: e.target.value as 'pee' | 'poo' | 'both' })
                            }}
                          >
                            <option value="pee">Pee</option>
                            <option value="poo">Poo</option>
                            <option value="both">Both</option>
                          </select>
                        </div>
                      )}
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
                            transition: swipeStates[activity.id]?.isDragging ? 'none' : 'transform 0.2s ease'
                          }}
                        >
                          {getActivityIcon(activity.type)}
                        </span>
                        {' '}
                        {getActivityLabel(activity)}
                      </span>
                      <div className="activity-info">
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
                        </span>
                        <button 
                          className="edit-btn"
                          onClick={() => setEditingActivity(activity.id)}
                          title="Edit activity"
                        >
                          <TbEdit />
                        </button>
                      </div>
                    </>
                  )}
                  </div>
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
                  <div
                    className={`activity-item ${swipeStates[activity.id]?.isDragging ? 'swiping' : ''}`}
                    style={{
                      transform: getSwipeTransform(activity.id),
                      opacity: getSwipeOpacity(activity.id),
                      backgroundColor: getSwipeBackgroundColor(activity.id),
                      transition: swipeStates[activity.id]?.isDragging ? 'none' : 
                                 slidingOutItems.has(activity.id) ? 'transform 0.3s ease-out, opacity 0.3s ease-out' :
                                 'transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease'
                    }}
                    onTouchStart={(e) => handleTouchStart(e, activity.id)}
                    onTouchMove={(e) => handleTouchMove(e, activity.id)}
                    onTouchEnd={() => handleTouchEnd(activity.id)}
                  >
                  {editingActivity === activity.id ? (
                    <div className="edit-activity">
                      <div className="edit-row">
                        <label>Start Time:</label>
                        <input
                          type="time"
                          value={formatTimeOnlyForInput(activity.startTime)}
                          onChange={(e) => {
                            const newStartTime = parseTimeOnlyFromInput(e.target.value, activity.startTime)
                            updateActivity(activity.id, { startTime: newStartTime })
                          }}
                        />
                      </div>
                      {activity.endTime && (
                        <div className="edit-row">
                          <label>End Time:</label>
                          <input
                            type="time"
                            value={formatTimeOnlyForInput(activity.endTime)}
                            onChange={(e) => {
                              const newEndTime = parseTimeOnlyFromInput(e.target.value, activity.endTime!)
                              updateActivity(activity.id, { endTime: newEndTime })
                            }}
                          />
                        </div>
                      )}
                      {activity.type === 'breastfeeding' && (
                        <div className="edit-row">
                          <label>Type:</label>
                          <select
                            value={activity.feedingType || 'left'}
                            onChange={(e) => {
                              updateActivity(activity.id, { feedingType: e.target.value as 'left' | 'right' | 'bottle' })
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
                              updateActivity(activity.id, { diaperType: e.target.value as 'pee' | 'poo' | 'both' })
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
                        <input
                          type="text"
                          value={activity.notes || ''}
                          placeholder="Add notes..."
                          onChange={(e) => {
                            updateActivity(activity.id, { notes: e.target.value })
                          }}
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
                          className="delete-btn"
                          onClick={() => deleteActivity(activity.id)}
                          title="Delete activity"
                        >
                          <TbTrash />
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
                            transition: swipeStates[activity.id]?.isDragging ? 'none' : 'transform 0.2s ease'
                          }}
                        >
                          {getActivityIcon(activity.type)}
                        </span>
                        {' '}
                        {getActivityLabel(activity)}
                      </span>
                      <div className="activity-info">
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
                        </span>
                        <button 
                          className="edit-btn"
                          onClick={() => setEditingActivity(activity.id)}
                          title="Edit activity"
                        >
                          <TbEdit />
                        </button>
                      </div>
                    </>
                  )}
                  </div>
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
                            className={`activity-item ${swipeStates[activity.id]?.isDragging ? 'swiping' : ''}`}
                            style={{
                              transform: getSwipeTransform(activity.id),
                              opacity: getSwipeOpacity(activity.id),
                              backgroundColor: getSwipeBackgroundColor(activity.id),
                              transition: swipeStates[activity.id]?.isDragging ? 'none' : 
                                         slidingOutItems.has(activity.id) ? 'transform 0.3s ease-out, opacity 0.3s ease-out' :
                                         'transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease'
                            }}
                            onTouchStart={(e) => handleTouchStart(e, activity.id)}
                            onTouchMove={(e) => handleTouchMove(e, activity.id)}
                            onTouchEnd={() => handleTouchEnd(activity.id)}
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
                                      updateActivity(activity.id, { startTime: newStartTime, endTime: newStartTime })
                                    } else {
                                      updateActivity(activity.id, { startTime: newStartTime })
                                    }
                                  }}
                                />
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
                                        updateActivity(activity.id, { startTime: newEndTime, endTime: newEndTime })
                                      } else {
                                        updateActivity(activity.id, { endTime: newEndTime })
                                      }
                                    }}
                                  />
                                </div>
                              )}
                              {activity.type === 'breastfeeding' && (
                                <div className="edit-row">
                                  <label>Type:</label>
                                  <select
                                    value={activity.feedingType || 'left'}
                                    onChange={(e) => {
                                      updateActivity(activity.id, { feedingType: e.target.value as 'left' | 'right' | 'bottle' })
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
                                      updateActivity(activity.id, { diaperType: e.target.value as 'pee' | 'poo' | 'both' })
                                    }}
                                  >
                                    <option value="pee">Pee</option>
                                    <option value="poo">Poo</option>
                                    <option value="both">Both</option>
                                  </select>
                                </div>
                              )}
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
                                    transition: swipeStates[activity.id]?.isDragging ? 'none' : 'transform 0.2s ease'
                                  }}
                                >
                                  {getActivityIcon(activity.type)}
                                </span>
                                {' '}
                                {getActivityLabel(activity)}
                              </span>
                              <div className="activity-info">
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
                                </span>
                                <button 
                                  className="edit-btn"
                                  onClick={() => setEditingActivity(activity.id)}
                                  title="Edit activity"
                                >
                                  <TbEdit />
                                </button>
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
      </main>
      
      {/* Undo Toast */}
      {recentlyDeleted && (
        <div className="undo-toast">
          <span>Activity deleted</span>
          <button 
            className="undo-btn"
            onClick={undoDelete}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
}

export default App
