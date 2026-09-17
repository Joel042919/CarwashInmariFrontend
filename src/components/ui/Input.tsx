import React from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  pill?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  pill = false,
  style,
  ...props
}) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={theme.textTertiary}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            color: theme.text,
            borderColor: error ? theme.danger : theme.border,
            borderRadius: pill ? BorderRadius.full : BorderRadius.lg,
          },
          style,
        ]}
        {...props}
      />
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
  input: {
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
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
