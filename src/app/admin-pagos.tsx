import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Switch, Text, View, useColorScheme } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FilterChips } from '@/components/ui/FilterChips';
import { PagoCard } from '@/components/pagos/PagoCard';
import { Colors } from '@/constants/theme';
import { nuevaClaveIdempotencia, pagosService } from '@/services/pagos.service';
import { confirmAction, errorMessage, notify } from '@/utils/dialog';
import type { EstadoPago, MetodoPago, OperacionPendiente, Pago, TipoOperacionPago } from '@/types/pagos';

const metodos: { value: MetodoPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' }, { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' }, { value: 'billetera_digital', label: 'Yape / Plin' },
];

export default function AdminPagosScreen() {
  const theme = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const [vista, setVista] = useState<'pendientes' | 'historial'>('pendientes');
  const [tipo, setTipo] = useState<TipoOperacionPago | undefined>();
  const [estado, setEstado] = useState<EstadoPago | undefined>();
  const [pendientes, setPendientes] = useState<OperacionPendiente[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [seleccion, setSeleccion] = useState<OperacionPendiente | null>(null);
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
  const [referencia, setReferencia] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [reversion, setReversion] = useState<Pago | null>(null);
  const [motivo, setMotivo] = useState('');
  const [devolucion, setDevolucion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (vista === 'pendientes') setPendientes(await pagosService.pendientes(tipo));
      else setPagos(await pagosService.listarAdmin(estado));
    } catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }, [vista, tipo, estado]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const cobrar = async () => {
    if (!seleccion || saving) return;
    const ok = await confirmAction('Registrar cobro', `Se registrará S/ ${Number(seleccion.monto).toFixed(2)} por ${metodo.replaceAll('_', ' ')}. Esta operación generará un comprobante interno.`);
    if (!ok) return;
    setSaving(true);
    try {
      const pago = await pagosService.registrar({ tipo: seleccion.tipo, id_operacion: seleccion.id_operacion, metodo,
        referencia_externa: referencia.trim() || undefined, idempotency_key: idempotencyKey });
      setSeleccion(null); setReferencia(''); await load();
      router.push(`/comprobante/${pago.id_pago}` as never);
    } catch (err) { notify('No se pudo registrar el pago', errorMessage(err), 'error'); }
    finally { setSaving(false); }
  };
  const revertir = async () => {
    if (!reversion || !devolucion || saving) return;
    setSaving(true);
    try { await pagosService.revertir(reversion.id_pago, motivo.trim()); setReversion(null); setMotivo(''); setDevolucion(false); await load(); }
    catch (err) { notify('No se pudo registrar la devolución', errorMessage(err), 'error'); }
    finally { setSaving(false); }
  };

  return <Screen title="Pagos" subtitle="Registra cobros, consulta comprobantes y conserva el historial de devoluciones.">
    <FilterChips value={vista} onChange={(value) => setVista(value as 'pendientes' | 'historial')} options={[{ value: 'pendientes', label: 'Por cobrar' }, { value: 'historial', label: 'Historial' }]} />
    {vista === 'pendientes' ? <FilterChips value={tipo ?? 'todos'} onChange={(value) => setTipo(value === 'todos' ? undefined : value as TipoOperacionPago)} options={[{ value: 'todos', label: 'Todo' }, { value: 'atencion', label: 'Atenciones' }, { value: 'pedido', label: 'Pedidos' }]} />
      : <FilterChips value={estado ?? 'todos'} onChange={(value) => setEstado(value === 'todos' ? undefined : value as EstadoPago)} options={[{ value: 'todos', label: 'Todo' }, { value: 'pagado', label: 'Pagados' }, { value: 'reembolsado', label: 'Reembolsados' }]} />}
    {!!error && <Card style={{ padding: 16, gap: 8 }}><Text accessibilityRole="alert" style={{ color: theme.danger }}>{error}</Text><Button title="Reintentar" onPress={load} /></Card>}
    {seleccion && <Card style={{ padding: 18, gap: 10 }}>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>Cobrar a {seleccion.cliente}</Text>
      <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>S/ {Number(seleccion.monto).toFixed(2)}</Text>
      <FilterChips value={metodo} onChange={(value) => setMetodo(value as MetodoPago)} options={metodos} />
      {metodo !== 'efectivo' && <Input label="Referencia de la operación (opcional)" value={referencia} onChangeText={setReferencia} maxLength={100} />}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}><Button title="Confirmar cobro" loading={saving} onPress={cobrar} /><Button title="Cancelar" variant="outline" disabled={saving} onPress={() => setSeleccion(null)} /></View>
    </Card>}
    {reversion && <Card style={{ padding: 18, gap: 10 }}>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>Registrar devolución de {reversion.comprobante_interno}</Text>
      <Input label="Motivo" value={motivo} onChangeText={setMotivo} multiline maxLength={300} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Switch value={devolucion} onValueChange={setDevolucion} /><Text style={{ color: theme.text, flex: 1 }}>Confirmo que se devolvió S/ {Number(reversion.monto).toFixed(2)} al cliente.</Text></View>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}><Button title="Registrar devolución" variant="danger" loading={saving} disabled={!devolucion || motivo.trim().length < 8} onPress={revertir} /><Button title="Cancelar" variant="outline" disabled={saving} onPress={() => setReversion(null)} /></View>
    </Card>}
    {loading ? <ActivityIndicator color={theme.primary} /> : vista === 'pendientes' ? <>
      {pendientes.length === 0 && <Text style={{ color: theme.textSecondary }}>No hay operaciones pendientes de cobro.</Text>}
      {pendientes.map((item) => <Card key={`${item.tipo}-${item.id_operacion}`} style={{ padding: 18, gap: 8 }}>
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 17 }}>{item.cliente}</Text>
        <Text style={{ color: theme.textSecondary }}>{item.descripcion} · {item.tipo}</Text>
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 20 }}>S/ {Number(item.monto).toFixed(2)}</Text>
        <Button title="Registrar cobro" disabled={saving} onPress={() => {
          setSeleccion(item);
          setMetodo('efectivo');
          setReferencia('');
          setIdempotencyKey(nuevaClaveIdempotencia(item.tipo, item.id_operacion));
        }} />
      </Card>)}
    </> : <>{pagos.length === 0 && <Text style={{ color: theme.textSecondary }}>No hay pagos para este filtro.</Text>}{pagos.map((pago) => <PagoCard key={pago.id_pago} pago={pago} admin onRevertir={(item) => { setReversion(item); setMotivo(''); setDevolucion(false); }} />)}</>}
  </Screen>;
}
