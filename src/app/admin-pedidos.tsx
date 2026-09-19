import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FilterChips } from '@/components/ui/FilterChips';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { pedidosService } from '@/services/productos.service';
import { EstadoPedido, Pedido } from '@/types';
import { badgeStatus, confirmAction, errorMessage, formatSoles, notify } from '@/utils/dialog';

// Siguiente estado permitido en el flujo normal (coincide con las transiciones del backend).
const SIGUIENTE: Partial<Record<EstadoPedido, { estado: EstadoPedido; label: string }>> = {
  registrado: { estado: 'pagado', label: 'Marcar pagado' },
  pagado: { estado: 'preparando', label: 'Preparar' },
  preparando: { estado: 'entregado', label: 'Marcar entregado' },
};

export default function AdminPedidosScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [estado, setEstado] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [procesando, setProcesando] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) router.replace('/pedidos');
  }, [isAuthenticated, isAdmin, router]);

  const load = useCallback(async () => {
    try {
      setPedidos(await pedidosService.listarAdmin(estado === 'todos' ? undefined : estado));
    } catch (err) {
      notify('Error', errorMessage(err, 'No se pudieron cargar los pedidos'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [estado]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      setLoading(true);
      load();
    }
  }, [isAuthenticated, isAdmin, load]);

  if (!isAdmin) return null;

  const cambiar = async (p: Pedido, nuevo: EstadoPedido) => {
    if (nuevo === 'cancelado') {
      const ok = await confirmAction('Cancelar pedido', 'Se devolverá el stock de los productos. ¿Continuar?');
      if (!ok) return;
    }
    setProcesando(p.id_pedido);
    try {
      await pedidosService.cambiarEstado(p.id_pedido, nuevo);
      await load();
    } catch (err) {
      notify('No se pudo actualizar', errorMessage(err), 'error');
    } finally {
      setProcesando(null);
    }
  };

  return (
    <Screen
      title="Pedidos de Productos"
      subtitle="RF-12: seguimiento de pedidos. Al cancelar un pedido el stock se devuelve automáticamente."
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}>
      <FilterChips
        value={estado}
        onChange={setEstado}
        options={[
          { value: 'todos', label: 'Todos' },
          { value: 'registrado', label: 'Registrados' },
          { value: 'pagado', label: 'Pagados' },
          { value: 'preparando', label: 'Preparando' },
          { value: 'entregado', label: 'Entregados' },
          { value: 'cancelado', label: 'Cancelados' },
        ]}
      />

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} />
      ) : pedidos.length === 0 ? (
        <Card style={{ padding: Spacing.five, alignItems: 'center' }}>
          <Text style={{ color: theme.textSecondary }}>No hay pedidos en este estado.</Text>
        </Card>
      ) : (
        pedidos.map((p) => {
          const sig = SIGUIENTE[p.estado];
          const cancelable = p.estado !== 'entregado' && p.estado !== 'cancelado';
          return (
            <Card key={p.id_pedido} style={styles.card}>
              <View style={styles.top}>
                <View style={{ flex: 1, minWidth: 200 }}>
                  <Text style={[styles.title, { color: theme.text }]}>
                    Pedido {p.id_pedido.slice(0, 8)} • {formatSoles(p.total)}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                    {p.nombre_cliente} • {p.correo_cliente}
                  </Text>
                  <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                    {new Date(p.fecha_registro).toLocaleString()}
                  </Text>
                </View>
                <Badge label={p.estado} status={badgeStatus(p.estado)} />
              </View>

              <View style={{ marginTop: Spacing.three }}>
                {p.detalle.map((d) => (
                  <Text key={d.id_detalle} style={{ color: theme.textSecondary, marginBottom: 2 }}>
                    {d.cantidad} × {d.nombre_producto} — {formatSoles(d.subtotal)}
                  </Text>
                ))}
              </View>
              {p.observaciones ? (
                <Text style={{ color: theme.textTertiary, marginTop: Spacing.two, fontSize: 12 }}>
                  Obs.: {p.observaciones}
                </Text>
              ) : null}

              {(sig || cancelable) && (
                <View style={styles.actions}>
                  {sig && (
                    <Button
                      title={sig.label}
                      size="sm"
                      disabled={procesando === p.id_pedido}
                      onPress={() => cambiar(p, sig.estado)}
                    />
                  )}
                  {cancelable && (
                    <Button
                      title="Cancelar"
                      size="sm"
                      variant="danger"
                      disabled={procesando === p.id_pedido}
                      onPress={() => cambiar(p, 'cancelado')}
                    />
                  )}
                </View>
              )}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.four, marginBottom: Spacing.three },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two, flexWrap: 'wrap' },
  title: { fontSize: 16, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three, flexWrap: 'wrap' },
});
