import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FilterChips } from '@/components/ui/FilterChips';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { pedidosService, productosService } from '@/services/productos.service';
import { CategoriaProducto, Producto } from '@/types';
import { errorMessage, formatSoles, notify } from '@/utils/dialog';

export default function ProductosScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [categoria, setCategoria] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState<Record<string, number>>({});
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (isAdmin) router.replace('/admin-productos');
  }, [isAdmin, router]);

  const load = useCallback(async () => {
    try {
      const [prods, cats] = await Promise.all([
        productosService.listar(),
        productosService.listarCategorias(),
      ]);
      setProductos(prods);
      setCategorias(cats);
      // Descarta del carrito productos que ya no están disponibles o cuyo stock bajó.
      setCarrito((prev) => {
        const next: Record<string, number> = {};
        for (const [id, cant] of Object.entries(prev)) {
          const p = prods.find((x) => x.id_producto === id);
          if (p && p.stock > 0) next[id] = Math.min(cant, p.stock);
        }
        return next;
      });
    } catch (err) {
      notify('Error', errorMessage(err, 'No se pudo cargar la tienda'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) load();
  }, [isAuthenticated, isAdmin, load]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter(
      (p) =>
        (categoria === 'todas' || p.id_categoria === categoria) &&
        (!q || p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q))
    );
  }, [productos, categoria, busqueda]);

  const lineas = useMemo(
    () =>
      Object.entries(carrito)
        .map(([id, cantidad]) => ({ producto: productos.find((p) => p.id_producto === id), cantidad }))
        .filter((l): l is { producto: Producto; cantidad: number } => !!l.producto && l.cantidad > 0),
    [carrito, productos]
  );
  const total = lineas.reduce((acc, l) => acc + l.producto.precio_venta * l.cantidad, 0);

  if (isAdmin) return null;

  const cambiar = (p: Producto, delta: number) =>
    setCarrito((prev) => {
      const nueva = Math.max(0, Math.min(p.stock, (prev[p.id_producto] ?? 0) + delta));
      const next = { ...prev };
      if (nueva === 0) delete next[p.id_producto];
      else next[p.id_producto] = nueva;
      return next;
    });

  const realizarPedido = async () => {
    if (lineas.length === 0) return;
    setEnviando(true);
    try {
      await pedidosService.crear(
        lineas.map((l) => ({ id_producto: l.producto.id_producto, cantidad: l.cantidad })),
        observaciones
      );
      setCarrito({});
      setObservaciones('');
      notify('Pedido registrado', 'Puedes seguir su estado en "Mis pedidos".', 'success');
      await load();
    } catch (err) {
      notify('No se pudo registrar el pedido', errorMessage(err), 'error');
      await load();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Screen
      title="Tienda de Productos"
      subtitle="Productos de limpieza y cuidado vehicular. Recógelos en la sede al momento de tu atención."
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      headerRight={
        <Button
          title="Mis pedidos"
          variant="secondary"
          icon={<Ionicons name="receipt-outline" size={16} color={theme.accentDark} />}
          onPress={() => router.push('/pedidos')}
        />
      }>
      <Input placeholder="Buscar por nombre o código..." search value={busqueda} onChangeText={setBusqueda} />
      <FilterChips
        value={categoria}
        onChange={setCategoria}
        options={[
          { value: 'todas', label: 'Todas' },
          ...categorias.map((c) => ({ value: c.id_categoria, label: c.nombre })),
        ]}
      />

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} />
      ) : visibles.length === 0 ? (
        <Card style={{ padding: Spacing.five, alignItems: 'center' }}>
          <Text style={{ color: theme.textSecondary }}>No se encontraron productos.</Text>
        </Card>
      ) : (
        <View style={styles.grid}>
          {visibles.map((p) => {
            const enCarrito = carrito[p.id_producto] ?? 0;
            const agotado = p.stock <= 0;
            return (
              <Card key={p.id_producto} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.name, { color: theme.text }]}>{p.nombre}</Text>
                  <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 16 }}>
                    {formatSoles(p.precio_venta)}
                  </Text>
                </View>
                <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                  {p.categoria} • {p.codigo}
                </Text>
                {p.descripcion ? (
                  <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: Spacing.two }}>
                    {p.descripcion}
                  </Text>
                ) : null}

                <View style={styles.footer}>
                  {agotado ? (
                    <Badge label="Agotado" status="cancelado" size="sm" />
                  ) : (
                    <Badge label={`${p.stock} disponibles`} status="disponible" size="sm" />
                  )}

                  {!agotado && (
                    <View style={styles.stepper}>
                      <Pressable
                        onPress={() => cambiar(p, -1)}
                        disabled={enCarrito === 0}
                        style={[styles.stepBtn, { backgroundColor: theme.surface, opacity: enCarrito === 0 ? 0.4 : 1 }]}>
                        <Ionicons name="remove" size={18} color={theme.text} />
                      </Pressable>
                      <Text style={{ color: theme.text, fontWeight: '800', minWidth: 22, textAlign: 'center' }}>
                        {enCarrito}
                      </Text>
                      <Pressable
                        onPress={() => cambiar(p, 1)}
                        disabled={enCarrito >= p.stock}
                        style={[
                          styles.stepBtn,
                          { backgroundColor: theme.primary, opacity: enCarrito >= p.stock ? 0.4 : 1 },
                        ]}>
                        <Ionicons name="add" size={18} color="#ffffff" />
                      </Pressable>
                    </View>
                  )}
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {lineas.length > 0 && (
        <Card style={styles.cart}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800', marginBottom: Spacing.two }}>
            Tu pedido
          </Text>
          {lineas.map((l) => (
            <View key={l.producto.id_producto} style={styles.rowBetween}>
              <Text style={{ color: theme.textSecondary, flex: 1 }}>
                {l.cantidad} × {l.producto.nombre}
              </Text>
              <Text style={{ color: theme.text, fontWeight: '700' }}>
                {formatSoles(l.producto.precio_venta * l.cantidad)}
              </Text>
            </View>
          ))}
          <View style={[styles.rowBetween, { marginVertical: Spacing.three }]}>
            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 17 }}>Total</Text>
            <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 17 }}>{formatSoles(total)}</Text>
          </View>
          <Input
            placeholder="Observaciones (opcional)"
            value={observaciones}
            onChangeText={setObservaciones}
            style={{ marginBottom: 0 }}
          />
          <Button title="Realizar pedido" loading={enviando} onPress={realizarPedido} style={{ marginTop: Spacing.three }} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  card: { flexGrow: 1, flexBasis: 260, padding: Spacing.four, marginBottom: 0 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  name: { fontSize: 16, fontWeight: '800', flex: 1 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cart: { padding: Spacing.four, marginTop: Spacing.four },
});
