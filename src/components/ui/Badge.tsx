import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BorderRadius, Spacing } from '@/constants/theme';

interface BadgeProps {
  label: string;
  status?: string;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  status = 'default',
  size = 'md',
  showDot = true,
}) => {
  const normalized = (status || label).toLowerCase();

  let bg = '#1c202a';
  let text = '#94a3b8';
  let dotColor = '#64748b';

  if (
    normalized.includes('respondido') ||
    normalized.includes('completad') ||
    normalized.includes('pagad') ||
    normalized.includes('finalizad') ||
    normalized.includes('entregad') ||
    normalized.includes('disponible')
  ) {
    bg = 'rgba(16, 185, 129, 0.18)';
    text = '#34d399';
    dotColor = '#10b981';
  } else if (
    normalized.includes('en_revision') ||
    normalized.includes('en_proceso') ||
    normalized.includes('pendiente') ||
    normalized.includes('programada')
  ) {
    bg = 'rgba(245, 158, 11, 0.18)';
    text = '#fbbf24';
    dotColor = '#f59e0b';
  } else if (
    normalized.includes('registrado') ||
    normalized.includes('abierto')
  ) {
    bg = 'rgba(56, 189, 248, 0.18)';
    text = '#38bdf8';
    dotColor = '#0284c7';
  } else if (
    normalized.includes('cerrado') ||
    normalized.includes('cancelad') ||
    normalized.includes('anulad') ||
    normalized.includes('rechazad')
  ) {
    bg = 'rgba(239, 68, 68, 0.18)';
    text = '#f87171';
    dotColor = '#ef4444';
  } else if (normalized.includes('administrador')) {
    bg = 'rgba(16, 185, 129, 0.22)';
    text = '#10b981';
    dotColor = '#10b981';
  } else if (normalized.includes('cliente')) {
    bg = '#222734';
    text = '#e2e8f0';
    dotColor = '#10b981';
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        isSmall && styles.badgeSm,
      ]}>
      {showDot && (
        <View
          style={[
            styles.dot,
            { backgroundColor: dotColor },
            isSmall && styles.dotSm,
          ]}
        />
      )}
      <Text
        style={[
          styles.text,
          { color: text },
          isSmall && styles.textSm,
        ]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.half + 2,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  badgeSm: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: BorderRadius.full,
  },
  dotSm: {
    width: 5,
    height: 5,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  textSm: {
    fontSize: 10,
    fontWeight: '600',
  },
});
