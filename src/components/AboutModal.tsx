interface AboutModalProps {
  onClose: () => void
}

export const AboutModal = ({ onClose }: AboutModalProps) => {
  return (
    <div className="about-modal" onClick={onClose}>
      <div className="about-content" onClick={(e) => e.stopPropagation()}>
        <div className="about-header">
          <h2>About MamaLog</h2>
          <button 
            className="close-btn"
            onClick={onClose}
            title="Close"
          >
            ×
          </button>
        </div>
        <div className="about-body">
          <p>
            <strong>MamaLog</strong> is a simple, privacy-focused baby activity tracker. 
            It helps parents log feedings, diaper changes, and sleep patterns without collecting 
            or sharing personal data. All information stays on your device, and you can 
            choose to export it if you want a backup or to move it to another device.
          </p>
          
          <div className="about-section">
            <h3>Features</h3>
            <ul>
              <li>Track feeding sessions (breastfeeding with left/right/bottle options)</li>
              <li>Log diaper changes (pee, poo, or both)</li>
              <li>Monitor sleep patterns with duration tracking</li>
              <li>Edit activity history with original data preservation</li>
              <li>Export/import data for backup and device sync</li>
              <li>Dark/light theme support</li>
            </ul>
          </div>
          
          <div className="about-section">
            <h3>Version</h3>
            <p>MamaLog v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}