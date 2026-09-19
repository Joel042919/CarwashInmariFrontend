import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { pedidosService } from '@/services/productos.service';
import { Pedido } from '@/types';
import { badgeStatus, confirmAction, errorMessage, formatSoles, notify } from '@/utils/dialog';

export default function PedidosScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAdmin) router.replace('/admin-pedidos');
  }, [isAdmin, router]);

  const load = useCallback(async () => {
    try {
      setPedidos(await pedidosService.misPedidos());
    } catch (err) {
      notify('Error', errorMessage(err, 'No se pudieron cargar tus pedidos'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) load();
  }, [isAuthenticated, isAdmin, load]);

  if (isAdmin) return null;

  const cancelar = async (p: Pedido) => {
    const ok = await confirmAction('Cancelar pedido', '¿Seguro que deseas cancelar este pedido?');
    if (!ok) return;
    try {
      await pedidosService.cancelar(p.id_pedido);
      await load();
    } catch (err) {
      notify('No se pudo cancelar', errorMessage(err), 'error');
    }
  };

  return (
    <Screen
      title="Mis Pedidos"
      subtitle="Seguimiento de tus compras de productos."
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      headerRight={<Button title="Ir a la tienda" variant="secondary" onPress={() => router.push('/productos')} />}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} />
      ) : pedidos.length === 0 ? (
        <Card style={{ padding: Spacing.five, alignItems: 'center' }}>
          <Text style={{ color: theme.textSecondary }}>Aún no has realizado pedidos.</Text>
        </Card>
      ) : (
        pedidos.map((p) => (
          <Card key={p.id_pedido} style={styles.card}>
            <View style={styles.top}>
              <View style={{ flex: 1, minWidth: 180 }}>
                <Text style={[styles.title, { color: theme.text }]}>Pedido {p.id_pedido.slice(0, 8)}</Text>
                <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                  {new Date(p.fecha_registro).toLocaleString()}
                </Text>
              </View>
              <Badge label={p.estado} status={badgeStatus(p.estado)} />
            </View>

            <View style={{ marginTop: Spacing.three }}>
              {p.detalle.map((d) => (
                <View key={d.id_detalle} style={styles.line}>
                  <Text style={{ color: theme.textSecondary, flex: 1 }}>
                    {d.cantidad} × {d.nombre_producto}
                  </Text>
                  <Text style={{ color: theme.text }}>{formatSoles(d.subtotal)}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.line, { marginTop: Spacing.two }]}>
              <Text style={{ color: theme.text, fontWeight: '900' }}>Total</Text>
              <Text style={{ color: theme.accent, fontWeight: '900' }}>{formatSoles(p.total)}</Text>
            </View>

            {p.estado === 'registrado' && (
              <Button
                title="Cancelar pedido"
                size="sm"
                variant="danger"
                style={{ marginTop: Spacing.three, alignSelf: 'flex-start' }}
                onPress={() => cancelar(p)}
              />
            )}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.four, marginBottom: Spacing.three },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two, flexWrap: 'wrap' },
  title: { fontSize: 16, fontWeight: '800' },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two, marginBottom: 4 },
});
