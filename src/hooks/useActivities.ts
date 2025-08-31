import { useState, useEffect } from 'react'
import type { Activity, ActivityType } from '../types/Activity'

export const useActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null)
  const [recentlyDeleted, setRecentlyDeleted] = useState<{activity: Activity, timeoutId: number} | null>(null)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedActivities = localStorage.getItem('babyTracker_activities')
    const savedCurrentActivity = localStorage.getItem('babyTracker_currentActivity')
    
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
  }, [])

  // Save activities to localStorage
  useEffect(() => {
    localStorage.setItem('babyTracker_activities', JSON.stringify(activities))
  }, [activities])

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
  }

  const updateActivityData = (id: string, updates: Partial<Activity>) => {
    setActivities(prev => {
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
      
      // Re-sort activities by start time (newest first) to maintain chronological order
      return updatedActivities.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    })
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

  return {
    // State
    activities,
    currentActivity,
    recentlyDeleted,
    
    // Actions
    startActivity,
    stopActivity,
    addQuickActivity,
    updateActivityData,
    deleteActivity,
    undoDelete,
    importActivities
  }
}