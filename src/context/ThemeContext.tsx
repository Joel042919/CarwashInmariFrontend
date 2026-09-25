import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';
type ThemeContextValue = { preference: ThemePreference; resolvedTheme: 'light' | 'dark'; setPreference: (preference: ThemePreference) => Promise<void> };
const STORAGE_KEY = '@carwash_inmari_theme_preference';
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
let webOverride: 'light' | 'dark' | null = null;
const webListeners = new Set<(appearance: { colorScheme: 'light' | 'dark' }) => void>();

// React Native Web detecta el sistema, pero no incluye setColorScheme. Adaptamos
// esa interfaz para que los componentes existentes con useColorScheme reaccionen
// también a la preferencia manual de la aplicación.
if (Platform.OS === 'web') {
  const webAppearance = Appearance as any;
  const getSystemScheme = webAppearance.getColorScheme.bind(webAppearance) as () => 'light' | 'dark';
  const addSystemListener = webAppearance.addChangeListener.bind(webAppearance) as (listener: () => void) => { remove: () => void };
  const notifyWebListeners = () => {
    const colorScheme = webOverride ?? getSystemScheme();
    webListeners.forEach((listener) => listener({ colorScheme }));
  };
  webAppearance.getColorScheme = () => webOverride ?? getSystemScheme();
  webAppearance.addChangeListener = (listener: (appearance: { colorScheme: 'light' | 'dark' }) => void) => {
    webListeners.add(listener);
    return { remove: () => webListeners.delete(listener) };
  };
  addSystemListener(() => { if (!webOverride) notifyWebListeners(); });
}

const applyPreference = (preference: ThemePreference) => {
  if (Platform.OS === 'web') {
    webOverride = preference === 'system' ? null : preference;
    const colorScheme = (webOverride ?? Appearance.getColorScheme()) as 'light' | 'dark';
    webListeners.forEach((listener) => listener({ colorScheme }));
    return;
  }
  if (typeof Appearance.setColorScheme !== 'function') return;
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const scheme = useColorScheme();
  useEffect(() => { void AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
    const next: ThemePreference = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
    setPreferenceState(next); applyPreference(next);
  }); }, []);
  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next); applyPreference(next); await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);
  return <ThemeContext.Provider value={{ preference, resolvedTheme: scheme === 'dark' ? 'dark' : 'light', setPreference }}>{children}</ThemeContext.Provider>;
}

export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemePreference debe usarse dentro de ThemeProvider');
  return context;
}
