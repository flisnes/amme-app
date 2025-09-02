import type { Activity } from '../types/Activity'
import { TbTrash, TbEdit, TbInfoCircle } from 'react-icons/tb'
import type { ReactElement } from 'react'

interface ActivityItemProps {
  activity: Activity
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
}

export const ActivityItem = ({
  activity,
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
  toggleActivityInfo
}: ActivityItemProps) => {
  return (
    <div
      className={`activity-item ${!activity.endTime ? 'ongoing' : ''} ${touchState.gestureType === 'activity-swipe' && touchState.activityId === activity.id ? 'swiping' : ''}`}
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
              title={activity.endTime ? "Delete activity" : "Cannot delete ongoing activity"}
              disabled={!activity.endTime}
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
                    updateActivityDataTemporary(activity.id, { startTime: newEndTime, endTime: newEndTime })
                  } else {
                    updateActivityDataTemporary(activity.id, { endTime: newEndTime })
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
                const now = new Date()
                
                // For ongoing activities (no end time), prevent setting future start times
                if (!activity.endTime && newStartTime > now) {
                  return // Don't allow future start times for ongoing activities
                }
                
                // Ensure start time is not after end time
                if (activity.endTime && newStartTime > activity.endTime) {
                  // If start time is after end time, also update end time
                  updateActivityDataTemporary(activity.id, { startTime: newStartTime, endTime: newStartTime })
                } else {
                  updateActivityDataTemporary(activity.id, { startTime: newStartTime })
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
                  updateActivityDataTemporary(activity.id, { feedingType: e.target.value as 'left' | 'right' | 'bottle' })
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
                  updateActivityDataTemporary(activity.id, { diaperType: e.target.value as 'pee' | 'poo' | 'both' })
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
                updateActivityDataTemporary(activity.id, { notes: e.target.value })
              }}
              placeholder=" ..."
              rows={2}
            />
          </div>
          <div className="edit-actions">
            <button 
              className="save-btn"
              onClick={() => {
                commitActivityDataChanges(activity.id)
                setEditingActivity(null)
              }}
            >
              Save
            </button>
            <button 
              className="cancel-btn"
              onClick={() => {
                cancelActivityDataChanges(activity.id)
                setEditingActivity(null)
              }}
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
                    {activity.endTime ? ` - ${formatTime(activity.endTime)}` : ` - ${formatTime(currentTime)}`}
                    {activity.endTime ? (
                      <span className="duration">
                        ({formatDuration(activity.startTime, activity.endTime)})
                      </span>
                    ) : (
                      <span className="duration">
                        ({formatLiveDuration(activity.startTime)})
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
  )
}