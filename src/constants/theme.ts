import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#ffffff',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    background: '#0d0f12', // Deep matte luxury automotive black
    backgroundElement: '#161920', // Elevated luxury charcoal card
    backgroundSelected: '#10b981',
    border: '#232732',
    borderLight: '#1a1d26',
    primary: '#10b981', // Vivid emerald green accent (as requested replacing yellow)
    primaryHover: '#059669',
    primaryLight: '#064e3b',
    primaryText: '#000000', // Black text on emerald buttons
    accent: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.15)',
    accentDark: '#047857',
    sky: '#38bdf8',
    skyBg: '#0c2438',
    secondary: '#222734',
    secondaryText: '#94a3b8',
    success: '#10b981',
    successBg: 'rgba(16, 185, 129, 0.15)',
    warning: '#f59e0b',
    warningBg: 'rgba(245, 158, 11, 0.15)',
    danger: '#ef4444',
    dangerBg: 'rgba(239, 68, 68, 0.15)',
    card: '#161920',
    surface: '#1c202a',
  },
  dark: {
    text: '#ffffff',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    background: '#0d0f12',
    backgroundElement: '#161920',
    backgroundSelected: '#10b981',
    border: '#232732',
    borderLight: '#1a1d26',
    primary: '#10b981',
    primaryHover: '#059669',
    primaryLight: '#064e3b',
    primaryText: '#000000',
    accent: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.15)',
    accentDark: '#047857',
    sky: '#38bdf8',
    skyBg: '#0c2438',
    secondary: '#222734',
    secondaryText: '#94a3b8',
    success: '#10b981',
    successBg: 'rgba(16, 185, 129, 0.15)',
    warning: '#f59e0b',
    warningBg: 'rgba(245, 158, 11, 0.15)',
    danger: '#ef4444',
    dangerBg: 'rgba(239, 68, 68, 0.15)',
    card: '#161920',
    surface: '#1c202a',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const BREAKPOINT_DESKTOP = 768;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    serif: 'Georgia, serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  full: 9999, // Perfect pill
} as const;

export const BottomTabInset = Platform.select({ ios: 70, android: 80 }) ?? 75;
export const MaxContentWidth = 1200;
