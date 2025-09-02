import type { Activity } from '../types/Activity';
import type { DailyStats, DailyStatsMap } from '../types/DailyStats';

// Convert Date to YYYY-MM-DD string using local time (not UTC)
export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get activities for a specific day (using local time boundaries)
export const getActivitiesForDay = (activities: Activity[], date: Date): Activity[] => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return activities.filter(activity => {
    const activityDate = new Date(activity.startTime);
    return activityDate >= startOfDay && activityDate <= endOfDay;
  });
};

// Calculate daily statistics for a specific day
export const calculateDailyStats = (activities: Activity[], date: Date): DailyStats => {
  const dayActivities = getActivitiesForDay(activities, date);
  
  const feedings = dayActivities.filter(a => a.type === 'breastfeeding').length;
  const diapers = dayActivities.filter(a => a.type === 'diaper').length;
  
  // Calculate total sleep duration
  const sleepActivities = dayActivities.filter(a => a.type === 'sleep' && a.endTime);
  const sleepDuration = sleepActivities.reduce((total, activity) => {
    if (activity.endTime) {
      return total + (activity.endTime.getTime() - activity.startTime.getTime());
    }
    return total;
  }, 0);
  
  return {
    date: formatDateKey(date),
    feedings,
    diapers,
    sleepDuration,
    lastUpdated: Date.now()
  };
};

// Update daily statistics for affected days when an activity is added/modified
export const updateDailyStatsForActivity = (
  activity: Activity,
  previousActivity: Activity | null,
  activities: Activity[],
  currentStats: DailyStatsMap
): DailyStatsMap => {
  const updatedStats = { ...currentStats };
  
  // Dates that might need updates
  const datesToUpdate = new Set<string>();
  
  // Add current activity date
  datesToUpdate.add(formatDateKey(activity.startTime));
  
  // If modifying an existing activity, also update the previous date
  if (previousActivity) {
    datesToUpdate.add(formatDateKey(previousActivity.startTime));
  }
  
  // Recalculate stats for all affected dates
  datesToUpdate.forEach(dateKey => {
    const date = new Date(dateKey + 'T00:00:00.000');  // Local time, not UTC
    updatedStats[dateKey] = calculateDailyStats(activities, date);
  });
  
  return updatedStats;
};

// Remove daily statistics when an activity is deleted
export const removeDailyStatsForActivity = (
  activity: Activity,
  activities: Activity[], // activities after the deletion
  currentStats: DailyStatsMap
): DailyStatsMap => {
  const updatedStats = { ...currentStats };
  const dateKey = formatDateKey(activity.startTime);
  
  // Recalculate stats for the affected date
  const date = new Date(dateKey + 'T00:00:00.000');  // Local time, not UTC
  const remainingActivitiesForDay = getActivitiesForDay(activities, date);
  
  if (remainingActivitiesForDay.length > 0) {
    // Update stats if there are still activities for this day
    updatedStats[dateKey] = calculateDailyStats(activities, date);
  } else {
    // Remove stats entry if no activities remain for this day
    delete updatedStats[dateKey];
  }
  
  return updatedStats;
};

// Get daily stats with fallback to calculation if not cached
export const getDailyStatsForDate = (
  date: Date,
  cachedStats: DailyStatsMap,
  activities: Activity[]
): DailyStats => {
  const dateKey = formatDateKey(date);
  const cached = cachedStats[dateKey];
  
  if (cached) {
    return cached;
  }
  
  // Fallback: calculate on the fly
  return calculateDailyStats(activities, date);
};