import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/theme';

interface Props {
  label: string;
  value: string;
  helper?: string;
  danger?: boolean;
}

export function MetricCard({ label, value, helper, danger }: Props) {
  const theme = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return <Card style={styles.card}>
    <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    <Text style={[styles.value, { color: danger ? theme.danger : theme.text }]}>{value}</Text>
    {helper ? <Text style={[styles.helper, { color: theme.textTertiary }]}>{helper}</Text> : null}
  </Card>;
}

const styles = StyleSheet.create({
  card: { flexGrow: 1, flexBasis: 170, minWidth: 150, padding: 18, marginBottom: 0 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 24, fontWeight: '900', marginTop: 7 },
  helper: { fontSize: 11, lineHeight: 16, marginTop: 4 },
});
