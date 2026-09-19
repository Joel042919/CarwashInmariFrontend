import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  useColorScheme,
} from 'react-native';
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
import { ApiError } from '@/services/api';
import { productosService } from '@/services/productos.service';
import { CategoriaProducto, Producto } from '@/types';
import { errorMessage, formatSoles, notify } from '@/utils/dialog';

interface FormState {
  id?: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: string;
  stock: string;
  stockMinimo: string;
  activo: boolean;
  idCategoria: string;
}

const emptyForm = (idCategoria = ''): FormState => ({
  codigo: '',
  nombre: '',
  descripcion: '',
  precio: '',
  stock: '0',
  stockMinimo: '5',
  activo: true,
  idCategoria,
});

export default function AdminProductosScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  useEffect(() => {
    if (isAuthenticated && !isAdmin) router.replace('/productos');
  }, [isAuthenticated, isAdmin, router]);

  const load = useCallback(async () => {
    try {
      const [prods, cats] = await Promise.all([
        productosService.listar({ q: busqueda, stockBajo: filtro === 'bajo' }),
        productosService.listarCategorias(),
      ]);
      setProductos(prods);
      setCategorias(cats);
    } catch (err) {
      notify('Error', errorMessage(err, 'No se pudo cargar el inventario'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [busqueda, filtro]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    // Pequeño debounce para no consultar en cada tecla al buscar.
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [isAuthenticated, isAdmin, load]);

  if (!isAdmin) return null;

  const abrirEdicion = (p: Producto) =>
    setForm({
      id: p.id_producto,
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: String(p.precio_venta),
      stock: String(p.stock),
      stockMinimo: String(p.stock_minimo),
      activo: p.activo,
      idCategoria: p.id_categoria,
    });

  const guardar = async () => {
    if (!form) return;
    const precio = Number(form.precio.replace(',', '.'));
    const stock = parseInt(form.stock, 10);
    const stockMinimo = parseInt(form.stockMinimo, 10);
    if (!form.codigo.trim()) return notify('Campo requerido', 'Ingresa el código del producto');
    if (!form.nombre.trim()) return notify('Campo requerido', 'Ingresa el nombre del producto');
    if (!form.idCategoria) return notify('Campo requerido', 'Selecciona o crea una categoría');
    if (!(precio > 0)) return notify('Precio inválido', 'El precio debe ser mayor a 0');
    if (!(stock >= 0) || !(stockMinimo >= 0)) return notify('Stock inválido', 'Los valores no pueden ser negativos');

    setSaving(true);
    try {
      const payload = {
        id_categoria: form.idCategoria,
        codigo: form.codigo.trim(),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        precio_venta: precio,
        stock, // al editar el backend lo ignora: el stock solo cambia con "Ajustar stock" o pedidos
        stock_minimo: stockMinimo,
        activo: form.activo,
      };
      if (form.id) await productosService.actualizar(form.id, payload);
      else await productosService.crear(payload);
      setForm(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        notify('Código duplicado', err.message, 'warning');
      } else {
        notify('No se pudo guardar', errorMessage(err), 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const ajustar = async (p: Producto, delta: number) => {
    try {
      await productosService.ajustarStock(p.id_producto, delta);
      await load();
    } catch (err) {
      notify('No se pudo ajustar el stock', errorMessage(err), 'error');
    }
  };

  const crearCategoria = async () => {
    const nombre = nuevaCategoria.trim();
    if (!nombre) return;
    try {
      const cat = await productosService.crearCategoria(nombre);
      setNuevaCategoria('');
      setCategorias((prev) => [...prev, cat]);
      setForm((f) => (f && !f.idCategoria ? { ...f, idCategoria: cat.id_categoria } : f));
    } catch (err) {
      notify('No se pudo crear la categoría', errorMessage(err), 'error');
    }
  };

  return (
    <Screen
      title="Inventario de Productos"
      subtitle="RF-12: administra productos, categorías, precios y existencias."
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      headerRight={
        !form ? (
          <Button
            title="Nuevo producto"
            icon={<Ionicons name="add" size={16} color="#ffffff" />}
            onPress={() => setForm(emptyForm(categorias[0]?.id_categoria))}
          />
        ) : undefined
      }>
      {form && (
        <Card style={styles.formCard}>
          <Text style={[styles.formTitle, { color: theme.text }]}>
            {form.id ? 'Editar producto' : 'Nuevo producto'}
          </Text>
          <View style={styles.twoCols}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <Input
                label="Código"
                value={form.codigo}
                onChangeText={(v) => setForm({ ...form, codigo: v })}
                maxLength={30}
                autoCapitalize="characters"
              />
            </View>
            <View style={{ flex: 2, minWidth: 200 }}>
              <Input
                label="Nombre"
                value={form.nombre}
                onChangeText={(v) => setForm({ ...form, nombre: v })}
                maxLength={100}
              />
            </View>
          </View>
          <Input
            label="Descripción"
            value={form.descripcion}
            onChangeText={(v) => setForm({ ...form, descripcion: v })}
            multiline
            style={{ minHeight: 60, textAlignVertical: 'top' }}
          />
          <View style={styles.twoCols}>
            <View style={{ flex: 1, minWidth: 110 }}>
              <Input
                label="Precio (S/)"
                value={form.precio}
                onChangeText={(v) => setForm({ ...form, precio: v })}
                keyboardType="decimal-pad"
              />
            </View>
            {!form.id && (
              <View style={{ flex: 1, minWidth: 110 }}>
                <Input
                  label="Stock inicial"
                  value={form.stock}
                  onChangeText={(v) => setForm({ ...form, stock: v })}
                  keyboardType="number-pad"
                />
              </View>
            )}
            <View style={{ flex: 1, minWidth: 110 }}>
              <Input
                label="Stock mínimo"
                value={form.stockMinimo}
                onChangeText={(v) => setForm({ ...form, stockMinimo: v })}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Categoría</Text>
          <FilterChips
            value={form.idCategoria}
            onChange={(v) => setForm({ ...form, idCategoria: v })}
            options={categorias.map((c) => ({ value: c.id_categoria, label: c.nombre }))}
          />
          <View style={styles.inlineRow}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Nueva categoría..."
                value={nuevaCategoria}
                onChangeText={setNuevaCategoria}
                maxLength={60}
                style={{ marginBottom: 0 }}
              />
            </View>
            <Button
              title="Crear"
              size="sm"
              variant="secondary"
              icon={<Ionicons name="add" size={16} color={theme.accentDark} />}
              onPress={crearCategoria}
              style={{ marginBottom: Spacing.three }}
            />
          </View>

          <View style={styles.inlineRow}>
            <Text style={{ color: theme.text, fontWeight: '700', flex: 1 }}>Activo (visible en la tienda)</Text>
            <Switch
              value={form.activo}
              onValueChange={(v) => setForm({ ...form, activo: v })}
              trackColor={{ true: theme.primary }}
            />
          </View>

          <View style={styles.inlineRow}>
            <Button title="Guardar" loading={saving} onPress={guardar} />
            <Button title="Cancelar" variant="outline" onPress={() => setForm(null)} />
          </View>
        </Card>
      )}

      <Input placeholder="Buscar por nombre o código..." search value={busqueda} onChangeText={setBusqueda} />
      <FilterChips
        value={filtro}
        onChange={setFiltro}
        options={[
          { value: 'todos', label: 'Todos' },
          { value: 'bajo', label: 'Stock bajo' },
        ]}
      />

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} />
      ) : productos.length === 0 ? (
        <Card style={{ padding: Spacing.five, alignItems: 'center' }}>
          <Text style={{ color: theme.textSecondary }}>No hay productos que coincidan.</Text>
        </Card>
      ) : (
        productos.map((p) => (
          <Card key={p.id_producto} style={styles.itemCard}>
            <View style={styles.itemTop}>
              <View style={{ flex: 1, minWidth: 200 }}>
                <Text style={[styles.itemName, { color: theme.text }]}>{p.nombre}</Text>
                <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                  {p.codigo} • {p.categoria}
                </Text>
              </View>
              <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 16 }}>
                {formatSoles(p.precio_venta)}
              </Text>
            </View>

            <View style={styles.badgesRow}>
              <Badge
                label={`Stock: ${p.stock}`}
                status={p.stock <= 0 ? 'cancelado' : p.stock_bajo ? 'pendiente' : 'disponible'}
                size="sm"
              />
              <Badge label={p.activo ? 'Activo' : 'Inactivo'} status={p.activo ? 'disponible' : 'cancelado'} size="sm" />
            </View>

            <View style={styles.actionsRow}>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => ajustar(p, -1)}
                  disabled={p.stock <= 0}
                  style={[styles.stepBtn, { backgroundColor: theme.surface, opacity: p.stock <= 0 ? 0.4 : 1 }]}>
                  <Ionicons name="remove" size={18} color={theme.text} />
                </Pressable>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Ajustar stock</Text>
                <Pressable onPress={() => ajustar(p, 1)} style={[styles.stepBtn, { backgroundColor: theme.primary }]}>
                  <Ionicons name="add" size={18} color="#ffffff" />
                </Pressable>
              </View>
              <Button title="Editar" size="sm" variant="secondary" onPress={() => abrirEdicion(p)} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  formCard: { padding: Spacing.four, marginBottom: Spacing.four },
  formTitle: { fontSize: 18, fontWeight: '800', marginBottom: Spacing.three },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  twoCols: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.three },
  itemCard: { padding: Spacing.four, marginBottom: Spacing.three },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two, flexWrap: 'wrap' },
  itemName: { fontSize: 16, fontWeight: '800' },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.three,
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
});
