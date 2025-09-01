export interface Theme {
  name: string;
  displayName: string;
  colors: {
    light: {
      bgPrimary: string;
      bgSecondary: string;
      bgCard: string;
      textPrimary: string;
      textSecondary: string;
      textMuted: string;
      
      accentFeeding: string;
      accentFeedingText: string;
      accentOrange: string;
      accentOrangeText: string;
      accentDiaper: string;
      accentDiaperText: string;
      accentSleep: string;
      accentSleepText: string;
      
      headerBg: string;
      headerText: string;
      borderColor: string;
      shadow: string;
    };
    dark: {
      bgPrimary: string;
      bgSecondary: string;
      bgCard: string;
      textPrimary: string;
      textSecondary: string;
      textMuted: string;
      
      accentFeeding: string;
      accentFeedingText: string;
      accentOrange: string;
      accentOrangeText: string;
      accentDiaper: string;
      accentDiaperText: string;
      accentSleep: string;
      accentSleepText: string;
      
      headerBg: string;
      headerText: string;
      borderColor: string;
      shadow: string;
    };
  };
}

// Current purple theme
export const purpleTheme: Theme = {
  name: 'legacy',
  displayName: 'Legacy',
  colors: {
    light: {
      bgPrimary: '#fef7ff',
      bgSecondary: '#ffffff',
      bgCard: '#ffffff',
      textPrimary: '#2e2e2e',
      textSecondary: '#666666',
      textMuted: '#999999',
      
      accentFeeding: '#e8f5e8',
      accentFeedingText: '#2d5f2d',
      accentOrange: '#fff4e6',
      accentOrangeText: '#8b4513',
      accentDiaper: '#e6f3ff',
      accentDiaperText: '#1e3a8a',
      accentSleep: '#f3e8ff',
      accentSleepText: '#5b21b6',
      
      headerBg: '#b8a9ff',
      headerText: '#ffffff',
      borderColor: '#e8e9ea',
      shadow: 'rgba(0, 0, 0, 0.08)'
    },
    dark: {
      bgPrimary: '#1a1625',
      bgSecondary: '#2a2438',
      bgCard: '#332d41',
      textPrimary: '#e8e9ea',
      textSecondary: '#b8b9ba',
      textMuted: '#888989',
      
      accentFeeding: '#2d4a2d',
      accentFeedingText: '#a8d4a8',
      accentOrange: '#4a3829',
      accentOrangeText: '#deb887',
      accentDiaper: '#1e3a5f',
      accentDiaperText: '#87ceeb',
      accentSleep: '#3d2a5f',
      accentSleepText: '#dda0ff',
      
      headerBg: '#6b46c1',
      headerText: '#ffffff',
      borderColor: '#484554',
      shadow: 'rgba(0, 0, 0, 0.3)'
    }
  }
};

// Professional theme with mellow beige tones
export const professionalTheme: Theme = {
  name: 'professional',
  displayName: 'Professional',
  colors: {
    light: {
      bgPrimary: '#f8f6f3',
      bgSecondary: '#f5f3f0',
      bgCard: '#f5f3f0',
      textPrimary: '#3a3633',
      textSecondary: '#6b6761',
      textMuted: '#9c9690',
      
      accentFeeding: '#f5f3f0',
      accentFeedingText: '#3a3633',
      accentOrange: '#f5f3f0',
      accentOrangeText: '#3a3633',
      accentDiaper: '#f5f3f0',
      accentDiaperText: '#3a3633',
      accentSleep: '#f5f3f0',
      accentSleepText: '#3a3633',
      
      headerBg: '#8b8680',
      headerText: '#f8f6f3',
      borderColor: '#e8e5e1',
      shadow: 'rgba(58, 54, 51, 0.08)'
    },
    dark: {
      bgPrimary: '#2a2622',
      bgSecondary: '#3a3633',
      bgCard: '#413e3a',
      textPrimary: '#f8f6f3',
      textSecondary: '#d4d1cc',
      textMuted: '#9c9690',
      
      accentFeeding: '#413e3a',
      accentFeedingText: '#f8f6f3',
      accentOrange: '#413e3a',
      accentOrangeText: '#f8f6f3',
      accentDiaper: '#413e3a',
      accentDiaperText: '#f8f6f3',
      accentSleep: '#413e3a',
      accentSleepText: '#f8f6f3',
      
      headerBg: '#6b6761',
      headerText: '#f8f6f3',
      borderColor: '#4d4a46',
      shadow: 'rgba(0, 0, 0, 0.3)'
    }
  }
};

