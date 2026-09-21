import React, { useState } from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import { atencionesService } from '@/services/atenciones.service';
import { confirmAction, errorMessage } from '@/utils/dialog';
import type { Atencion, EventoAtencion } from '@/types/atenciones';
import { EvidenciasPanel } from './EvidenciasPanel';

export const estadoLabel = (estado: string) => estado.replaceAll('_', ' ');
const fechaHora = (value: string) => new Date(value).toLocaleString('es-PE', { timeZone: 'America/Lima' });

export function AtencionCard({ atencion: a, canOperate, isAdmin, onChanged }: {
  atencion: Atencion; canOperate: boolean; isAdmin: boolean; onChanged: () => Promise<void>;
}) {
  const theme = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [historial, setHistorial] = useState<EventoAtencion[] | null>(null);
  const cambiar = async (estado: 'en_proceso' | 'en_pausa' | 'finalizada' | 'entregada') => {
    if (!await confirmAction(estado === 'en_proceso' ? 'Iniciar atención' : 'Finalizar atención', `${a.placa}: se registrará la hora real y el cambio quedará en el historial.`)) return;
    setBusy(true); setError('');
    try { await atencionesService.cambiarEstado(a.id_atencion, estado); setHistorial(null); await onChanged(); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };
  const verHistorial = async () => {
    if (historial) { setHistorial(null); return; }
    setBusy(true); setError('');
    try { setHistorial(await atencionesService.historial(a.id_atencion)); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };
  return <Card style={{ padding: 18, gap: 10 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>{a.placa}</Text>
      <Badge label={a.estado_reserva === 'cancelada' ? 'Reserva cancelada' : estadoLabel(a.estado)} status={a.estado_reserva === 'cancelada' ? 'cancelado' : a.estado} />
    </View>
    <Text style={{ color: theme.text }}>{a.fecha} · {a.hora_inicio}–{a.hora_fin} · {a.cliente}</Text>
    <Text style={{ color: theme.textSecondary }}>{a.servicios.map((s) => `${s.cantidad} × ${s.nombre}`).join(' · ')}</Text>
    {a.fecha_inicio_real && <Text style={{ color: theme.textSecondary }}>Inicio real: {fechaHora(a.fecha_inicio_real)}</Text>}
    {a.fecha_fin_real && <Text style={{ color: theme.textSecondary }}>Fin real: {fechaHora(a.fecha_fin_real)}</Text>}
    {a.estado_reserva === 'reprogramada' && <Text style={{ color: theme.textSecondary }}>Requiere confirmar nuevamente horario y personal.</Text>}
    <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
      {canOperate && a.estado_reserva === 'confirmada' && a.estado === 'programada' && <Button title="Iniciar atención" disabled={busy} onPress={() => cambiar('en_proceso')} />}
      {canOperate && a.estado_reserva === 'confirmada' && a.estado === 'en_proceso' && <Button title="Finalizar atención" disabled={busy} onPress={() => cambiar('finalizada')} />}
      {canOperate && a.estado_reserva === 'confirmada' && a.estado === 'en_proceso' && <Button title="Pausar" variant="outline" disabled={busy} onPress={() => cambiar('en_pausa')} />}
      {canOperate && a.estado_reserva === 'confirmada' && a.estado === 'en_pausa' && <Button title="Reanudar" disabled={busy} onPress={() => cambiar('en_proceso')} />}
      {canOperate && a.estado === 'finalizada' && <Button title="Registrar entrega" disabled={busy} onPress={() => cambiar('entregada')} />}
      {isAdmin && a.estado === 'programada' && a.estado_reserva !== 'cancelada' && <Button title="Reasignar personal" variant="outline" disabled={busy} onPress={() => router.push({ pathname: '/admin-reservas', params: { reserva: a.id_reserva } })} />}
      <Button title={historial ? 'Ocultar historial' : 'Ver historial'} variant="outline" disabled={busy} onPress={verHistorial} />
    </View>
    <EvidenciasPanel idAtencion={a.id_atencion} idVehiculo={a.id_vehiculo} canRegister={canOperate && (a.estado === 'programada' || a.estado === 'en_proceso')} />
    {!!error && <Text accessibilityRole="alert" style={{ color: theme.danger }}>{error}</Text>}
    {historial?.length === 0 && <Text style={{ color: theme.textSecondary }}>Sin eventos registrados.</Text>}
    {historial?.map((e) => <Text key={e.id_historial} style={{ color: theme.textSecondary }}>{fechaHora(e.fecha_cambio)} · {estadoLabel(e.estado)} · {e.responsable}{e.comentario ? ` — ${e.comentario}` : ''}</Text>)}
  </Card>;
}
