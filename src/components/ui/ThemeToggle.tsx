import React from 'react';
import { Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { ThemePreference, useThemePreference } from '@/context/ThemeContext';

const nextPreference: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

export function ThemeToggle({ style }: { style?: object }) {
  const theme = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const { preference, setPreference } = useThemePreference();
  const icon = preference === 'system' ? 'phone-portrait-outline' : preference === 'light' ? 'sunny-outline' : 'moon-outline';
  const label = preference === 'system' ? 'Tema del sistema' : preference === 'light' ? 'Tema claro' : 'Tema oscuro';
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${label}. Toca para cambiar a ${nextPreference[preference]}.`}
    onPress={() => void setPreference(nextPreference[preference])}
    style={({ pressed }) => [style, { opacity: pressed ? 0.72 : 1 }]}>
    <Ionicons name={icon} size={18} color={theme.text} />
  </Pressable>;
}
