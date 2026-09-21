import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { espaciosService } from '@/services/reservas.service';
import { Espacio, HorarioAtencion } from '@/types';
import { errorMessage, notify } from '@/utils/dialog';

// Orden de visualización: lunes a domingo (el backend usa 0 = domingo ... 6 = sábado).
const DIAS: { dia: number; nombre: string }[] = [
  { dia: 1, nombre: 'Lunes' },
  { dia: 2, nombre: 'Martes' },
  { dia: 3, nombre: 'Miércoles' },
  { dia: 4, nombre: 'Jueves' },
  { dia: 5, nombre: 'Viernes' },
  { dia: 6, nombre: 'Sábado' },
  { dia: 0, nombre: 'Domingo' },
];

interface Tramo {
  inicio: string;
  fin: string;
}
type Borrador = Record<number, Tramo[]>;

const HORA = /^([01]?\d|2[0-3]):[0-5]\d$/;

const aMinutos = (hhmm: string): number | null => {
  if (!HORA.test(hhmm.trim())) return null;
  const [h, m] = hhmm.trim().split(':').map(Number);
  return h * 60 + m;
};

const aBorrador = (horarios: HorarioAtencion[]): Borrador => {
  const b: Borrador = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const h of horarios) b[h.dia_semana].push({ inicio: h.hora_inicio, fin: h.hora_fin });
  return b;
};

const plantillaLunesSabado = (): Borrador => {
  const b: Borrador = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (let d = 1; d <= 6; d++) b[d] = [{ inicio: '08:00', fin: '18:00' }];
  return b;
};

const resumenHorario = (horarios: HorarioAtencion[]): string => {
  if (horarios.length === 0) return 'Sin horario de atención: no recibe reservas';
  const porDia = new Set(horarios.map((h) => h.dia_semana));
  return `${porDia.size} día(s) · ${horarios.length} tramo(s) semanales`;
};