// Green earthy theme
export const greenTheme: Theme = {
  name: 'green',
  displayName: 'Forest Green',
  colors: {
    light: {
      bgPrimary: '#f5f8f5',
      bgSecondary: '#eef3ee',
      bgCard: '#eef3ee',
      textPrimary: '#3e2723',
      textSecondary: '#5d4037',
      textMuted: '#8d6e63',
      
      accentFeeding: '#9ebc8a',
      accentFeedingText: '#2e3b2e',
      accentOrange: '#d2d0a0',
      accentOrangeText: '#4a4635',
      accentDiaper: '#9ebc8a',
      accentDiaperText: '#2e3b2e',
      accentSleep: '#73946b',
      accentSleepText: '#2e3b2e',
      
      headerBg: '#537d5d',
      headerText: '#f5f8f5',
      borderColor: '#c8d4c8',
      shadow: 'rgba(62, 39, 35, 0.08)'
    },
    dark: {
      bgPrimary: '#1a2e1a',
      bgSecondary: '#2e3b2e',
      bgCard: '#354535',
      textPrimary: '#eef3ee',
      textSecondary: '#c8d4c8',
      textMuted: '#9ebc8a',
      
      accentFeeding: '#537d5d',
      accentFeedingText: '#eef3ee',
      accentOrange: '#73946b',
      accentOrangeText: '#eef3ee',
      accentDiaper: '#537d5d',
      accentDiaperText: '#eef3ee',
      accentSleep: '#73946b',
      accentSleepText: '#eef3ee',
      
      headerBg: '#73946b',
      headerText: '#f5f8f5',
      borderColor: '#4a5a4a',
      shadow: 'rgba(0, 0, 0, 0.3)'
    }
  }
};

// Earth tones theme based on the color palette (legacy)
export const earthTheme: Theme = {
  name: 'earth',
  displayName: 'Earth Tones',
  colors: {
    light: {
      bgPrimary: '#f1dac4',
      bgSecondary: '#ffffff',
      bgCard: '#ffffff',
      textPrimary: '#2e2e2e',
      textSecondary: '#666666',
      textMuted: '#999999',
      
      accentFeeding: '#e8f5e8',
      accentFeedingText: '#2d5f2d',
      accentOrange: '#f1dac4',
      accentOrangeText: '#8b4513',
      accentDiaper: '#e0f0ff',
      accentDiaperText: '#161b33',
      accentSleep: '#ede8f0',
      accentSleepText: '#474973',
      
      headerBg: '#a69cac',
      headerText: '#ffffff',
      borderColor: '#e8e9ea',
      shadow: 'rgba(0, 0, 0, 0.08)'
    },
    dark: {
      bgPrimary: '#0d0c1d',
      bgSecondary: '#161b33',
      bgCard: '#1a1f35',
      textPrimary: '#e8e9ea',
      textSecondary: '#b8b9ba',
      textMuted: '#888989',
      
      accentFeeding: '#2d4a2d',
      accentFeedingText: '#a8d4a8',
      accentOrange: '#3d3325',
      accentOrangeText: '#f1dac4',
      accentDiaper: '#1a2840',
      accentDiaperText: '#87ceeb',
      accentSleep: '#2a2438',
      accentSleepText: '#a69cac',
      
      headerBg: '#474973',
      headerText: '#ffffff',
      borderColor: '#2a2f45',
      shadow: 'rgba(0, 0, 0, 0.3)'
    }
  }
};

export const themes = {
  professional: professionalTheme,
  green: greenTheme,
  legacy: purpleTheme,
  earth: earthTheme
};

export type ThemeName = keyof typeof themes;

export const themesList = Object.values(themes);