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
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { serviciosService } from '@/services/servicios.service';
import { CategoriaServicio, Servicio } from '@/types';
import { errorMessage, formatSoles, notify } from '@/utils/dialog';

interface FormState {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: string;
  duracion: string;
  requiereDocumento: boolean;
  disponible: boolean;
  idCategoria: string;
}

const emptyForm = (idCategoria = ''): FormState => ({
  nombre: '',
  descripcion: '',
  precio: '',
  duracion: '',
  requiereDocumento: false,
  disponible: true,
  idCategoria,
});

export default function AdminServiciosScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [categorias, setCategorias] = useState<CategoriaServicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  useEffect(() => {
    if (isAuthenticated && !isAdmin) router.replace('/servicios');
  }, [isAuthenticated, isAdmin, router]);

  const load = useCallback(async () => {
    try {
      const [srv, cats] = await Promise.all([
        serviciosService.listar(),
        serviciosService.listarCategorias(),
      ]);
      setServicios(srv);
      setCategorias(cats);
    } catch (err) {
      notify('Error', errorMessage(err, 'No se pudo cargar el catálogo'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdmin) load();
  }, [isAuthenticated, isAdmin, load]);

  if (!isAdmin) return null;

  const abrirNuevo = () => setForm(emptyForm(categorias[0]?.id_categoria_servicio));

  const abrirEdicion = (s: Servicio) =>
    setForm({
      id: s.id_servicio,
      nombre: s.nombre,
      descripcion: s.descripcion ?? '',
      precio: String(s.precio),
      duracion: String(s.duracion_estimada_min),
      requiereDocumento: s.requiere_documento,
      disponible: s.disponible,
      idCategoria: s.id_categoria,
    });

  const guardar = async () => {
    if (!form) return;
    const precio = Number(form.precio.replace(',', '.'));
    const duracion = parseInt(form.duracion, 10);
    if (!form.nombre.trim()) return notify('Campo requerido', 'Ingresa el nombre del servicio');
    if (!form.idCategoria) return notify('Campo requerido', 'Selecciona o crea una categoría');
    if (!(precio > 0)) return notify('Precio inválido', 'El precio debe ser mayor a 0');
    if (!(duracion > 0)) return notify('Duración inválida', 'La duración debe ser mayor a 0 minutos');

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || undefined,
      precio,
      duracion_estimada_min: duracion,
      requiere_documento: form.requiereDocumento,
      disponible: form.disponible,
      id_categoria: form.idCategoria,
    };

    setSaving(true);
    try {
      if (form.id) await serviciosService.actualizar(form.id, payload);
      else await serviciosService.crear(payload);
      setForm(null);
      await load();
    } catch (err) {
      notify('No se pudo guardar', errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const alternarDisponibilidad = async (s: Servicio) => {
    try {
      await serviciosService.cambiarDisponibilidad(s.id_servicio, !s.disponible);
      await load();
    } catch (err) {
      notify('Error', errorMessage(err), 'error');
    }
  };

  const crearCategoria = async () => {
    const nombre = nuevaCategoria.trim();
    if (!nombre) return;
    try {
      const cat = await serviciosService.crearCategoria(nombre);
      setNuevaCategoria('');
      setCategorias((prev) => [...prev, cat]);
      setForm((f) => (f && !f.idCategoria ? { ...f, idCategoria: cat.id_categoria_servicio } : f));
    } catch (err) {
      notify('No se pudo crear la categoría', errorMessage(err), 'error');
    }
  };

  return (
    <Screen
      title="Gestión de Servicios"
      subtitle="RF-04: administra precios, duración estimada, disponibilidad y si el servicio exige documento previo."
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      headerRight={
        !form ? (
          <Button
            title="Nuevo servicio"
            icon={<Ionicons name="add" size={16} color="#ffffff" />}
            onPress={abrirNuevo}
          />
        ) : undefined
      }>
      {form && (
        <Card style={styles.formCard}>
          <Text style={[styles.formTitle, { color: theme.text }]}>
            {form.id ? 'Editar servicio' : 'Nuevo servicio'}
          </Text>

          <Input
            label="Nombre"
            value={form.nombre}
            onChangeText={(v) => setForm({ ...form, nombre: v })}
            maxLength={80}
          />
          <Input
            label="Descripción"
            value={form.descripcion}
            onChangeText={(v) => setForm({ ...form, descripcion: v })}
            multiline
            style={{ minHeight: 70, textAlignVertical: 'top' }}
          />
          <View style={styles.twoCols}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <Input
                label="Precio (S/)"
                value={form.precio}
                onChangeText={(v) => setForm({ ...form, precio: v })}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <Input
                label="Duración (min)"
                value={form.duracion}
                onChangeText={(v) => setForm({ ...form, duracion: v })}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Categoría</Text>
          <FilterChips
            value={form.idCategoria}
            onChange={(v) => setForm({ ...form, idCategoria: v })}
            options={categorias.map((c) => ({ value: c.id_categoria_servicio, label: c.categoria_servicio }))}
          />
          <View style={styles.inlineRow}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Nueva categoría..."
                value={nuevaCategoria}
                onChangeText={setNuevaCategoria}
                maxLength={30}
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

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>Requiere documento firmado</Text>
              <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                La reserva no se confirma hasta validar el PDF del cliente.
              </Text>
            </View>
            <Switch
              value={form.requiereDocumento}
              onValueChange={(v) => setForm({ ...form, requiereDocumento: v })}
              trackColor={{ true: theme.primary }}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={{ color: theme.text, fontWeight: '700', flex: 1 }}>Disponible</Text>
            <Switch
              value={form.disponible}
              onValueChange={(v) => setForm({ ...form, disponible: v })}
              trackColor={{ true: theme.primary }}
            />
          </View>

          <View style={styles.inlineRow}>
            <Button title="Guardar" loading={saving} onPress={guardar} />
            <Button title="Cancelar" variant="outline" onPress={() => setForm(null)} />
          </View>
        </Card>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: Spacing.five }} />
      ) : servicios.length === 0 ? (
        <Card style={{ padding: Spacing.five, alignItems: 'center' }}>
          <Text style={{ color: theme.textSecondary }}>Aún no hay servicios registrados.</Text>
        </Card>
      ) : (
        servicios.map((s) => (
          <Card key={s.id_servicio} style={styles.itemCard}>
            <View style={styles.itemTop}>
              <View style={{ flex: 1, minWidth: 200 }}>
                <Text style={[styles.itemName, { color: theme.text }]}>{s.nombre}</Text>
                <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                  {s.categoria} • {s.duracion_estimada_min} min
                </Text>
              </View>
              <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 16 }}>
                {formatSoles(s.precio)}
              </Text>
            </View>
            <View style={styles.badgesRow}>
              <Badge
                label={s.disponible ? 'Disponible' : 'No disponible'}
                status={s.disponible ? 'disponible' : 'cancelado'}
                size="sm"
              />
              {s.requiere_documento ? (
                <Badge label="Requiere documento" status="pendiente" size="sm" />
              ) : null}
            </View>
            <View style={styles.actionsRow}>
              <Button title="Editar" size="sm" variant="secondary" onPress={() => abrirEdicion(s)} />
              <Pressable onPress={() => alternarDisponibilidad(s)}>
                <Text style={{ color: s.disponible ? theme.danger : theme.primary, fontWeight: '700' }}>
                  {s.disponible ? 'Desactivar' : 'Activar'}
                </Text>
              </Pressable>
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
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  itemCard: { padding: Spacing.four, marginBottom: Spacing.three },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two, flexWrap: 'wrap' },
  itemName: { fontSize: 16, fontWeight: '800' },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    marginTop: Spacing.three,
  },
});
