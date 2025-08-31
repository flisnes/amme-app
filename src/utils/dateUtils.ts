// Date and time utility functions

export const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export const formatDuration = (start: Date, end: Date) => {
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

export const formatLiveDuration = (startTime: Date, currentTime: Date = new Date()) => {
  const diffMs = currentTime.getTime() - startTime.getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export const formatTimeForInput = (date: Date) => {
  // Format for datetime-local input (YYYY-MM-DDTHH:MM) in local timezone
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export const parseTimeFromInput = (timeString: string) => {
  // Parse datetime-local input as local time consistently across environments
  // Split the datetime-local format: "YYYY-MM-DDTHH:MM"
  const [datePart, timePart] = timeString.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  
  // Create date object with explicit local time components
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

export const isToday = (date: Date) => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export const isYesterday = (date: Date) => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date.toDateString() === yesterday.toDateString()
}

export const isTodayOrYesterday = (date: Date) => {
  return isToday(date) || isYesterday(date)
}

export const getActivitiesForDay = <T extends { startTime: Date }>(activities: T[], date: Date): T[] => {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return activities.filter(activity => {
    const activityDate = new Date(activity.startTime)
    return activityDate >= startOfDay && activityDate <= endOfDay
  }).sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
}