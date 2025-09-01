import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Theme, ThemeName } from '../themes/themes';
import { themes } from '../themes/themes';

interface ThemeContextType {
  currentTheme: Theme;
  themeName: ThemeName;
  isDarkMode: boolean;
  setTheme: (themeName: ThemeName) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>('professional');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load saved theme preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('babyTracker_theme') as ThemeName;
    const savedDarkMode = localStorage.getItem('babyTracker_darkMode');
    
    if (savedTheme && themes[savedTheme]) {
      setThemeName(savedTheme);
    }
    
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const theme = themes[themeName];
    const colors = isDarkMode ? theme.colors.dark : theme.colors.light;
    
    const root = document.documentElement;
    
    // Apply CSS variables
    root.style.setProperty('--bg-primary', colors.bgPrimary);
    root.style.setProperty('--bg-secondary', colors.bgSecondary);
    root.style.setProperty('--bg-card', colors.bgCard);
    root.style.setProperty('--text-primary', colors.textPrimary);
    root.style.setProperty('--text-secondary', colors.textSecondary);
    root.style.setProperty('--text-muted', colors.textMuted);
    
    root.style.setProperty('--accent-feeding', colors.accentFeeding);
    root.style.setProperty('--accent-feeding-text', colors.accentFeedingText);
    root.style.setProperty('--accent-orange', colors.accentOrange);
    root.style.setProperty('--accent-orange-text', colors.accentOrangeText);
    root.style.setProperty('--accent-diaper', colors.accentDiaper);
    root.style.setProperty('--accent-diaper-text', colors.accentDiaperText);
    root.style.setProperty('--accent-sleep', colors.accentSleep);
    root.style.setProperty('--accent-sleep-text', colors.accentSleepText);
    
    root.style.setProperty('--header-bg', colors.headerBg);
    root.style.setProperty('--header-text', colors.headerText);
    root.style.setProperty('--border-color', colors.borderColor);
    root.style.setProperty('--shadow', colors.shadow);
    
    // Set data-theme attribute for any remaining CSS
    root.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    root.setAttribute('data-color-theme', themeName);
  }, [themeName, isDarkMode]);

  const setTheme = (newThemeName: ThemeName) => {
    setThemeName(newThemeName);
    localStorage.setItem('babyTracker_theme', newThemeName);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('babyTracker_darkMode', JSON.stringify(newDarkMode));
  };

  const value: ThemeContextType = {
    currentTheme: themes[themeName],
    themeName,
    isDarkMode,
    setTheme,
    toggleDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};