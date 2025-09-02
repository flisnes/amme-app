import { useState } from 'react'
import { TbBottle, TbDiaper, TbMoon, TbDroplet, TbPoo, TbArrowBigLeft, TbArrowBigRight, TbBabyBottle } from 'react-icons/tb'
import type { Activity, ActivityType } from '../types/Activity'

interface ActivityControlsProps {
  currentActivity: Activity | null
  onActivityClick: (type: ActivityType) => void
  onStartActivity: (type: ActivityType, feedingType?: 'left' | 'right' | 'bottle') => void
  onAddQuickActivity: (type: ActivityType, diaperType?: 'pee' | 'poo' | 'both') => void
}

export const ActivityControls = ({
  currentActivity,
  onActivityClick,
  onStartActivity,
  onAddQuickActivity
}: ActivityControlsProps) => {
  const [showDiaperOptions, setShowDiaperOptions] = useState(false)
  const [showFeedingOptions, setShowFeedingOptions] = useState(false)

  const handleActivityClick = (type: ActivityType) => {
    if (type === 'breastfeeding' && !currentActivity) {
      setShowFeedingOptions(true)
    } else if (type === 'diaper') {
      setShowDiaperOptions(true)
    } else {
      onActivityClick(type)
    }
  }

  const handleStartActivity = (type: ActivityType, feedingType?: 'left' | 'right' | 'bottle') => {
    onStartActivity(type, feedingType)
    setShowFeedingOptions(false)
  }

  const handleAddQuickActivity = (type: ActivityType, diaperType?: 'pee' | 'poo' | 'both') => {
    onAddQuickActivity(type, diaperType)
    setShowDiaperOptions(false)
  }

  return (
    <>
      <div className="button-grid">
        <button 
          className={`activity-btn ${currentActivity?.type === 'breastfeeding' ? 'active' : ''}`}
          onClick={() => handleActivityClick('breastfeeding')}
        >
          <span 
            className={`activity-icon ${currentActivity?.type === 'breastfeeding' ? 'activity-icon-animated feeding' : ''}`}
          >
            <TbBottle size={24} />
            {currentActivity?.type === 'breastfeeding' && (
              <>
                <div className="milk-drop left drop-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                  </svg>
                </div>
                <div className="milk-drop left drop-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                  </svg>
                </div>
                <div className="milk-drop right drop-3">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                  </svg>
                </div>
                <div className="milk-drop right drop-4">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                  </svg>
                </div>
              </>
            )}
          </span>
          <span className="activity-label">
            {currentActivity?.type === 'breastfeeding' ? 'Stop Feeding' : 'Start Feeding'}
          </span>
        </button>
        
        <button 
          className="activity-btn"
          onClick={() => handleActivityClick('diaper')}
        >
          <span className="activity-icon"><TbDiaper size={24} /></span>
          <span className="activity-label">Diaper</span>
        </button>
        
        <button 
          className={`activity-btn ${currentActivity?.type === 'sleep' ? 'active' : ''}`}
          onClick={() => handleActivityClick('sleep')}
        >
          <span className={`activity-icon ${currentActivity?.type === 'sleep' ? 'activity-icon-animated sleeping' : ''}`}>
            <TbMoon size={24} />
            {currentActivity?.type === 'sleep' && (
              <>
                <span className="floating-z z1">z</span>
                <span className="floating-z z2">z</span>
                <span className="floating-z z3">Z</span>
              </>
            )}
          </span>
          <span className="activity-label">
            {currentActivity?.type === 'sleep' ? 'Stop Sleep' : 'Start Sleep'}
          </span>
        </button>
      </div>

      {showDiaperOptions && (
        <div className="diaper-options">
          <h3>What type of diaper change?</h3>
          <div className="diaper-buttons">
            <button 
              className="diaper-type-btn pee"
              onClick={() => handleAddQuickActivity('diaper', 'pee')}
            >
              <TbDroplet size={20} /> Pee
            </button>
            <button 
              className="diaper-type-btn poo"
              onClick={() => handleAddQuickActivity('diaper', 'poo')}
            >
              <TbPoo size={20} /> Poo
            </button>
            <button 
              className="diaper-type-btn both"
              onClick={() => handleAddQuickActivity('diaper', 'both')}
            >
              <TbDroplet size={16} /><TbPoo size={16} /> Both
            </button>
          </div>
          <button 
            className="cancel-diaper-btn"
            onClick={() => setShowDiaperOptions(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {showFeedingOptions && (
        <div className="feeding-options">
          <h3>What type of feeding?</h3>
          <div className="feeding-buttons">
            <div className="breast-buttons">
              <button 
                className="feeding-type-btn left"
                onClick={() => handleStartActivity('breastfeeding', 'left')}
              >
                <TbArrowBigLeft size={20} /> Left Breast
              </button>
              <button 
                className="feeding-type-btn right"
                onClick={() => handleStartActivity('breastfeeding', 'right')}
              >
                Right Breast <TbArrowBigRight size={20} />
              </button>
            </div>
            <button 
              className="feeding-type-btn bottle"
              onClick={() => handleStartActivity('breastfeeding', 'bottle')}
            >
              <TbBabyBottle size={20} /> Bottle
            </button>
          </div>
          <button 
            className="cancel-feeding-btn"
            onClick={() => setShowFeedingOptions(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </>
  )
}