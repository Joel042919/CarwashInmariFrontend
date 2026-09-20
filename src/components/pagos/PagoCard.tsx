import React from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/theme';
import type { Pago } from '@/types/pagos';

const soles = (monto: string) => `S/ ${Number(monto).toFixed(2)}`;
const fecha = (value: string) => new Date(value).toLocaleString('es-PE', { timeZone: 'America/Lima' });

export function PagoCard({ pago, admin = false, onRevertir }: { pago: Pago; admin?: boolean; onRevertir?: (pago: Pago) => void }) {
  const theme = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  return <Card style={{ padding: 18, gap: 9 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
      <Text style={{ color: theme.text, fontSize: 17, fontWeight: '800' }}>{pago.comprobante_interno}</Text>
      <Badge label={pago.estado} status={pago.estado === 'pagado' ? 'completada' : 'cancelado'} />
    </View>
    <Text style={{ color: theme.text }}>{pago.cliente} · {pago.tipo === 'atencion' ? 'Servicio vehicular' : 'Pedido de productos'}</Text>
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
