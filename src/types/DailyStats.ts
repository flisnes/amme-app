export interface DailyStats {
  date: string; // Format: YYYY-MM-DD for easy comparison
  feedings: number;
  diapers: number;
  sleepDuration: number; // in milliseconds
  lastUpdated: number; // timestamp for cache validation
}

export interface DailyStatsMap {
  [dateKey: string]: DailyStats;
}