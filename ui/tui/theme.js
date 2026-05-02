/**
 * ConductorOne Theme - Light & Dark Mode
 * Based on ConductorOne platform design
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ConductorOne Color Palette
const colors = {
  // Primary colors from C1 platform
  blue: '#4169E1',          // Primary blue for interactive elements
  blueLight: '#6B8FFF',     // Lighter blue for hover states
  blueDark: '#2952CC',      // Darker blue for pressed states

  green: '#9DD99D',         // Success/positive green
  greenDark: '#7BC47B',     // Darker green for dark mode

  purple: '#C5B8E8',        // Accent purple/lavender
  purpleDark: '#A898D8',    // Darker purple for dark mode

  // Backgrounds
  cardLight: '#E8EEF7',     // Light blue-gray card backgrounds
  cardLightAlt: '#F0F4FB',  // Alternative card background

  // Grays for light mode
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Dark mode backgrounds
  darkBg: '#1A1D2E',
  darkBgSecondary: '#252938',
  darkBgTertiary: '#2F3344',

  // Status colors
  statusGreen: '#9DD99D',
  statusYellow: '#F5C563',
  statusRed: '#EF6461',
  statusBlue: '#6B8FFF',
  statusGray: '#9CA3AF'
};

// Light Theme
const lightTheme = {
  name: 'light',

  screen: {
    bg: '#FFFFFF',
    fg: colors.gray900
  },

  border: {
    default: {
      fg: colors.gray200
    },
    active: {
      fg: colors.blue
    },
    subtle: {
      fg: colors.gray100
    }
  },

  label: {
    fg: colors.blue,
    bold: false
  },

  list: {
    bg: '#FFFFFF',
    fg: colors.gray900,
    selected: {
      bg: colors.cardLight,
      fg: colors.gray900,
      bold: false
    },
    item: {
      fg: colors.gray700
    }
  },

  box: {
    bg: '#FFFFFF',
    fg: colors.gray900
  },

  card: {
    bg: colors.cardLight,
    fg: colors.gray900,
    border: colors.gray200
  },

  statusBar: {
    bg: colors.gray100,
    fg: colors.gray600
  },

  modal: {
    bg: '#FFFFFF',
    fg: colors.gray900,
    overlay: {
      bg: 'black',
      fg: 'white'
    }
  },

  input: {
    bg: colors.gray50,
    fg: colors.gray900,
    focus: {
      bg: '#FFFFFF',
      fg: colors.gray900,
      border: colors.blue
    }
  },

  text: {
    primary: colors.gray900,
    secondary: colors.gray600,
    muted: colors.gray400,
    bright: colors.gray900
  },

  statusColors: {
    completed: colors.statusGreen,
    running: colors.statusYellow,
    error: colors.statusRed,
    checkpoint: colors.statusBlue,
    pending: colors.statusGray
  },

  accents: {
    blue: colors.blue,
    blueLight: colors.blueLight,
    blueDark: colors.blueDark,
    green: colors.green,
    purple: colors.purple,
    yellow: colors.statusYellow,
    red: colors.statusRed
  }
};

// Dark Theme
const darkTheme = {
  name: 'dark',

  screen: {
    bg: colors.darkBg,
    fg: colors.gray100
  },

  border: {
    default: {
      fg: colors.darkBgTertiary
    },
    active: {
      fg: colors.blueLight
    },
    subtle: {
      fg: colors.darkBgSecondary
    }
  },

  label: {
    fg: colors.blueLight,
    bold: false
  },

  list: {
    bg: colors.darkBg,
    fg: colors.gray100,
    selected: {
      bg: colors.darkBgTertiary,
      fg: '#FFFFFF',
      bold: false
    },
    item: {
      fg: colors.gray400
    }
  },

  box: {
    bg: colors.darkBg,
    fg: colors.gray100
  },

  card: {
    bg: colors.darkBgSecondary,
    fg: colors.gray100,
    border: colors.darkBgTertiary
  },

  statusBar: {
    bg: colors.darkBgSecondary,
    fg: colors.gray400
  },

  modal: {
    bg: colors.darkBgSecondary,
    fg: colors.gray100,
    overlay: {
      bg: 'black',
      fg: 'white'
    }
  },

  input: {
    bg: colors.darkBgTertiary,
    fg: colors.gray100,
    focus: {
      bg: colors.darkBgSecondary,
      fg: '#FFFFFF',
      border: colors.blueLight
    }
  },

  text: {
    primary: colors.gray100,
    secondary: colors.gray400,
    muted: colors.gray500,
    bright: '#FFFFFF'
  },

  statusColors: {
    completed: colors.statusGreen,
    running: colors.statusYellow,
    error: colors.statusRed,
    checkpoint: colors.statusBlue,
    pending: colors.statusGray
  },

  accents: {
    blue: colors.blueLight,
    blueLight: colors.blueLight,
    blueDark: colors.blue,
    green: colors.green,
    purple: colors.purpleDark,
    yellow: colors.statusYellow,
    red: colors.statusRed
  }
};

// Theme Manager
class ThemeManager {
  constructor() {
    this.configPath = path.join(os.homedir(), '.support-triage-theme.json');
    this.currentMode = this.loadPreference();
  }

  loadPreference() {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        return config.mode || 'light';
      }
    } catch (error) {
      // Ignore errors, use default
    }
    return 'light'; // Default to light mode
  }

  savePreference(mode) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify({ mode }, null, 2));
    } catch (error) {
      // Ignore errors
    }
  }

  toggle() {
    this.currentMode = this.currentMode === 'light' ? 'dark' : 'light';
    this.savePreference(this.currentMode);
    return this.currentMode;
  }

  getTheme() {
    return this.currentMode === 'light' ? lightTheme : darkTheme;
  }

  setMode(mode) {
    if (mode === 'light' || mode === 'dark') {
      this.currentMode = mode;
      this.savePreference(mode);
      return true;
    }
    return false;
  }

  getMode() {
    return this.currentMode;
  }
}

// Create singleton instance
const themeManager = new ThemeManager();

// Export current theme and manager
export default themeManager.getTheme();
export { themeManager, lightTheme, darkTheme };
