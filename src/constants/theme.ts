import { Platform } from 'react-native';


// Paleta oscura única (tono grafito verdoso, sobria). Las claves `light` y `dark` apuntan a la
// misma paleta para que la app se vea igual sin importar el modo del sistema (los componentes
// hacen Colors[scheme === 'dark' ? 'dark' : 'light']).
//
// Criterios: sin negro puro ni verde neón; texto en blanco cálido (no #fff); dos verdes con
// función distinta: `primary` (relleno de botones, texto blanco encima, contraste AA) y
// `accent` (texto e íconos sobre fondo oscuro, más claro para que se lea bien).
const darkPalette = {
  // Texto
  text: '#eaf1ed',
  textSecondary: '#a7b5ae',
  textTertiary: '#7b8c84',
  // Fondos: página < tarjetas < superficies (campos, chips)
  background: '#0e1412',
  backgroundElement: '#151c19',
  backgroundSelected: '#1c8563',
  border: '#26322d',
  borderLight: '#1e2823',
  // Navegación (barra lateral y barra inferior): verde bosque
  nav: '#10261f',
  navText: '#9bd8c1',
  navActive: '#3fae88',
  // Verdes
  primary: '#1c8563',
  primaryHover: '#176f52',
  primaryLight: '#173a2f',
  primaryText: '#ffffff',
  accent: '#3fae88',
  accentBg: 'rgba(63, 174, 136, 0.14)',
  accentDark: '#8fd6bb', // texto/ícono verde claro sobre botones secundarios
  // Tonos de apoyo
  sky: '#5fa8d3',
  skyBg: 'rgba(95, 168, 211, 0.14)',
  secondary: '#22302a',
  secondaryText: '#a7b5ae',
  success: '#3fae88',
  successBg: 'rgba(63, 174, 136, 0.14)',
  warning: '#d9a441',
  warningBg: 'rgba(217, 164, 65, 0.14)',
  danger: '#cf5b5b',
  dangerBg: 'rgba(207, 91, 91, 0.14)',
  card: '#151c19',
  surface: '#1c2520',
} as const;

const lightPalette = {
  text: '#14251d', textSecondary: '#50645a', textTertiary: '#74867c',
  background: '#f5f8f6', backgroundElement: '#ffffff', backgroundSelected: '#d8f0e5',
  border: '#d7e2db', borderLight: '#e7eee9', nav: '#ffffff', navText: '#4f675b', navActive: '#167553',
  primary: '#167553', primaryHover: '#105d41', primaryLight: '#d8f0e5', primaryText: '#ffffff',
  accent: '#167553', accentBg: 'rgba(22, 117, 83, 0.12)', accentDark: '#167553',
  sky: '#276f9e', skyBg: 'rgba(39, 111, 158, 0.12)', secondary: '#edf3ef', secondaryText: '#41564b',
  success: '#167553', successBg: 'rgba(22, 117, 83, 0.12)', warning: '#9a6814', warningBg: 'rgba(217, 164, 65, 0.16)',
  danger: '#b23e3e', dangerBg: 'rgba(178, 62, 62, 0.12)', card: '#ffffff', surface: '#edf3ef',
} as const;

export const Colors = { light: lightPalette, dark: darkPalette } as const;

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
