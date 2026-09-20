import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View, useColorScheme } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { atencionesService } from '@/services/atenciones.service';
import { trabajadoresService } from '@/services/trabajadores.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AtencionCard, estadoLabel } from './AtencionCard';
import { errorMessage } from '@/utils/dialog';
import type { Atencion, EstadoAtencion } from '@/types/atenciones';
import type { RendimientoTrabajador } from '@/types/trabajadores';

export function AtencionesPanel({ trabajador }: { trabajador?: string }) {
  const { isAdmin, isTrabajador } = useAuth();
  const theme = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [filtro, setFiltro] = useState({ desde: '', hasta: '' });
  const [estado, setEstado] = useState<EstadoAtencion | undefined>();
  const [items, setItems] = useState<Atencion[]>([]);
  const [rendimiento, setRendimiento] = useState<RendimientoTrabajador | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [lista, metricas] = await Promise.all([
        atencionesService.listar({ ...filtro, estado, trabajador }),
        trabajador || isTrabajador ? trabajadoresService.rendimiento(trabajador, filtro.desde, filtro.hasta) : Promise.resolve(null),
      ]);
      setItems(lista); setRendimiento(metricas);
    } catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }, [filtro, estado, trabajador, isTrabajador]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return <View style={{ gap: 12 }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <View style={{ flexGrow: 1, flexBasis: 150 }}><Input label="Desde" placeholder="AAAA-MM-DD" value={desde} onChangeText={setDesde} maxLength={10} /></View>
      <View style={{ flexGrow: 1, flexBasis: 150 }}><Input label="Hasta" placeholder="AAAA-MM-DD" value={hasta} onChangeText={setHasta} maxLength={10} /></View>
      <Button title="Aplicar fechas" onPress={() => setFiltro({ desde: desde.trim(), hasta: hasta.trim() })} disabled={loading} />
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {([undefined, 'programada', 'en_proceso', 'en_pausa', 'finalizada', 'entregada'] as const).map((s) => <Button key={s ?? 'todos'} title={s ? estadoLabel(s) : 'Todas'} size="sm" variant={estado === s ? 'primary' : 'outline'} onPress={() => setEstado(s)} disabled={loading} />)}
    </View>
    {!!error && <Card style={{ padding: 16, gap: 10 }}><Text accessibilityRole="alert" style={{ color: theme.danger }}>{error}</Text><Button title="Reintentar" onPress={load} /></Card>}
    {loading ? <ActivityIndicator accessibilityLabel="Cargando atenciones" color={theme.primary} /> : !error && <>
      {rendimiento && <Card style={{ padding: 18, gap: 6 }}>
        <Text style={{ color: theme.text, fontWeight: '700' }}>Rendimiento por fecha de finalización</Text>
        <Text style={{ color: theme.text }}>{rendimiento.atenciones_finalizadas} atenciones finalizadas · {rendimiento.servicios_en_equipo} servicios en equipo</Text>
        <Text style={{ color: theme.text }}>Duración promedio por atención: {rendimiento.duracion_promedio_min === null ? 'No disponible' : `${rendimiento.duracion_promedio_min.toFixed(1)} min`}</Text>
        <Text style={{ color: theme.textSecondary }}>Participación en atenciones del equipo; no representa horas individuales. El filtro de estado solo afecta la lista de asignaciones.</Text>
      </Card>}
      <Text style={{ color: theme.textSecondary }}>Asignaciones por fecha programada · {items.length} resultados</Text>
      {items.length === 0 && <Text style={{ color: theme.text }}>No hay atenciones para estos filtros.</Text>}
      {items.map((a) => <AtencionCard key={a.id_atencion} atencion={a} isAdmin={isAdmin} canOperate={isAdmin || isTrabajador} onChanged={load} />)}
    </>}
  </View>;
}
