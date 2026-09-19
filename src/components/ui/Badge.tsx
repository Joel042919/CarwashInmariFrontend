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

  let bg = '#232d28';
  let text = '#a7b5ae';
  let dotColor = '#7b8c84';

  if (
    normalized.includes('respondido') ||
    normalized.includes('completad') ||
    normalized.includes('pagad') ||
    normalized.includes('finalizad') ||
    normalized.includes('entregad') ||
    normalized.includes('disponible')
  ) {
    bg = 'rgba(63,174,136,0.16)';
    text = '#6fd0ae';
    dotColor = '#3fae88';
  } else if (
    normalized.includes('en_revision') ||
    normalized.includes('en_proceso') ||
    normalized.includes('pendiente') ||
    normalized.includes('programada')
  ) {
    bg = 'rgba(217,164,65,0.16)';
    text = '#e2b65c';
    dotColor = '#d9a441';
  } else if (
    normalized.includes('registrado') ||
    normalized.includes('abierto')
  ) {
    bg = 'rgba(95,168,211,0.16)';
    text = '#86bfe3';
    dotColor = '#5fa8d3';
  } else if (
    normalized.includes('cerrado') ||
    normalized.includes('cancelad') ||
    normalized.includes('anulad') ||
    normalized.includes('rechazad')
  ) {
    bg = 'rgba(207,91,91,0.16)';
    text = '#e58f8f';
    dotColor = '#cf5b5b';
  } else if (normalized.includes('administrador')) {
    bg = 'rgba(63,174,136,0.16)';
    text = '#6fd0ae';
    dotColor = '#3fae88';
  } else if (normalized.includes('cliente')) {
    bg = '#26322d';
    text = '#cfe0d8';
    dotColor = '#3fae88';
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
