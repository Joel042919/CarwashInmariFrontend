import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FilterChips } from '@/components/ui/FilterChips';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { vehiculosService } from '@/services/reservas.service';
import { Vehiculo } from '@/types';
import { confirmAction, errorMessage, notify } from '@/utils/dialog';

const TIPOS = ['Auto', 'Camioneta', 'SUV', 'Moto', 'Furgoneta'];

interface FormState {
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  anio: string;
  tipo: string;
}

const emptyForm: FormState = { placa: '', marca: '', modelo: '', color: '', anio: '', tipo: '' };

// Registro mínimo de vehículos, necesario para poder reservar.
// TODO(Mego): RF-03 completo (editar, dar de baja, foto del vehículo). Esta pantalla
// puede ampliarse o reemplazarse; las reservas solo necesitan que el cliente tenga vehículos.
export default function VehiculosScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) router.replace('/admin-reservas');
  }, [isAdmin, router]);

  const load = useCallback(async () => {
    try {
      setVehiculos(await vehiculosService.misVehiculos());
    } catch (err) {
      notify('Error', errorMessage(err, 'No se pudieron cargar tus vehículos'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) load();
  }, [isAuthenticated, isAdmin, load]);

  if (isAdmin) return null;

  const guardar = async () => {
    if (!form) return;
    const anio = form.anio.trim() ? parseInt(form.anio, 10) : undefined;
    if (!form.placa.trim()) return notify('Campo requerido', 'Ingresa la placa del vehículo');
    if (!form.marca.trim() || !form.modelo.trim()) return notify('Campo requerido', 'Ingresa la marca y el modelo');
    if (form.anio.trim() && (!anio || anio < 1950 || anio > new Date().getFullYear() + 1)) {
      return notify('Año inválido', 'Ingresa un año válido (por ejemplo 2020)');
    }

    setSaving(true);
    try {
      const payload = {
        placa: form.placa.trim(),
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        color: form.color.trim() || undefined,
        anio,
        tipo_vehiculo: form.tipo || undefined,
      };
      if (editingId) await vehiculosService.actualizar(editingId, payload);
      else await vehiculosService.registrar(payload);
      setForm(null);
      setEditingId(null);
      await load();
    } catch (err) {
      notify('No se pudo registrar', errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      title="Mis Vehículos"
      subtitle="Registra los vehículos con los que harás tus reservas."
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      headerRight={
        !form ? (
          <Button
            title="Nuevo vehículo"
            icon={<Ionicons name="add" size={16} color="#ffffff" />}
            onPress={() => { setEditingId(null); setForm(emptyForm); }}
          />
        ) : undefined
      }>
      {form && (
        <Card style={styles.formCard}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Nuevo vehículo</Text>
          <View style={styles.twoCols}>
            <View style={styles.col}>
              <Input
                label="Placa"
                value={form.placa}
                onChangeText={(v) => setForm({ ...form, placa: v })}
                autoCapitalize="characters"
                maxLength={15}
              />
            </View>
            <View style={styles.col}>
              <Input
                label="Año (opcional)"
                value={form.anio}
                onChangeText={(v) => setForm({ ...form, anio: v })}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
          </View>
          <View style={styles.twoCols}>
            <View style={styles.col}>
              <Input label="Marca" value={form.marca} onChangeText={(v) => setForm({ ...form, marca: v })} maxLength={50} />
            </View>
            <View style={styles.col}>
              <Input label="Modelo" value={form.modelo} onChangeText={(v) => setForm({ ...form, modelo: v })} maxLength={50} />
            </View>
          </View>
          <Input label="Color (opcional)" value={form.color} onChangeText={(v) => setForm({ ...form, color: v })} maxLength={30} />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Tipo de vehículo (opcional)</Text>
          <FilterChips
            value={form.tipo}
            onChange={(v) => setForm({ ...form, tipo: form.tipo === v ? '' : v })}
            options={TIPOS.map((t) => ({ value: t, label: t }))}
          />

          <View style={styles.actions}>
            <Button title="Guardar" loading={saving} onPress={guardar} />
            <Button title="Cancelar" variant="outline" onPress={() => { setForm(null); setEditingId(null); }} />
          </View>
        </Card>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} />
      ) : vehiculos.length === 0 ? (
        <Card style={{ padding: Spacing.five, alignItems: 'center' }}>
          <Ionicons name="car-sport-outline" size={44} color={theme.textSecondary} />
          <Text style={{ color: theme.textSecondary, marginTop: Spacing.two, textAlign: 'center' }}>
            Aún no tienes vehículos registrados. Agrega uno para poder reservar.
          </Text>
        </Card>
      ) : (
        <View style={styles.grid}>
          {vehiculos.map((v) => (
            <Card key={v.id_vehiculo} style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.icon, { backgroundColor: theme.surface }]}>
                  <Ionicons name="car-sport" size={22} color={theme.accentDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.plate, { color: theme.text }]}>{v.placa}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                    {v.marca} {v.modelo}
                    {v.anio ? ` · ${v.anio}` : ''}
                  </Text>
                  <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                    {[v.color, v.tipo_vehiculo].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three }}>
                <Button title="Editar" size="sm" variant="outline" onPress={() => { setEditingId(v.id_vehiculo); setForm({ placa: v.placa, marca: v.marca, modelo: v.modelo, color: v.color || '', anio: v.anio ? String(v.anio) : '', tipo: v.tipo_vehiculo || '' }); }} />
                <Button title="Eliminar" size="sm" variant="danger" onPress={async () => { if (!await confirmAction('Eliminar vehículo', `¿Eliminar ${v.placa}? No podrá eliminarse si tiene reservas asociadas.`)) return; try { await vehiculosService.eliminar(v.id_vehiculo); await load(); } catch (err) { notify('No se pudo eliminar', errorMessage(err), 'error'); } }} />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  formCard: { padding: Spacing.four, marginBottom: Spacing.four },
  formTitle: { fontSize: 18, fontWeight: '800', marginBottom: Spacing.three },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  twoCols: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  col: { flexGrow: 1, flexBasis: 150 },
  actions: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  card: { flexGrow: 1, flexBasis: 260, padding: Spacing.four, marginBottom: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  icon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  plate: { fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
});
