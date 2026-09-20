import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { BarList } from '@/components/reportes/BarList';
import { MetricCard } from '@/components/reportes/MetricCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/theme';
import { reportesService } from '@/services/reportes.service';
import type { ReporteDashboard } from '@/types/reportes';
import { errorMessage } from '@/utils/dialog';

const pad = (value: number) => String(value).padStart(2, '0');
const isoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const addDays = (date: Date, days: number) => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
};
const money = (value: string | number) => new Intl.NumberFormat('es-PE', {
  style: 'currency', currency: 'PEN', minimumFractionDigits: 2,
}).format(Number(value));
const label = (value: string) => value.replaceAll('_', ' ').replace(/^./, (x) => x.toUpperCase());

const today = new Date();
const initialRange = { desde: isoDate(addDays(today, -29)), hasta: isoDate(today) };

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const theme = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return <Card style={styles.section}>
    <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
    {subtitle ? <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
    <View style={styles.sectionBody}>{children}</View>
  </Card>;
}

export default function AdminReportesScreen() {
  const theme = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [desde, setDesde] = useState(initialRange.desde);
  const [hasta, setHasta] = useState(initialRange.hasta);
  const [applied, setApplied] = useState(initialRange);
  const [data, setData] = useState<ReporteDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterError, setFilterError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await reportesService.consultar(applied.desde, applied.hasta)); }
    catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }, [applied]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const apply = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
      setFilterError('Usa el formato AAAA-MM-DD.'); return;
    }
    if (desde > hasta) { setFilterError('La fecha inicial no puede superar la fecha final.'); return; }
    const days = Math.round((new Date(`${hasta}T00:00:00`).getTime() - new Date(`${desde}T00:00:00`).getTime()) / 86400000) + 1;
    if (days > 366) { setFilterError('El periodo máximo es de 366 días.'); return; }
    setFilterError(''); setApplied({ desde, hasta });
  };
  const preset = (days: number) => {
    const now = new Date();
    const range = { desde: isoDate(addDays(now, -(days - 1))), hasta: isoDate(now) };
    setDesde(range.desde); setHasta(range.hasta); setFilterError(''); setApplied(range);
  };
  const currentMonth = () => {
    const now = new Date(); const range = { desde: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), hasta: isoDate(now) };
    setDesde(range.desde); setHasta(range.hasta); setFilterError(''); setApplied(range);
  };

  const totalServicios = useMemo(() => data?.servicios.reduce((sum, item) => sum + item.cantidad, 0) ?? 0, [data]);

  return <Screen title="Reportes e indicadores" subtitle="Resultados económicos, operativos y del personal por sede y periodo." refreshing={loading} onRefresh={load}>
    <Card style={styles.filters}>
      <View style={styles.presets}>
        <Button title="7 días" size="sm" variant="outline" onPress={() => preset(7)} />
        <Button title="30 días" size="sm" variant="outline" onPress={() => preset(30)} />
        <Button title="Mes actual" size="sm" variant="outline" onPress={currentMonth} />
      </View>
      <View style={styles.dateRow}>
        <View style={styles.dateInput}><Input label="Desde" value={desde} onChangeText={setDesde} placeholder="AAAA-MM-DD" autoCapitalize="none" /></View>
        <View style={styles.dateInput}><Input label="Hasta" value={hasta} onChangeText={setHasta} placeholder="AAAA-MM-DD" autoCapitalize="none" /></View>
        <Button title="Aplicar" onPress={apply} style={styles.applyButton} />
      </View>
      {filterError ? <Text accessibilityRole="alert" style={{ color: theme.danger }}>{filterError}</Text> : null}
    </Card>

    {loading && !data ? <ActivityIndicator size="large" color={theme.primary} /> : null}
    {error ? <Card><Text accessibilityRole="alert" style={{ color: theme.danger }}>{error}</Text><Button title="Reintentar" onPress={load} /></Card> : null}
    {data ? <>
      <Text style={[styles.period, { color: theme.textSecondary }]}>Periodo aplicado: {data.periodo.desde} al {data.periodo.hasta}</Text>
      <View style={styles.metrics}>
        <MetricCard label="Ingresos brutos" value={money(data.ingresos.brutos)} helper="Cobros emitidos en el periodo" />
        <MetricCard label="Reembolsos" value={money(data.ingresos.reembolsados)} helper="Reversiones del periodo" danger={Number(data.ingresos.reembolsados) > 0} />
        <MetricCard label="Ingreso neto" value={money(data.ingresos.netos)} helper="Bruto menos reembolsos" danger={Number(data.ingresos.netos) < 0} />
        <MetricCard label="Servicios realizados" value={String(totalServicios)} helper="Unidades en atenciones finalizadas" />
        <MetricCard label="Reservas programadas" value={String(data.reservas.total)} helper={`${data.reservas.tasa_cancelacion.toFixed(1)}% canceladas`} />
        <MetricCard label="Unidades vendidas" value={String(data.ventas.unidades_vendidas)} helper="Pedidos cobrados, en preparación o entregados" />
      </View>

      <View style={styles.twoColumns}>
        <View style={styles.column}><Section title="Ingresos por origen" subtitle="Cobros brutos, sin multiplicar por líneas de detalle.">
          <BarList items={data.ingresos.por_tipo.map((x) => ({ label: x.categoria, value: Number(x.neto), detail: `${money(x.neto)} neto · ${money(x.bruto)} bruto · ${money(x.reembolso)} reemb.`, negative: Number(x.neto) < 0 }))} />
        </Section></View>
        <View style={styles.column}><Section title="Métodos de pago" subtitle="Distribución del importe cobrado.">
          <BarList items={data.ingresos.por_metodo.map((x) => ({ label: label(x.categoria), value: Number(x.neto), detail: `${money(x.neto)} neto · ${money(x.reembolso)} reemb.`, negative: Number(x.neto) < 0 }))} />
        </Section></View>
      </View>

      <Section title="Movimiento diario" subtitle="El neto puede ser negativo si ese día hubo reembolsos de cobros anteriores.">
        <BarList items={data.ingresos.serie_diaria.map((x) => ({ label: x.fecha, value: Number(x.neto), detail: money(x.neto), negative: Number(x.neto) < 0 }))} />
      </Section>

      <Section title="Servicios realizados" subtitle="Atenciones finalizadas; el valor usa el precio guardado en la reserva.">
        <BarList items={data.servicios.map((x) => ({ label: x.nombre, value: x.cantidad, detail: `${x.cantidad} · ${money(x.valor_operativo)}` }))} />
      </Section>

      <View style={styles.twoColumns}>
        <View style={styles.column}><Section title="Pedidos por estado" subtitle={`Cobrado neto de productos: ${money(data.ventas.cobrado_neto)}`}>
          <BarList items={data.ventas.pedidos_por_estado.map((x) => ({ label: label(x.estado), value: x.cantidad }))} />
        </Section></View>
        <View style={styles.column}><Section title="Reservas por estado" subtitle={`${data.reservas.canceladas} de ${data.reservas.total} canceladas (${data.reservas.tasa_cancelacion.toFixed(1)}%).`}>
          <BarList items={data.reservas.por_estado.map((x) => ({ label: label(x.estado), value: x.cantidad, negative: x.estado === 'cancelada' }))} />
        </Section></View>
      </View>

      <View style={styles.twoColumns}>
        <View style={styles.column}><Section title="Demanda por horario" subtitle="Total programado y cancelaciones incluidas.">
          <BarList items={data.demanda.por_horario.map((x) => ({ label: x.categoria, value: x.total, detail: `${x.total} · ${x.canceladas} canc.` }))} />
        </Section></View>
        <View style={styles.column}><Section title="Demanda por servicio" subtitle="Unidades solicitadas y canceladas.">
          <BarList items={data.demanda.por_servicio.map((x) => ({ label: x.categoria, value: x.total, detail: `${x.total} · ${x.canceladas} canc.` }))} />
        </Section></View>
      </View>

      <Section title="Demanda diaria" subtitle="Reservas según su fecha programada actual.">
        <BarList items={data.demanda.por_dia.map((x) => ({ label: x.fecha, value: x.total, detail: `${x.total} · ${x.canceladas} canc.` }))} />
      </Section>

      <Section title="Productividad del personal" subtitle="La misma regla de RF-13: una participación por trabajador y atención finalizada.">
        {data.productividad.length === 0 ? <Text style={{ color: theme.textSecondary }}>No hay atenciones finalizadas en el periodo.</Text> : data.productividad.map((x) => <View key={x.id_trabajador} style={[styles.worker, { borderBottomColor: theme.border }]}>
          <Text style={[styles.workerName, { color: theme.text }]}>{x.trabajador}</Text>
          <Text style={{ color: theme.textSecondary }}>{x.atenciones_finalizadas} atenciones · {x.servicios_en_equipo} servicios · {x.duracion_promedio_min == null ? 'Sin duración' : `${Math.round(x.duracion_promedio_min)} min promedio`}</Text>
        </View>)}
      </Section>

      <Section title="Tipos de vehículo atendidos" subtitle="Atenciones finalizadas y vehículos únicos.">
        <BarList items={data.tipos_vehiculo.map((x) => ({ label: x.tipo, value: x.atenciones, detail: `${x.atenciones} atenc. · ${x.vehiculos_distintos} vehículos` }))} />
      </Section>

      <Card style={styles.notes}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Criterios del reporte</Text>
        {data.notas.map((note) => <Text key={note} style={[styles.note, { color: theme.textSecondary }]}>• {note}</Text>)}
      </Card>
    </> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  filters: { padding: 18 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  dateRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 },
  dateInput: { flexGrow: 1, flexBasis: 180 },
  applyButton: { marginBottom: 16 },
  period: { fontSize: 12, marginBottom: 12 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  twoColumns: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  column: { flexGrow: 1, flexBasis: 310 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  sectionSubtitle: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  sectionBody: { marginTop: 18 },
  worker: { paddingVertical: 12, borderBottomWidth: 1, gap: 4 },
  workerName: { fontWeight: '700', fontSize: 14 },
  notes: { padding: 20 },
  note: { fontSize: 12, lineHeight: 18, marginTop: 8 },
});
