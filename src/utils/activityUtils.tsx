import { TbBottle, TbDiaper, TbMoon, TbNotes } from 'react-icons/tb'
import type { Activity, ActivityType } from '../types/Activity'

export const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'breastfeeding': return <TbBottle size={20} />
    case 'diaper': return <TbDiaper size={20} />
    case 'sleep': return <TbMoon size={20} />
    default: return <TbNotes size={20} />
  }
}

export const getActivityLabel = (activity: Activity) => {
  switch (activity.type) {
    case 'breastfeeding': 
      if (activity.feedingType) {
        return `Feeding (${activity.feedingType})`
      }
      return 'Feeding'
    case 'diaper': 
      if (activity.diaperType) {
        return `Diaper (${activity.diaperType})`
      }
      return 'Diaper'
    case 'sleep': return 'Sleep'
    default: return 'Activity'
  }
}