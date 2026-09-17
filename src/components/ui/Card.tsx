import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, useColorScheme, Platform } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  noBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, noBorder = false }) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: noBorder ? 'transparent' : theme.border,
        },
        style,
      ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl, // 24px luxury radius
    borderWidth: 1,
    padding: Spacing.four + 2,
    marginBottom: Spacing.three + 2,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
      },
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
    }),
  },
});
