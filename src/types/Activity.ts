export type ActivityType = 'breastfeeding' | 'diaper' | 'sleep'

export interface Activity {
  id: string
  type: ActivityType
  startTime: Date
  endTime?: Date
  notes?: string
  diaperType?: 'pee' | 'poo' | 'both'
  feedingType?: 'left' | 'right' | 'bottle'
  // Original data to track changes
  originalStartTime?: Date
  originalEndTime?: Date
  originalDiaperType?: 'pee' | 'poo' | 'both'
  originalFeedingType?: 'left' | 'right' | 'bottle'
  originalNotes?: string
}