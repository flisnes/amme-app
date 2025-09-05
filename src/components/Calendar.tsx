import { useState } from 'react'
import { TbChevronLeft, TbChevronRight, TbBabyBottle, TbDiaper, TbMoon } from 'react-icons/tb'
import type { Activity } from '../types/Activity'
import type { DailyStatsMap } from '../types/DailyStats'
import { getDailyStatsForDate } from '../utils/dailyStatsUtils'

interface CalendarProps {
  activities: Activity[]
  dailyStats: DailyStatsMap
  selectedDay: Date | null
  setSelectedDay: (day: Date | null) => void
}

export const Calendar = ({ activities, dailyStats, selectedDay, setSelectedDay }: CalendarProps) => {
  const [calendarDate, setCalendarDate] = useState(new Date())

  // Calendar helper functions
  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    // First day of the month
    const firstDay = new Date(year, month, 1)
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)
    
    // First day of the week for the calendar (Sunday = 0)
    const firstCalendarDay = new Date(firstDay)
    firstCalendarDay.setDate(firstCalendarDay.getDate() - firstDay.getDay())
    
    const days = []
    const currentDate = new Date(firstCalendarDay)
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return { days, month, year, firstDay, lastDay }
  }

  const formatDurationHours = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      // Use clock format for compactness: "13:49" instead of "13h 49m"
      return `${hours}:${minutes.toString().padStart(2, '0')}`
    } else if (minutes > 0) {
      return `${minutes}m`
    } else {
      return '0m'
    }
  }

  // Get daily activity summaries (uses cached statistics with fallback)
  const getDailySummary = (date: Date) => {
    const stats = getDailyStatsForDate(date, dailyStats, activities)
    return {
      feedings: stats.feedings,
      diapers: stats.diapers,
      sleepDuration: stats.sleepDuration
    }
  }

  // Handle calendar day click
  const handleDayClick = (day: Date, isCurrentMonth: boolean, hasActivities: boolean) => {
    if (isCurrentMonth && hasActivities) {
      setSelectedDay(day)
    }
  }

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button 
          className="calendar-nav-btn"
          onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
        >
          <TbChevronLeft />
        </button>
        <h2 className="calendar-title">
          {calendarDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button 
          className="calendar-nav-btn"
          onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
        >
          <TbChevronRight />
        </button>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        
        <div className="calendar-days">
          {getCalendarDays(calendarDate).days.map((day, index) => {
            const summary = getDailySummary(day)
            const isCurrentMonth = day.getMonth() === calendarDate.getMonth()
            const isToday = day.toDateString() === new Date().toDateString()
            const isSelected = selectedDay && day.toDateString() === selectedDay.toDateString()
            const hasActivities = summary.feedings > 0 || summary.diapers > 0 || summary.sleepDuration > 0

            return (
              <div 
                key={index} 
                className={`calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasActivities ? 'has-activities clickable' : ''}`}
                onClick={() => handleDayClick(day, isCurrentMonth, hasActivities)}
              >
                <div className="day-number">{day.getDate()}</div>
                {isCurrentMonth && hasActivities && (
                  <div className="day-summary">
                    {summary.feedings > 0 && (
                      <div className="summary-item feeding">
                        <TbBabyBottle size={10} />
                        <span>{summary.feedings}</span>
                      </div>
                    )}
                    {summary.diapers > 0 && (
                      <div className="summary-item diaper">
                        <TbDiaper size={10} />
                        <span>{summary.diapers}</span>
                      </div>
                    )}
                    {summary.sleepDuration > 0 && (
                      <div className="summary-item sleep">
                        <TbMoon size={10} />
                        <span>{formatDurationHours(summary.sleepDuration)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <TbBabyBottle size={14} />
          <span>Feedings</span>
        </div>
        <div className="legend-item">
          <TbDiaper size={14} />
          <span>Diapers</span>
        </div>
        <div className="legend-item">
          <TbMoon size={14} />
          <span>Sleep</span>
        </div>
      </div>
      
      <div className="view-hint">
        <p>Swipe right to return to activities view</p>
      </div>
    </div>
  )
}