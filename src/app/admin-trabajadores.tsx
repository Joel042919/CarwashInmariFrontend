import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { trabajadoresService } from '@/services/reservas.service';
import { Trabajador } from '@/types';
import { errorMessage, notify } from '@/utils/dialog';

interface FormState {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  dni: string;
  contrasena: string;
}

const emptyForm: FormState = { nombre: '', apellido: '', correo: '', telefono: '', dni: '', contrasena: '' };

// Alta mínima de trabajadores, necesaria para asignarlos al programar reservas (RF-09).
// TODO(Ingrid): RF-13 completo (editar, dar de baja, rendimiento) y definir la vista propia
// del trabajador: hoy, al iniciar sesión, ve el menú de cliente y sus pantallas dan error 403.
export default function AdminTrabajadoresScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();

  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) router.replace('/');
  }, [isAuthenticated, isAdmin, router]);

  const load = useCallback(async () => {
    try {
      setTrabajadores(await trabajadoresService.listar());
    } catch (err) {
      notify('Error', errorMessage(err, 'No se pudieron cargar los trabajadores'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdmin) load();
  }, [isAuthenticated, isAdmin, load]);

  if (!isAdmin) return null;

  const guardar = async () => {
    if (!form) return;
    if (!form.nombre.trim() || !form.apellido.trim()) return notify('Campo requerido', 'Ingresa nombre y apellido');
    if (!form.correo.trim()) return notify('Campo requerido', 'Ingresa el correo electrónico');
    if (!form.dni.trim()) return notify('Campo requerido', 'Ingresa el documento de identidad');
    if (form.contrasena.length < 6) return notify('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres');

    setSaving(true);
    try {
      await trabajadoresService.crear({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim() || undefined,
        dni: form.dni.trim(),
        contrasena: form.contrasena,
      });
      setForm(null);
      await load();
    } catch (err) {
      notify('No se pudo registrar', errorMessage(err), 'warning');
    } finally {
      setSaving(false);
    }
  };

  const cambiarDisponibilidad = async (t: Trabajador, disponible: boolean) => {
    try {
      await trabajadoresService.cambiarDisponibilidad(t.id_usuario, disponible);
      setTrabajadores((prev) => prev.map((x) => (x.id_usuario === t.id_usuario ? { ...x, disponible } : x)));
    } catch (err) {
      notify('Error', errorMessage(err), 'error');
    }
  };

  return (
    <Screen
      title="Trabajadores"
      subtitle="Registra al personal que atenderá los servicios. Podrás asignarlo al programar las reservas."
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      headerRight={
        !form ? (
          <Button
            title="Nuevo trabajador"
            icon={<Ionicons name="add" size={16} color="#ffffff" />}
            onPress={() => setForm(emptyForm)}
          />
        ) : undefined
      }>
      {form && (
        <Card style={styles.formCard}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Nuevo trabajador</Text>
          <View style={styles.twoCols}>
            <View style={styles.col}>
              <Input label="Nombre" value={form.nombre} onChangeText={(v) => setForm({ ...form, nombre: v })} maxLength={100} />
            </View>
            <View style={styles.col}>
              <Input label="Apellido" value={form.apellido} onChangeText={(v) => setForm({ ...form, apellido: v })} maxLength={100} />
            </View>
          </View>
          <View style={styles.twoCols}>
            <View style={styles.col}>
              <Input label="Documento de identidad" value={form.dni} onChangeText={(v) => setForm({ ...form, dni: v })} maxLength={20} />
            </View>
            <View style={styles.col}>
              <Input
                label="Teléfono (opcional)"
                value={form.telefono}
                onChangeText={(v) => setForm({ ...form, telefono: v })}
                keyboardType="phone-pad"
                maxLength={20}
              />
            </View>
          </View>
          <Input
            label="Correo electrónico"
            value={form.correo}
            onChangeText={(v) => setForm({ ...form, correo: v })}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={150}
          />
          <Input
            label="Contraseña inicial"
            value={form.contrasena}
            onChangeText={(v) => setForm({ ...form, contrasena: v })}
            secureTextEntry
            helper="El trabajador podrá iniciar sesión con este correo y contraseña."
          />
          <View style={styles.actions}>
            <Button title="Guardar" loading={saving} onPress={guardar} />
            <Button title="Cancelar" variant="outline" onPress={() => setForm(null)} />
          </View>
        </Card>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} />
      ) : trabajadores.length === 0 ? (
        <Card style={{ padding: Spacing.five, alignItems: 'center' }}>
          <Ionicons name="people-outline" size={44} color={theme.textSecondary} />
          <Text style={{ color: theme.textSecondary, marginTop: Spacing.two, textAlign: 'center' }}>
            Aún no hay trabajadores registrados.
          </Text>
        </Card>
      ) : (
        trabajadores.map((t) => (
          <Card key={t.id_usuario} style={styles.card}>
            <View style={styles.top}>
              <View style={{ flex: 1, minWidth: 180 }}>
                <Text style={[styles.name, { color: theme.text }]}>
                  {t.nombre} {t.apellido}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{t.correo}</Text>
                <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                  DNI {t.dni}
                  {t.telefono ? ` · ${t.telefono}` : ''} · Desde {t.fecha_contratacion}
                </Text>
              </View>
              <View style={styles.switchBox}>
                <Badge
                  label={t.disponible ? 'Disponible' : 'No disponible'}
                  status={t.disponible ? 'disponible' : 'cancelado'}
                  size="sm"
                />
                <Switch
                  value={t.disponible}
                  onValueChange={(v) => cambiarDisponibilidad(t, v)}
                  trackColor={{ true: theme.primary }}
                />
              </View>
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
  twoCols: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  col: { flexGrow: 1, flexBasis: 200 },
  actions: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  card: { padding: Spacing.four, marginBottom: Spacing.three },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three, flexWrap: 'wrap', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '800' },
  switchBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
