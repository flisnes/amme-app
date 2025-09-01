import { TbMenu2, TbDownload, TbUpload, TbCalendar, TbInfoSquare, TbList, TbSun, TbMoon } from 'react-icons/tb'

interface SettingsMenuProps {
  showBurgerMenu: boolean
  isDarkMode: boolean
  activities: any[]
  currentView: 'activities' | 'calendar'
  onToggleMenu: () => void
  onToggleTheme: () => void
  onExportData: () => void
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void
  onToggleView: () => void
  onShowAbout: () => void
  onCloseMenu: () => void
}

export const SettingsMenu = ({
  showBurgerMenu,
  isDarkMode,
  activities,
  currentView,
  onToggleMenu,
  onToggleTheme,
  onExportData,
  onImportData,
  onToggleView,
  onShowAbout,
  onCloseMenu
}: SettingsMenuProps) => {
  const handleExport = () => {
    onExportData()
    onCloseMenu()
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    onImportData(event)
    onCloseMenu()
  }

  const handleToggleView = () => {
    onToggleView()
    onCloseMenu()
  }

  const handleAbout = () => {
    onShowAbout()
    onCloseMenu()
  }

  return (
    <header className="app-header">
      <button 
        className="burger-menu-btn"
        onClick={onToggleMenu}
        aria-label="Menu"
      >
        <TbMenu2 />
      </button>
      
      <h1>MamaLog</h1>
      
      <button 
        className="theme-toggle"
        onClick={onToggleTheme}
        aria-label="Toggle dark mode"
      >
        <div className="toggle-icon-container">
          <TbSun className={`sun-icon ${!isDarkMode ? 'active' : ''}`} />
          <TbMoon className={`moon-icon ${isDarkMode ? 'active' : ''}`} />
        </div>
      </button>
      
      {showBurgerMenu && (
        <div className="burger-menu-dropdown">
          <button 
            className="menu-item export-menu-item"
            onClick={handleExport}
            disabled={activities.length === 0}
          >
            <TbDownload />
            <span>Export Data</span>
          </button>
          
          <label className="menu-item import-menu-item">
            <TbUpload />
            <span>Import Data</span>
            <input 
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
          
          <button 
            className="menu-item calendar-menu-item"
            onClick={handleToggleView}
          >
            {currentView === 'activities' ? (
              <>
                <TbCalendar />
                <span>Calendar View</span>
              </>
            ) : (
              <>
                <TbList />
                <span>Activity Log</span>
              </>
            )}
          </button>
          
          <button 
            className="menu-item about-menu-item"
            onClick={handleAbout}
          >
            <TbInfoSquare />
            <span>About</span>
          </button>
        </div>
      )}
    </header>
  )
}