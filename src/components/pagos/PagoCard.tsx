import React from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/theme';
import type { DetallePago, Pago, TipoOperacionPago } from '@/types/pagos';

const soles = (monto: string) => `S/ ${Number(monto).toFixed(2)}`;
const fecha = (value: string) => new Date(value).toLocaleString('es-PE', { timeZone: 'America/Lima' });
const corto = (id?: string) => id ? id.slice(0, 8).toUpperCase() : '';

export function ResumenOperacion({ tipo, detalle, idOperacion }: { tipo: TipoOperacionPago; detalle: DetallePago; idOperacion?: string }) {
  const theme = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const esAtencion = tipo === 'atencion';
  const items = esAtencion ? detalle.servicios : detalle.productos;
  const relacion = esAtencion
    ? `Atención #${corto(idOperacion)}${detalle.id_reserva ? ` · Reserva #${corto(detalle.id_reserva)}` : ''}`
    : `Pedido #${corto(idOperacion)}`;
  return <View style={{ gap: 4 }}>
    <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>{esAtencion ? 'Servicio vehicular' : 'Pedido de productos'} · {relacion}</Text>
    {esAtencion && detalle.placa ? <Text style={{ color: theme.textSecondary }}>Vehículo: {detalle.placa}</Text> : null}
    {items?.map((item, index) => <Text key={`${item.nombre}-${index}`} style={{ color: theme.textSecondary }}>• {item.cantidad} × {item.nombre} — {soles(String(item.precio_unitario))}</Text>)}
  </View>;
}

export function PagoCard({ pago, admin = false, onRevertir }: { pago: Pago; admin?: boolean; onRevertir?: (pago: Pago) => void }) {
  const theme = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  return <Card style={{ padding: 18, gap: 9 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
      <Text style={{ color: theme.text, fontSize: 17, fontWeight: '800' }}>{pago.comprobante_interno}</Text>
      <Badge label={pago.estado} status={pago.estado === 'pagado' ? 'completada' : 'cancelado'} />
    </View>
    <Text style={{ color: theme.text }}>{pago.cliente} · {pago.tipo === 'atencion' ? 'Servicio vehicular' : 'Pedido de productos'}</Text>
    <ResumenOperacion tipo={pago.tipo} detalle={pago.detalle} idOperacion={pago.tipo === 'atencion' ? pago.id_atencion : pago.id_pedido} />
    <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>{soles(pago.monto)} {pago.moneda}</Text>
    <Text style={{ color: theme.textSecondary }}>{pago.metodo.replaceAll('_', ' ')} · {fecha(pago.fecha_pago)}</Text>
    {pago.referencia_externa && <Text style={{ color: theme.textSecondary }}>Referencia: {pago.referencia_externa}</Text>}
    {pago.motivo_reversion && <Text style={{ color: theme.danger }}>Reversión: {pago.motivo_reversion}</Text>}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <Button title="Ver comprobante" variant="outline" onPress={() => router.push(`/comprobante/${pago.id_pago}` as never)} />
      {admin && pago.estado === 'pagado' && onRevertir && <Button title="Registrar devolución" variant="danger" onPress={() => onRevertir(pago)} />}
    </View>
  </Card>;
}
