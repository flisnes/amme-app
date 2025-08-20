import { useState, useEffect } from 'react'
import './App.css'

type ActivityType = 'breastfeeding' | 'burping' | 'diaper' | 'sleep'

interface Activity {
  id: string
  type: ActivityType
  startTime: Date
  endTime?: Date
  notes?: string
  diaperType?: 'pee' | 'poo' | 'both'
}

function App() {
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [editingActivity, setEditingActivity] = useState<string | null>(null)
  const [swipeStates, setSwipeStates] = useState<Record<string, { startX: number; currentX: number; isDragging: boolean }>>({})
  const [slidingOutItems, setSlidingOutItems] = useState<Set<string>>(new Set())
  const [showDiaperOptions, setShowDiaperOptions] = useState(false)
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

  const startActivity = (type: ActivityType) => {
    // If there's already a current activity, stop it first
    if (currentActivity) {
      const completedActivity = {
        ...currentActivity,
        endTime: new Date()
      }
      setActivities(prev => {
        const newActivities = [completedActivity, ...prev]
        return newActivities.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      })
    }

    // Start the new activity
    const activity: Activity = {
      id: Date.now().toString(),
      type,
      startTime: new Date()
    }
    setCurrentActivity(activity)
  }

  const stopActivity = () => {
    if (currentActivity) {
      const completedActivity = {
        ...currentActivity,
        endTime: new Date()
      }
      setActivities(prev => {
        const newActivities = [completedActivity, ...prev]
        // Sort to maintain chronological order (newest first)
        return newActivities.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      })
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
      setActivities(prev => {
        const newActivities = [completedActivity, ...prev]
        return newActivities.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      })
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
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDuration = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'breastfeeding': return '🍼'
      case 'burping': return '💨'
      case 'diaper': return '👶'
      case 'sleep': return '😴'
      default: return '📝'
    }
  }

  const getActivityLabel = (activity: Activity) => {
    switch (activity.type) {
      case 'breastfeeding': return 'Feeding'
      case 'burping': return 'Burping'
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
    if (type === 'breastfeeding' || type === 'sleep') {
      if (currentActivity?.type === type) {
        stopActivity()
      } else {
        startActivity(type)
      }
    } else if (type === 'diaper') {
      setShowDiaperOptions(true)
    } else {
      addQuickActivity(type)
    }
  }

  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== id))
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
    return date.toISOString().slice(0, 16)
  }

  const parseTimeFromInput = (timeString: string) => {
    return new Date(timeString)
  }

  const handleTouchStart = (e: React.TouchEvent, activityId: string) => {
    const touch = e.touches[0]
    setSwipeStates(prev => ({
      ...prev,
      [activityId]: {
        startX: touch.clientX,
        currentX: touch.clientX,
        isDragging: true
      }
    }))
  }

  const handleTouchMove = (e: React.TouchEvent, activityId: string) => {
    const touch = e.touches[0]
    const swipeState = swipeStates[activityId]
    
    if (swipeState?.isDragging) {
      setSwipeStates(prev => ({
        ...prev,
        [activityId]: {
          ...swipeState,
          currentX: touch.clientX
        }
      }))
    }
  }

  const handleTouchEnd = (activityId: string) => {
    const swipeState = swipeStates[activityId]
    
    if (swipeState?.isDragging) {
      const swipeDistance = swipeState.currentX - swipeState.startX
      const swipeThreshold = window.innerWidth * 0.6 // 3/5 of screen width
      
      if (swipeDistance > swipeThreshold) {
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
    
    if (swipeState?.isDragging) {
      const distance = Math.max(0, swipeState.currentX - swipeState.startX)
      return `translateX(${distance}px)`
    }
    return 'translateX(0px)'
  }

  const getSwipeOpacity = (activityId: string) => {
    const swipeState = swipeStates[activityId]
    if (swipeState?.isDragging) {
      const distance = Math.max(0, swipeState.currentX - swipeState.startX)
      const opacity = Math.max(0.3, 1 - (distance / 200))
      return opacity
    }
    return 1
  }

  const getSwipeBackgroundColor = (activityId: string) => {
    const swipeState = swipeStates[activityId]
    if (swipeState?.isDragging) {
      const distance = Math.max(0, swipeState.currentX - swipeState.startX)
      const intensity = Math.min(1, distance / 150) // Fully red at 150px
      const red = Math.floor(255 * intensity)
      const green = Math.floor(255 * (1 - intensity * 0.8)) // Keep some green initially
      const blue = Math.floor(255 * (1 - intensity * 0.8))
      return `rgb(${red}, ${green}, ${blue})`
    }
    return ''
  }

  const getDeleteIconScale = (activityId: string) => {
    const swipeState = swipeStates[activityId]
    if (swipeState?.isDragging) {
      const distance = Math.max(0, swipeState.currentX - swipeState.startX)
      const scale = Math.min(2, 1 + (distance / 100)) // Scale from 1x to 2x over 100px
      return scale
    }
    return 1
  }

  const shouldShowDeleteIcon = (activityId: string) => {
    const swipeState = swipeStates[activityId]
    if (swipeState?.isDragging) {
      const distance = Math.max(0, swipeState.currentX - swipeState.startX)
      return distance > 20 // Show delete icon after 20px swipe
    }
    return false
  }

  const isWithin24Hours = (date: Date) => {
    const now = new Date()
    const timeDiff = now.getTime() - date.getTime()
    return timeDiff < 24 * 60 * 60 * 1000 // 24 hours in milliseconds
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

  const recentActivities = activities.filter(activity => isWithin24Hours(activity.startTime))
  const historicalActivities = activities.filter(activity => !isWithin24Hours(activity.startTime))
  const historicalGroups = groupActivitiesByDate(historicalActivities)

  return (
    <div className="app">
      <header className="app-header">
        <h1>Baby Tracker</h1>
        <button 
          className="theme-toggle"
          onClick={() => setIsDarkMode(!isDarkMode)}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </header>

      <main className="main-content">
        {currentActivity && (
          <div className="active-session">
            <p>
              {getActivityIcon(currentActivity.type)} {getActivityLabel(currentActivity)} started at {formatTime(currentActivity.startTime)}
            </p>
            <button className="stop-session-btn" onClick={stopActivity}>
              Stop {getActivityLabel(currentActivity)}
            </button>
          </div>
        )}

        <div className="button-grid">
          <button 
            className={`activity-btn ${currentActivity?.type === 'breastfeeding' ? 'active' : ''}`}
            onClick={() => handleActivityClick('breastfeeding')}
          >
            <span className="activity-icon">🍼</span>
            <span className="activity-label">
              {currentActivity?.type === 'breastfeeding' ? 'Stop Feeding' : 'Start Feeding'}
            </span>
          </button>
          
          <button 
            className="activity-btn"
            onClick={() => handleActivityClick('burping')}
          >
            <span className="activity-icon">💨</span>
            <span className="activity-label">Burping</span>
          </button>
          
          <button 
            className="activity-btn"
            onClick={() => handleActivityClick('diaper')}
          >
            <span className="activity-icon">👶</span>
            <span className="activity-label">Diaper</span>
          </button>
          
          <button 
            className={`activity-btn ${currentActivity?.type === 'sleep' ? 'active' : ''}`}
            onClick={() => handleActivityClick('sleep')}
          >
            <span className="activity-icon">😴</span>
            <span className="activity-label">
              {currentActivity?.type === 'sleep' ? 'Stop Sleep' : 'Start Sleep'}
            </span>
          </button>
        </div>

        {showDiaperOptions && (
          <div className="diaper-options">
            <h3>What type of diaper change?</h3>
            <div className="diaper-buttons">
              <button 
                className="diaper-type-btn pee"
                onClick={() => addQuickActivity('diaper', 'pee')}
              >
                💧 Pee
              </button>
              <button 
                className="diaper-type-btn poo"
                onClick={() => addQuickActivity('diaper', 'poo')}
              >
                💩 Poo
              </button>
              <button 
                className="diaper-type-btn both"
                onClick={() => addQuickActivity('diaper', 'both')}
              >
                💧💩 Both
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

        <div className="activity-log">
          <h3>Recent Activities (Last 24 Hours)</h3>
          {recentActivities.length === 0 ? (
            <p>No recent activities</p>
          ) : (
            <ul>
              {recentActivities.slice(0, 10).map(activity => (
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
                          🗑️
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
                      {activity.type === 'diaper' && (
                        <div className="edit-row">
                          <label>Type:</label>
                          <select
                            value={activity.diaperType || 'pee'}
                            onChange={(e) => {
                              updateActivity(activity.id, { diaperType: e.target.value as 'pee' | 'poo' | 'both' })
                            }}
                          >
                            <option value="pee">💧 Pee</option>
                            <option value="poo">💩 Poo</option>
                            <option value="both">💧💩 Both</option>
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
                            transform: `scale(${getDeleteIconScale(activity.id)})`,
                            transition: swipeStates[activity.id]?.isDragging ? 'none' : 'transform 0.2s ease'
                          }}
                        >
                          {shouldShowDeleteIcon(activity.id) ? '🗑️' : getActivityIcon(activity.type)}
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
                          ✏️
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
                                  🗑️
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
                              {activity.type === 'diaper' && (
                                <div className="edit-row">
                                  <label>Type:</label>
                                  <select
                                    value={activity.diaperType || 'pee'}
                                    onChange={(e) => {
                                      updateActivity(activity.id, { diaperType: e.target.value as 'pee' | 'poo' | 'both' })
                                    }}
                                  >
                                    <option value="pee">💧 Pee</option>
                                    <option value="poo">💩 Poo</option>
                                    <option value="both">💧💩 Both</option>
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
                                    transform: `scale(${getDeleteIconScale(activity.id)})`,
                                    transition: swipeStates[activity.id]?.isDragging ? 'none' : 'transform 0.2s ease'
                                  }}
                                >
                                  {shouldShowDeleteIcon(activity.id) ? '🗑️' : getActivityIcon(activity.type)}
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
                                  ✏️
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
    </div>
  )
}

export default App
