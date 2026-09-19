import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const toISODate = (d: Date): string => {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

// "2026-09-22" -> "mar 22 sep" (sin depender de Intl, que varía entre plataformas)
export const formatFecha = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return `${DIAS[date.getDay()]} ${d} ${MESES[m - 1]}`;
};

interface Props {
  value: string; // AAAA-MM-DD, o '' cuando allowAll y no hay filtro
  onChange: (fecha: string) => void;
  /** Cantidad de días a mostrar desde hoy (por defecto 30). */
  days?: number;
  /** Agrega una opción "Todas" que devuelve ''. */
  allowAll?: boolean;
}

// Selector horizontal de fechas, desde hoy en adelante.
export const DateStrip: React.FC<Props> = ({ value, onChange, days = 30, allowAll = false }) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const fechas = useMemo(() => {
    const hoy = new Date();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
      return { iso: toISODate(d), dia: DIAS[d.getDay()], num: d.getDate(), mes: MESES[d.getMonth()] };
    });
  }, [days]);

  const item = (activo: boolean) => [
    styles.item,
    activo
      ? { backgroundColor: theme.primary, borderColor: theme.primary }
      : { backgroundColor: theme.backgroundElement, borderColor: theme.border },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroll}>
      {allowAll && (
        <Pressable onPress={() => onChange('')} style={item(value === '')}>
          <Text style={[styles.num, { color: value === '' ? '#ffffff' : theme.text }]}>Todas</Text>
        </Pressable>
      )}
      {fechas.map((f) => {
        const activo = f.iso === value;
        return (
          <Pressable key={f.iso} onPress={() => onChange(f.iso)} style={item(activo)}>
            <Text style={[styles.dia, { color: activo ? '#d1fae5' : theme.textTertiary }]}>{f.dia}</Text>
            <Text style={[styles.num, { color: activo ? '#ffffff' : theme.text }]}>{f.num}</Text>
            <Text style={[styles.dia, { color: activo ? '#d1fae5' : theme.textTertiary }]}>{f.mes}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, marginBottom: Spacing.three },
  row: { gap: Spacing.two, paddingRight: Spacing.three },
  item: {
    minWidth: 56,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dia: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  num: { fontSize: 17, fontWeight: '900' },
});
