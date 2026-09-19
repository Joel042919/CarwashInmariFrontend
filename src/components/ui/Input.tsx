import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  pill?: boolean;
  /** Ícono de Ionicons dentro del campo, a la izquierda (p. ej. "search-outline"). */
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Estilo buscador: forma de píldora, fondo blanco e ícono de lupa. */
  search?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  pill = false,
  leftIcon,
  search = false,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [focused, setFocused] = useState(false);

  const icon = leftIcon ?? (search ? 'search-outline' : undefined);
  const borderColor = error ? theme.danger : focused ? theme.primary : theme.border;

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
      ) : null}
      <View style={styles.inputWrapper}>
        {icon ? (
          <View style={styles.leftIcon} pointerEvents="none">
            <Ionicons name={icon} size={18} color={focused ? theme.accent : theme.textTertiary} />
          </View>
        ) : null}
        <TextInput
          placeholderTextColor={search ? '#6b8275' : theme.textTertiary}
          style={[
            styles.input,
            {
              backgroundColor: search ? '#ffffff' : theme.surface,
              color: search ? '#10201a' : theme.text,
              borderColor,
              borderRadius: pill || search ? BorderRadius.full : BorderRadius.lg,
            },
            icon ? styles.inputWithIcon : null,
            style,
          ]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
      </View>
      {error ? (
        <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
      ) : helper ? (
        <Text style={[styles.helper, { color: theme.textTertiary }]}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.three,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  inputWrapper: {
    justifyContent: 'center',
  },
  leftIcon: {
    position: 'absolute',
    left: Spacing.three,
    zIndex: 1,
  },
  inputWithIcon: {
    paddingLeft: Spacing.three + 18 + Spacing.two,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    outlineWidth: 0, // en web se quita el contorno del navegador; el borde verde lo reemplaza
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  helper: {
    fontSize: 11,
    marginTop: 4,
  },
});
