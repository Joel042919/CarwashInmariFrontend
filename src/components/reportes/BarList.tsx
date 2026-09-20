import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export interface BarItem {
  label: string;
  value: number;
  detail?: string;
  negative?: boolean;
}

interface Props {
  items: BarItem[];
  emptyText?: string;
}

export function BarList({ items, emptyText = 'No hay datos en este periodo.' }: Props) {
  const theme = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const max = Math.max(1, ...items.map((item) => Math.abs(item.value)));
  if (items.length === 0) return <Text style={{ color: theme.textSecondary }}>{emptyText}</Text>;

  return <View style={styles.list}>
    {items.map((item, index) => <View key={`${item.label}-${index}`} style={styles.item}>
      <View style={styles.row}>
        <Text numberOfLines={1} style={[styles.label, { color: theme.text }]}>{item.label}</Text>
        <Text style={[styles.detail, { color: item.negative ? theme.danger : theme.textSecondary }]}>
          {item.detail ?? item.value}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.surface }]}>
        <View style={[styles.bar, {
          width: `${Math.max(2, Math.abs(item.value) * 100 / max)}%`,
          backgroundColor: item.negative ? theme.danger : theme.accent,
        }]} />
      </View>
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  list: { gap: 13 },
  item: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  label: { flex: 1, fontSize: 13, fontWeight: '600' },
  detail: { fontSize: 12, fontWeight: '700', textAlign: 'right' },
  track: { height: 7, borderRadius: 99, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 99 },
});