/** RF-05: espacios de lavado y horario semanal de atención. */
export default function AdminEspaciosScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();

  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [creando, setCreando] = useState(false);
  const [conPlantilla, setConPlantilla] = useState(true);

  const [editando, setEditando] = useState<string | null>(null);
  const [borrador, setBorrador] = useState<Borrador>({ 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] });
  const [guardando, setGuardando] = useState(false);

  const [editCodigoId, setEditCodigoId] = useState<string | null>(null);
  const [codigoDraft, setCodigoDraft] = useState('');
  const [guardandoCodigo, setGuardandoCodigo] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) router.replace('/');
  }, [isAuthenticated, isAdmin, router]);

  const load = useCallback(async () => {
    try {
      setEspacios(await espaciosService.listar());
    } catch (err) {
      notify('Error', errorMessage(err, 'No se pudieron cargar los espacios'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdmin) load();
  }, [isAuthenticated, isAdmin, load]);

  if (!isAdmin) return null;

  const crear = async () => {
    const codigo = nuevoCodigo.trim().toUpperCase();
    if (!codigo) return;
    setCreando(true);
    try {
      const horarios: HorarioAtencion[] | undefined = conPlantilla
        ? Object.entries(plantillaLunesSabado()).flatMap(([dia, tramos]) =>
            tramos.map((t) => ({
              dia_semana: Number(dia),
              hora_inicio: t.inicio,
              hora_fin: t.fin,
            }))
          )
        : undefined;
      await espaciosService.crear(codigo, true, horarios);
      setNuevoCodigo('');
      notify(
        'Espacio creado',
        conPlantilla
          ? `${codigo} listo con horario lun-sáb 08:00-18:00. Puedes ajustarlo abajo.`
          : `${codigo} creado. Define su horario para recibir reservas.`,
        'success'
      );
      await load();
    } catch (err) {
      notify('No se pudo crear el espacio', errorMessage(err), 'warning');
    } finally {
      setCreando(false);
    }
  };

  const alternarActivo = async (e: Espacio, activo: boolean) => {
    try {
      await espaciosService.actualizar(e.id_espacio, e.codigo, activo);
      await load();
    } catch (err) {
      notify('Error', errorMessage(err), 'error');
    }
  };

  const abrirEditarCodigo = (e: Espacio) => {
    setEditCodigoId(e.id_espacio);
    setCodigoDraft(e.codigo);
  };

  const guardarCodigo = async (e: Espacio) => {
    const codigo = codigoDraft.trim().toUpperCase();
    if (!codigo) return notify('Código vacío', 'Ingresa un código para el espacio.');
    setGuardandoCodigo(true);
    try {
      await espaciosService.actualizar(e.id_espacio, codigo, e.activo);
      setEditCodigoId(null);
      await load();
    } catch (err) {
      notify('No se pudo renombrar', errorMessage(err), 'warning');
    } finally {
      setGuardandoCodigo(false);
    }
  };

  const abrirHorarios = (e: Espacio) => {
    if (editando === e.id_espacio) {
      setEditando(null);
      return;
    }
    setEditando(e.id_espacio);
    setBorrador(aBorrador(e.horarios));
  };

  const cambiarTramo = (dia: number, i: number, campo: keyof Tramo, valor: string) =>
    setBorrador((b) => ({ ...b, [dia]: b[dia].map((t, k) => (k === i ? { ...t, [campo]: valor } : t)) }));

  const agregarTramo = (dia: number) =>
    setBorrador((b) => ({ ...b, [dia]: [...b[dia], { inicio: '08:00', fin: '18:00' }] }));

  const quitarTramo = (dia: number, i: number) =>
    setBorrador((b) => ({ ...b, [dia]: b[dia].filter((_, k) => k !== i) }));

  const copiarLunes = () =>
    setBorrador((b) => ({
      ...b,
      2: b[1].map((t) => ({ ...t })),
      3: b[1].map((t) => ({ ...t })),
      4: b[1].map((t) => ({ ...t })),
      5: b[1].map((t) => ({ ...t })),
      6: b[1].map((t) => ({ ...t })),
    }));

  const aplicarPlantilla = () => setBorrador(plantillaLunesSabado());

  const guardarHorarios = async (e: Espacio) => {
    const horarios: HorarioAtencion[] = [];
    for (const { dia, nombre } of DIAS) {
      const tramos = [...borrador[dia]].sort((a, b) => (aMinutos(a.inicio) ?? 0) - (aMinutos(b.inicio) ?? 0));
      for (let i = 0; i < tramos.length; i++) {
        const t = tramos[i];
        const ini = aMinutos(t.inicio);
        const fin = aMinutos(t.fin);
        if (ini === null || fin === null) {
          return notify('Hora inválida', `Revisa las horas de ${nombre}: usa HH:MM (ej. 08:00).`);
        }
        if (fin <= ini) {
          return notify('Rango inválido', `En ${nombre} la hora de fin debe ser posterior a la de inicio.`);
        }
        if (i > 0) {
          const prevFin = aMinutos(tramos[i - 1].fin);
          if (prevFin !== null && ini < prevFin) {
            return notify('Tramos solapados', `Hay tramos que se cruzan el ${nombre}.`);
          }
        }
        horarios.push({ dia_semana: dia, hora_inicio: t.inicio.trim(), hora_fin: t.fin.trim() });
      }
    }

    setGuardando(true);
    try {
      await espaciosService.guardarHorarios(e.id_espacio, horarios);
      notify('Horarios guardados', `Se actualizó el horario semanal de ${e.codigo}.`, 'success');
      setEditando(null);
      await load();
    } catch (err) {
      notify('No se pudieron guardar los horarios', errorMessage(err), 'warning');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Screen
      title="Espacios y Horarios"
      subtitle="Define los espacios de lavado y su horario semanal. Los clientes solo pueden reservar dentro de estos tramos."
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}>
      <Card style={styles.newCard}>
        <Text style={[styles.section, { color: theme.text }]}>Nuevo espacio</Text>
        <View style={styles.inline}>
          <View style={{ flex: 1 }}>
            <Input
              placeholder="Código, por ejemplo BOX-01"
              value={nuevoCodigo}
              onChangeText={setNuevoCodigo}
              autoCapitalize="characters"
              maxLength={20}
              style={{ marginBottom: 0 }}
            />
          </View>
          <Button
            title="Crear"
            icon={<Ionicons name="add" size={16} color="#ffffff" />}
            loading={creando}
            onPress={crear}
            style={{ marginBottom: Spacing.three }}
          />
        </View>
        <Pressable onPress={() => setConPlantilla((v) => !v)} style={styles.checkRow}>
          <Ionicons
            name={conPlantilla ? 'checkbox' : 'square-outline'}
            size={20}
            color={conPlantilla ? theme.primary : theme.textTertiary}
          />
          <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 13 }}>
            Crear con horario lun–sáb 08:00–18:00 (recomendado)
          </Text>
        </Pressable>
      </Card>

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} />
      ) : espacios.length === 0 ? (
        <Card style={{ padding: Spacing.five, alignItems: 'center' }}>
          <Ionicons name="grid-outline" size={44} color={theme.textSecondary} />
          <Text style={{ color: theme.textSecondary, marginTop: Spacing.two, textAlign: 'center' }}>
            Aún no hay espacios de lavado. Crea el primero para poder recibir reservas.
          </Text>
        </Card>
      ) : (
        espacios.map((e) => {
          const abierto = editando === e.id_espacio;
          const editandoCodigo = editCodigoId === e.id_espacio;
          return (
            <Card key={e.id_espacio} style={styles.card}>
              <View style={styles.top}>
                <View style={{ flex: 1, minWidth: 160 }}>
                  {editandoCodigo ? (
                    <View style={styles.inline}>
                      <View style={{ flex: 1 }}>
                        <Input
                          value={codigoDraft}
                          onChangeText={setCodigoDraft}
                          autoCapitalize="characters"
                          maxLength={20}
                          style={{ marginBottom: 0 }}
                        />
                      </View>
                      <Button title="OK" size="sm" loading={guardandoCodigo} onPress={() => guardarCodigo(e)} />
                      <Button title="X" size="sm" variant="outline" onPress={() => setEditCodigoId(null)} />
                    </View>
                  ) : (
                    <Pressable onPress={() => abrirEditarCodigo(e)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.name, { color: theme.text }]}>{e.codigo}</Text>
                      <Ionicons name="create-outline" size={16} color={theme.textTertiary} />
                    </Pressable>
                  )}
                  <Text style={{ color: theme.textTertiary, fontSize: 12, marginTop: 4 }}>{resumenHorario(e.horarios)}</Text>
                </View>
                <View style={styles.switchBox}>
                  <Badge label={e.activo ? 'Activo' : 'Inactivo'} status={e.activo ? 'disponible' : 'cancelado'} size="sm" />
                  <Switch value={e.activo} onValueChange={(v) => alternarActivo(e, v)} trackColor={{ true: theme.primary }} />
                </View>
              </View>

              <Button
                title={abierto ? 'Cerrar horarios' : 'Editar horarios'}
                size="sm"
                variant={abierto ? 'outline' : 'secondary'}
                icon={<Ionicons name="time-outline" size={16} color={theme.accentDark} />}
                onPress={() => abrirHorarios(e)}
                style={{ marginTop: Spacing.three }}
              />

              {abierto && (
                <View style={[styles.editor, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  {DIAS.map(({ dia, nombre }) => (
                    <View key={dia} style={styles.dayBlock}>
                      <View style={styles.dayHeader}>
                        <Text style={{ fontWeight: '800', color: theme.text }}>{nombre}</Text>
                        {borrador[dia].length === 0 && (
                          <Text style={{ color: theme.textTertiary, fontSize: 12 }}>Cerrado</Text>
                        )}
                      </View>
                      {borrador[dia].map((t, i) => (
                        <View key={i} style={styles.tramoRow}>
                          <View style={styles.timeInput}>
                            <Input
                              value={t.inicio}
                              onChangeText={(v) => cambiarTramo(dia, i, 'inicio', v)}
                              placeholder="08:00"
                              maxLength={5}
                              style={{ marginBottom: 0 }}
                            />
                          </View>
                          <Text style={{ color: theme.textSecondary }}>a</Text>
                          <View style={styles.timeInput}>
                            <Input
                              value={t.fin}
                              onChangeText={(v) => cambiarTramo(dia, i, 'fin', v)}
                              placeholder="18:00"
                              maxLength={5}
                              style={{ marginBottom: 0 }}
                            />
                          </View>
                          <Pressable onPress={() => quitarTramo(dia, i)} hitSlop={8} style={{ marginBottom: Spacing.three }}>
                            <Ionicons name="close-circle" size={24} color={theme.danger} />
                          </Pressable>
                        </View>
                      ))}
                      <Pressable onPress={() => agregarTramo(dia)} style={styles.addTramo}>
                        <Ionicons name="add-circle-outline" size={18} color={theme.accent} />
                        <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 13 }}>Agregar tramo</Text>
                      </Pressable>
                    </View>
                  ))}

                  <View style={styles.editorActions}>
                    <Button title="Guardar horarios" loading={guardando} onPress={() => guardarHorarios(e)} />
                    <Button title="Copiar lunes → mar-sáb" variant="outline" onPress={copiarLunes} />
                    <Button title="Plantilla 08-18" variant="outline" onPress={aplicarPlantilla} />
                  </View>
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
  newCard: { padding: Spacing.four, marginBottom: Spacing.four },
  section: { fontSize: 16, fontWeight: '800', marginBottom: Spacing.three },
  inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.one },
  card: { padding: Spacing.four, marginBottom: Spacing.three },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.three, flexWrap: 'wrap' },
  name: { fontSize: 18, fontWeight: '900' },
  switchBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  editor: { marginTop: Spacing.three, padding: Spacing.three, borderRadius: BorderRadius.lg, borderWidth: 1 },
  dayBlock: { marginBottom: Spacing.three },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: 6 },
  tramoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.two },
  timeInput: { width: 92 },
  addTramo: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  editorActions: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap', marginTop: Spacing.two },
});
