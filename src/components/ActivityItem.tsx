import type { Activity } from '../types/Activity'
import { TbTrash, TbEdit, TbPlayerPlay } from 'react-icons/tb'
import type { ReactElement } from 'react'

interface ActivityItemProps {
  activity: Activity
  editingActivity: string | null
  touchState: {
    gestureType: string | null
    activityId?: string
  }
  slidingOutItems: Set<string>
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
  setEditingActivity: (id: string) => void
  cancelEditingActivity: () => void
  expandedItems: Set<string>
  toggleExpanded: (id: string) => void
  resumeActivity?: (id: string) => void
  currentActivity?: Activity | null
  getLastResumableActivity?: () => Activity | null
}

export const ActivityItem = ({
  activity,
  editingActivity,
  touchState,
  slidingOutItems,
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
  cancelEditingActivity,
  expandedItems,
  toggleExpanded,
  resumeActivity,
  currentActivity,
  getLastResumableActivity
}: ActivityItemProps) => {
  // Check if this activity can be resumed (only the most recent one)
  const lastResumable = getLastResumableActivity ? getLastResumableActivity() : null
  const canResume = activity.endTime && 
                    (activity.type === 'breastfeeding' || activity.type === 'sleep') &&
                    !currentActivity &&
                    lastResumable?.id === activity.id
  
  // Check if any original data exists
  const hasOriginalData = activity.originalStartTime || 
                          activity.originalEndTime || 
                          activity.originalFeedingType || 
                          activity.originalDiaperType ||
                          activity.originalNotes
  
  // Check if this activity is expanded
  const isExpanded = expandedItems.has(activity.id)
  
  // Create compact activity label
  const getCompactLabel = () => {
    if (activity.type === 'breastfeeding') {
      if (activity.feedingType === 'left') return 'Left'
      if (activity.feedingType === 'right') return 'Right'
      if (activity.feedingType === 'bottle') return 'Bottle'
      return 'Left' // default
    } else if (activity.type === 'diaper') {
      if (activity.diaperType) {
        return activity.diaperType.charAt(0).toUpperCase() + activity.diaperType.slice(1)
      }
      return 'Pee' // default
    } else {
      return 'Sleep'
    }
  }
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
                cancelEditingActivity()
              }}
            >
              Save
            </button>
            <button 
              className="cancel-btn"
              onClick={() => {
                cancelActivityDataChanges(activity.id)
                cancelEditingActivity()
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Compact activity row - clickable to expand */}
          <div 
            className="activity-compact-row"
            onClick={() => toggleExpanded(activity.id)}
          >
            <div className="activity-main-info">
              <span className="activity-icon">
                {getActivityIcon(activity.type)}
              </span>
              <span className="activity-compact-text">
                {getCompactLabel()}
                {' • '}
                {(activity.type === 'breastfeeding' || activity.type === 'sleep') ? (
                  <>
                    {formatTime(activity.startTime)}
                    {activity.endTime ? `-${formatTime(activity.endTime)}` : `-${formatTime(currentTime)}`}
                    {' • '}
                    {activity.endTime ? (
                      formatDuration(activity.startTime, activity.endTime)
                    ) : (
                      formatLiveDuration(activity.startTime)
                    )}
                  </>
                ) : (
                  formatTime(activity.startTime)
                )}
              </span>
            </div>
            
            {/* Only show resume button by default */}
            {canResume && resumeActivity && (
              <button 
                className="resume-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  resumeActivity(activity.id)
                }}
                title="Resume this activity"
              >
                <TbPlayerPlay />
              </button>
            )}
          </div>

          {/* Expanded details */}
          {isExpanded && (
            <div className="activity-expanded-details">
              {/* Notes */}
              {activity.notes && (
                <div className="activity-notes">
                  <strong>Notes:</strong> {activity.notes}
                </div>
              )}
              
              {/* Original data if edited */}
              {hasOriginalData && (
                <div className="original-info">
                  <div className="original-label">Original:</div>
                  {(activity.originalStartTime || activity.originalEndTime) && (
                    <div className="original-item">
                      <span className="original-field">Time:</span>
                      <span className="original-value">
                        {(activity.type === 'breastfeeding' || activity.type === 'sleep') ? (
                          <>
                            {formatTime(activity.originalStartTime || activity.startTime)}
                            {(activity.originalEndTime || activity.endTime) && ` - ${formatTime(activity.originalEndTime || activity.endTime!)}`}
                            {(activity.originalEndTime || activity.endTime) && (
                              <span className="duration">
                                ({formatDuration(activity.originalStartTime || activity.startTime, (activity.originalEndTime || activity.endTime)!)})
                              </span>
                            )}
                          </>
                        ) : (
                          formatTime(activity.originalStartTime || activity.startTime)
                        )}
                      </span>
                    </div>
                  )}
                  {activity.originalFeedingType && activity.originalFeedingType !== activity.feedingType && (
                    <div className="original-item">
                      <span className="original-field">Type:</span>
                      <span className="original-value">{activity.originalFeedingType}</span>
                    </div>
                  )}
                  {activity.originalDiaperType && activity.originalDiaperType !== activity.diaperType && (
                    <div className="original-item">
                      <span className="original-field">Type:</span>
                      <span className="original-value">{activity.originalDiaperType}</span>
                    </div>
                  )}
                  {activity.originalNotes && activity.originalNotes !== activity.notes && (
                    <div className="original-item">
                      <span className="original-field">Notes:</span>
                      <span className="original-value">{activity.originalNotes}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Action buttons in expanded view */}
              <div className="activity-expanded-buttons">
                <button 
                  className="edit-btn"
                  onClick={() => setEditingActivity(activity.id)}
                  title="Edit activity"
                >
                  <TbEdit /> Edit
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}