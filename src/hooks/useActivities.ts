import { useState, useEffect } from 'react'
import type { Activity, ActivityType } from '../types/Activity'
import type { DailyStatsMap } from '../types/DailyStats'
import { 
  updateDailyStatsForActivity, 
  removeDailyStatsForActivity,
  calculateDailyStats,
  formatDateKey 
} from '../utils/dailyStatsUtils'

export const useActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null)
  const [recentlyDeleted, setRecentlyDeleted] = useState<{activity: Activity, timeoutId: number} | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyStatsMap>({})

  // Load data from localStorage on mount
  useEffect(() => {
    const savedActivities = localStorage.getItem('babyTracker_activities')
    const savedCurrentActivity = localStorage.getItem('babyTracker_currentActivity')
    const savedDailyStats = localStorage.getItem('babyTracker_dailyStats')
    
    let parsedActivities: Activity[] = []
    
    if (savedActivities) {
      parsedActivities = JSON.parse(savedActivities).map((activity: any) => ({
        ...activity,
        startTime: new Date(activity.startTime),
        endTime: activity.endTime ? new Date(activity.endTime) : undefined
      }))
      setActivities(parsedActivities)
    }
    
    if (savedCurrentActivity) {
      const parsedCurrentActivity = JSON.parse(savedCurrentActivity)
      setCurrentActivity({
        ...parsedCurrentActivity,
        startTime: new Date(parsedCurrentActivity.startTime)
      })
    }
    
    // Handle daily stats loading and migration
    if (savedDailyStats) {
      const parsedStats = JSON.parse(savedDailyStats)
      // Check if we need to rebuild stats (version check for timezone fix)
      const needsRebuild = !parsedStats._version || parsedStats._version < 2
      if (needsRebuild && parsedActivities.length > 0) {
        // Rebuild stats with correct timezone logic
        rebuildDailyStats(parsedActivities)
      } else {
        setDailyStats(parsedStats)
      }
    } else if (parsedActivities.length > 0) {
      // If we have activities but no daily stats, rebuild them
      rebuildDailyStats(parsedActivities)
    }
  }, [])

  // Rebuild daily stats from scratch (for migration or corruption recovery)
  const rebuildDailyStats = (activitiesList: Activity[]) => {
    const newStats: DailyStatsMap = {}
    const processedDates = new Set<string>()
    
    activitiesList.forEach(activity => {
      const dateKey = formatDateKey(activity.startTime)
      if (!processedDates.has(dateKey)) {
        processedDates.add(dateKey)
        const date = new Date(dateKey + 'T00:00:00.000')  // Local time, not UTC
        newStats[dateKey] = calculateDailyStats(activitiesList, date)
      }
    })
    
    setDailyStats(newStats)
  }

  // Save activities to localStorage
  useEffect(() => {
    localStorage.setItem('babyTracker_activities', JSON.stringify(activities))
  }, [activities])

  // Save daily stats to localStorage
  useEffect(() => {
    const statsWithVersion = { ...dailyStats, _version: 2 }
    localStorage.setItem('babyTracker_dailyStats', JSON.stringify(statsWithVersion))
  }, [dailyStats])

  // Save current activity to localStorage
  useEffect(() => {
    if (currentActivity) {
      localStorage.setItem('babyTracker_currentActivity', JSON.stringify(currentActivity))
    } else {
      localStorage.removeItem('babyTracker_currentActivity')
    }
  }, [currentActivity])

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
  }

  const stopActivity = () => {
    if (currentActivity) {
      const completedActivity = {
        ...currentActivity,
        endTime: new Date()
      }
      // Update the existing activity in the log with the end time
      setActivities(prev => {
        const newActivities = prev.map(activity => 
          activity.id === currentActivity.id ? completedActivity : activity
        )
        
        // Update daily stats for the completed activity
        setDailyStats(prevStats => 
          updateDailyStatsForActivity(completedActivity, currentActivity, newActivities, prevStats)
        )
        
        return newActivities
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
        const newActivities = prev.map(activity => 
          activity.id === currentActivity.id ? completedActivity : activity
        )
        
        // Update daily stats for the completed activity
        setDailyStats(prevStats => 
          updateDailyStatsForActivity(completedActivity, currentActivity, newActivities, prevStats)
        )
        
        return newActivities
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
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      
      // Update daily stats for the new activity
      setDailyStats(prevStats => 
        updateDailyStatsForActivity(activity, null, newActivities, prevStats)
      )
      
      return newActivities
    })
  }

  const updateActivityData = (id: string, updates: Partial<Activity>) => {
    setActivities(prev => {
      const originalActivity = prev.find(activity => activity.id === id)
      if (!originalActivity) return prev
      
      const updatedActivities = prev.map(activity => {
        if (activity.id === id) {
          // Store original values on first edit (if not already stored)
          const originalData: Partial<Activity> = {}
          if (!activity.originalStartTime) {
            originalData.originalStartTime = activity.startTime
          }
          if (!activity.originalEndTime && activity.endTime) {
            originalData.originalEndTime = activity.endTime
          }
          if (!activity.originalDiaperType && activity.diaperType) {
            originalData.originalDiaperType = activity.diaperType
          }
          if (!activity.originalFeedingType && activity.feedingType) {
            originalData.originalFeedingType = activity.feedingType
          }
          if (!activity.originalNotes && activity.notes) {
            originalData.originalNotes = activity.notes
          }
          
          return { ...activity, ...originalData, ...updates }
        }
        return activity
      })
      
      // Update daily stats for the modified activity
      const updatedActivity = updatedActivities.find(a => a.id === id)
      if (updatedActivity) {
        setDailyStats(prevStats => 
          updateDailyStatsForActivity(updatedActivity, originalActivity, updatedActivities, prevStats)
        )
      }
      
      // Re-sort activities by start time (newest first) to maintain chronological order
      return updatedActivities.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    })
  }

  // Temporary update for editing without triggering reorder
  const updateActivityDataTemporary = (id: string, updates: Partial<Activity>) => {
    setActivities(prev => prev.map(activity => {
      if (activity.id === id) {
        const activityWithMetadata = activity as any
        
        // Store original values on first edit (if not already stored) - these never change
        const originalData: any = {}
        Object.keys(updates).forEach(key => {
          const originalKey = `original${key.charAt(0).toUpperCase() + key.slice(1)}`
          if (!activityWithMetadata[originalKey] && (activity as any)[key] != null) {
            originalData[originalKey] = (activity as any)[key]
          }
        })
        
        // Store edit session baseline values (what to restore on cancel for this edit session)
        const editBaselineData: any = {}
        Object.keys(updates).forEach(key => {
          const baselineKey = `editBaseline${key.charAt(0).toUpperCase() + key.slice(1)}`
          if (!activityWithMetadata[baselineKey] && (activity as any)[key] != null) {
            editBaselineData[baselineKey] = (activity as any)[key]
          }
        })
        
        return { ...activity, ...originalData, ...editBaselineData, ...updates }
      }
      return activity
    }))
  }

  // Commit temporary changes with proper reordering and stats update
  const commitActivityDataChanges = (id: string) => {
    setActivities(prev => {
      const updatedActivity = prev.find(a => a.id === id)
      if (!updatedActivity) return prev

      // Update daily stats for the committed activity
      setDailyStats(prevStats => {
        const originalActivity = prev.find(a => a.id === id && (a.originalStartTime || a.startTime))
        const referenceActivity = originalActivity ? {
          ...originalActivity,
          startTime: originalActivity.originalStartTime || originalActivity.startTime,
          endTime: originalActivity.originalEndTime || originalActivity.endTime,
          diaperType: originalActivity.originalDiaperType || originalActivity.diaperType,
          feedingType: originalActivity.originalFeedingType || originalActivity.feedingType,
        } : null
        
        return updateDailyStatsForActivity(updatedActivity, referenceActivity, prev, prevStats)
      })
      
      // Clear edit session baseline values since we're committing the changes
      const committedActivities = prev.map(activity => {
        if (activity.id === id) {
          const committed = { ...activity }
          // Remove all editBaseline* properties
          Object.keys(committed).forEach(key => {
            if (key.startsWith('editBaseline')) {
              delete (committed as any)[key]
            }
          })
          return committed
        }
        return activity
      })
      
      // Re-sort activities by start time (newest first) to maintain chronological order
      return committedActivities.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    })
  }

  // Restore activity to edit session baseline and clear edit session values
  const cancelActivityDataChanges = (id: string) => {
    setActivities(prev => prev.map(activity => {
      if (activity.id === id) {
        const restored = { ...activity } as any
        
        // Restore from edit session baseline values if they exist
        Object.keys(restored).forEach(key => {
          if (key.startsWith('editBaseline')) {
            const originalFieldName = key.replace('editBaseline', '').toLowerCase()
            const properFieldName = originalFieldName.charAt(0).toLowerCase() + originalFieldName.slice(1)
            if (restored[key] != null) {
              restored[properFieldName] = restored[key]
            }
          }
        })
        
        // Clear all edit session baseline values since we're canceling
        Object.keys(restored).forEach(key => {
          if (key.startsWith('editBaseline')) {
            delete restored[key]
          }
        })
        
        return restored
      }
      return activity
    }))
  }

  const deleteActivity = (id: string) => {
    const activityToDelete = activities.find(activity => activity.id === id)
    if (!activityToDelete) return
    
    // Remove from activities list and update daily stats
    setActivities(prev => {
      const newActivities = prev.filter(activity => activity.id !== id)
      
      // Update daily stats after deletion
      setDailyStats(prevStats => 
        removeDailyStatsForActivity(activityToDelete, newActivities, prevStats)
      )
      
      return newActivities
    })
    
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

  const importActivities = (importedActivities: Activity[]): number => {
    // Merge with existing activities (avoid duplicates by ID)
    const existingIds = new Set(activities.map(a => a.id))
    const newActivities = importedActivities.filter(a => !existingIds.has(a.id))
    
    if (newActivities.length === 0) {
      return 0
    }
    
    const mergedActivities = [...activities, ...newActivities]
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    
    setActivities(mergedActivities)
    return newActivities.length
  }

  const getLastResumableActivity = (): Activity | null => {
    // Find the most recent completed activity that is resumable (breastfeeding or sleep)
    const resumableTypes: ActivityType[] = ['breastfeeding', 'sleep']
    return activities.find(activity => 
      resumableTypes.includes(activity.type) && 
      activity.endTime !== undefined
    ) || null
  }

  const resumeActivity = (activityId: string) => {
    // Find the activity to resume
    const activityToResume = activities.find(a => a.id === activityId)
    if (!activityToResume || !activityToResume.endTime) return
    
    // Check if it's a resumable type
    const resumableTypes: ActivityType[] = ['breastfeeding', 'sleep']
    if (!resumableTypes.includes(activityToResume.type)) return
    
    // Verify this is the most recent resumable activity
    const lastResumable = getLastResumableActivity()
    if (!lastResumable || lastResumable.id !== activityId) return
    
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
    
    // Remove the end time from the activity to resume it
    const resumedActivity = {
      ...activityToResume,
      endTime: undefined
    }
    
    // Update the activity in the list
    setActivities(prev => {
      const newActivities = prev.map(activity => 
        activity.id === activityId ? resumedActivity : activity
      )
      
      // Update daily stats
      setDailyStats(prevStats => 
        updateDailyStatsForActivity(resumedActivity, activityToResume, newActivities, prevStats)
      )
      
      return newActivities
    })
    
    // Set it as the current activity
    setCurrentActivity(resumedActivity)
  }

  return {
    // State
    activities,
    currentActivity,
    recentlyDeleted,
    dailyStats,
    
    // Actions
    startActivity,
    stopActivity,
    addQuickActivity,
    updateActivityData,
    updateActivityDataTemporary,
    commitActivityDataChanges,
    cancelActivityDataChanges,
    deleteActivity,
    undoDelete,
    importActivities,
    resumeActivity,
    getLastResumableActivity
  }
}