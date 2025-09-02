import type { Activity } from '../types/Activity'
import type { ReactElement } from 'react'
import { ActivityItem } from './ActivityItem'

interface DayDetailModalProps {
  selectedDay: Date
  activities: Activity[]
  editingActivity: string | null
  touchState: {
    gestureType: string | null
    activityId?: string
  }
  slidingOutItems: Set<string>
  expandedActivityInfo: Set<string>
  currentTime: Date
  getSwipeTransform: (id: string) => string
  getSwipeOpacity: (id: string) => number
  getSwipeBackgroundColor: (id: string) => string
  getActivityIcon: (type: Activity['type']) => ReactElement | string
  getActivityLabel: (activity: Activity) => string
  formatTime: (date: Date) => string
  formatDuration: (start: Date, end: Date) => string
  formatLiveDuration: (start: Date) => string
  formatTimeForInput: (date: Date) => string
  parseTimeFromInput: (input: string) => Date
  updateActivityDataTemporary: (id: string, updates: Partial<Activity>) => void
  commitActivityDataChanges: (id: string) => void
  cancelActivityDataChanges: (id: string) => void
  deleteActivity: (id: string) => void
  setEditingActivity: (id: string | null) => void
  toggleActivityInfo: (id: string) => void
  onClose: () => void
}

export const DayDetailModal = ({
  selectedDay,
  activities,
  editingActivity,
  touchState,
  slidingOutItems,
  expandedActivityInfo,
  currentTime,
  getSwipeTransform,
  getSwipeOpacity,
  getSwipeBackgroundColor,
  getActivityIcon,
  getActivityLabel,
  formatTime,
  formatDuration,
  formatLiveDuration,
  formatTimeForInput,
  parseTimeFromInput,
  updateActivityDataTemporary,
  commitActivityDataChanges,
  cancelActivityDataChanges,
  deleteActivity,
  setEditingActivity,
  toggleActivityInfo,
  onClose
}: DayDetailModalProps) => {
  // Get activities for the selected day
  const getActivitiesForSelectedDay = (day: Date): Activity[] => {
    const startOfDay = new Date(day)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(day)
    endOfDay.setHours(23, 59, 59, 999)

    return activities.filter(activity => {
      const activityDate = new Date(activity.startTime)
      return activityDate >= startOfDay && activityDate <= endOfDay
    }).sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
  }

  const dayActivities = getActivitiesForSelectedDay(selectedDay)

  return (
    <div className="day-detail-modal" onClick={onClose}>
      <div className="day-detail-content" onClick={(e) => e.stopPropagation()}>
        <div className="day-detail-header">
          <h2>{selectedDay.toLocaleDateString('default', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</h2>
          <button 
            className="close-btn"
            onClick={onClose}
            title="Close"
          >
            ×
          </button>
        </div>
        
        <div className="day-detail-activities">
          {dayActivities.map(activity => (
            <div key={activity.id} className="day-activity-item">
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
                formatLiveDuration={formatLiveDuration}
                formatTimeForInput={formatTimeForInput}
                parseTimeFromInput={parseTimeFromInput}
                updateActivityDataTemporary={updateActivityDataTemporary}
                commitActivityDataChanges={commitActivityDataChanges}
                cancelActivityDataChanges={cancelActivityDataChanges}
                deleteActivity={deleteActivity}
                setEditingActivity={setEditingActivity}
                toggleActivityInfo={toggleActivityInfo}
              />
            </div>
          ))}
          
          {dayActivities.length === 0 && (
            <div className="no-activities">
              <p>No activities logged for this day.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}