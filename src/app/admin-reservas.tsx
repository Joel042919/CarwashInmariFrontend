import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FilterChips } from '@/components/ui/FilterChips';
import { DateStrip, formatFecha } from '@/components/ui/DateStrip';
import { IconText } from '@/components/ui/IconText';
import { RequisitosDocumentales } from '@/components/ui/RequisitosDocumentales';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { reservasService } from '@/services/reservas.service';
import { Reserva, TrabajadorDisponible } from '@/types';
import { badgeStatus, confirmAction, errorMessage, formatSoles, notify } from '@/utils/dialog';

// Programación y asignación de personal (RF-09).
// TODO(Erick): primera versión completa de RF-09, hecha para poder probar el flujo de punta a
// punta. Es tuya: puedes modificarla o reemplazarla por completo (vista de calendario,
// reasignaciones, etc.).
// TODO(Mego): RF-10, los cambios de estado de la atención (en proceso, pausa, finalizada,
// entregada) y su historial parten de la atención "programada" que crea esta pantalla.
export default function AdminReservasScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { reserva: reservaSeleccionada } = useLocalSearchParams<{ reserva?: string }>();
  const { isAdmin, isAuthenticated } = useAuth();

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [estado, setEstado] = useState(reservaSeleccionada ? 'todas' : 'pendiente');
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Panel de programación
  const [programando, setProgramando] = useState<string | null>(null);
  const [trabajadores, setTrabajadores] = useState<TrabajadorDisponible[]>([]);
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [cargandoTrab, setCargandoTrab] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) router.replace('/reservas');
  }, [isAuthenticated, isAdmin, router]);

  const load = useCallback(async () => {
    try {
      const lista = await reservasService.listarAdmin({
          estado: estado === 'todas' ? undefined : estado,
          fecha: fecha || undefined,
        });
      setReservas(reservaSeleccionada ? lista.filter((r) => r.id_reserva === reservaSeleccionada) : lista);
    } catch (err) {
      notify('Error', errorMessage(err, 'No se pudieron cargar las reservas'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [estado, fecha, reservaSeleccionada]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      setLoading(true);
      load();
    }
  }, [isAuthenticated, isAdmin, load]);

  if (!isAdmin) return null;

  const abrirProgramacion = async (r: Reserva) => {
    if (programando === r.id_reserva) {
      setProgramando(null);
      return;
    }
    setProgramando(r.id_reserva);
    setElegidos(r.trabajadores.map((t) => t.id_trabajador));
    setCargandoTrab(true);
    try {
      setTrabajadores(await reservasService.trabajadoresDisponibles(r.id_reserva));
    } catch (err) {
      notify('Error', errorMessage(err, 'No se pudieron cargar los trabajadores'), 'error');
    } finally {
      setCargandoTrab(false);
    }
  };

  const alternar = (id: string) =>
    setElegidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const confirmarProgramacion = async (r: Reserva) => {
    if (elegidos.length === 0) return notify('Falta personal', 'Asigna al menos un trabajador.');
    setGuardando(true);
    try {
      await reservasService.programar(r.id_reserva, elegidos);
      notify('Atención programada', 'La reserva quedó confirmada y el personal asignado.', 'success');
      setProgramando(null);
      await load();
    } catch (err) {
      notify('No se pudo programar', errorMessage(err), 'warning');
      setRefreshKey((k) => k + 1); // refresca el estado de los documentos
    } finally {
      setGuardando(false);
    }
  };

  const cancelar = async (r: Reserva) => {
    const ok = await confirmAction(
      'Cancelar reserva',
      `Se cancelará la reserva de ${r.nombre_cliente} y se liberará el horario. ¿Continuar?`
    );
    if (!ok) return;
    try {
      await reservasService.cancelarAdmin(r.id_reserva);
      await load();
    } catch (err) {
      notify('No se pudo cancelar', errorMessage(err), 'error');
    }
  };

  return (
    <Screen
      title="Programación de Reservas"
      subtitle="RF-09: revisa las reservas, confirma la documentación y asigna uno o varios trabajadores."
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}>
      <FilterChips
        value={estado}
        onChange={setEstado}
        options={[
          { value: 'pendiente', label: 'Pendientes' },
          { value: 'reprogramada', label: 'Reprogramadas' },
          { value: 'confirmada', label: 'Confirmadas' },
          { value: 'cancelada', label: 'Canceladas' },
          { value: 'completada', label: 'Completadas' },
          { value: 'todas', label: 'Todas' },
        ]}
      />
      <DateStrip value={fecha} onChange={setFecha} allowAll days={45} />

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} />
      ) : reservas.length === 0 ? (
        <Card style={{ padding: Spacing.five, alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={44} color={theme.textSecondary} />
          <Text style={{ color: theme.textSecondary, marginTop: Spacing.two, textAlign: 'center' }}>
            No hay reservas con este filtro.
          </Text>
        </Card>
      ) : (
        reservas.map((r) => {
          const editable =
            (r.estado === 'pendiente' || r.estado === 'reprogramada' || r.estado === 'confirmada') &&
            (!r.estado_atencion || r.estado_atencion === 'programada');
          const abierto = programando === r.id_reserva;
          return (
            <Card key={r.id_reserva} style={styles.card}>
              <View style={styles.top}>
                <View style={{ flex: 1, minWidth: 200 }}>
                  <Text style={[styles.title, { color: theme.text }]}>
                    {formatFecha(r.fecha_reserva)} · {r.hora_inicio} - {r.hora_fin}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                    {r.nombre_cliente} · {r.correo_cliente}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                    {r.vehiculo} ({r.placa}) · Espacio {r.codigo_espacio}
                  </Text>
                </View>
                <Badge label={r.estado} status={badgeStatus(r.estado)} />
              </View>

              <View style={{ marginTop: Spacing.two }}>
                {r.servicios.map((s) => (
                  <Text key={s.id_servicio} style={{ color: theme.textSecondary, fontSize: 13 }}>
                    • {s.nombre}
                    {s.requiere_documento ? ' (requiere documento)' : ''}
                  </Text>
                ))}
                <Text style={{ color: theme.accent, fontWeight: '900', marginTop: 4 }}>{formatSoles(r.total_estimado)}</Text>
              </View>

              {r.trabajadores.length > 0 && (
                <IconText
                  icon="people-outline"
                  style={{ color: theme.textSecondary, fontSize: 13 }}
                  containerStyle={{ marginTop: Spacing.two }}>
                  {r.trabajadores.map((t) => t.nombre).join(', ')}
                </IconText>
              )}
              {r.observaciones ? (
                <Text style={{ color: theme.textTertiary, fontSize: 12, marginTop: Spacing.two }}>Obs.: {r.observaciones}</Text>
              ) : null}
              {r.estado === 'cancelada' && r.motivo_cancelacion ? (
                <Text style={{ color: theme.danger, fontSize: 13, marginTop: Spacing.two }}>Motivo: {r.motivo_cancelacion}</Text>
              ) : null}

              {editable && (
                <View style={styles.actions}>
                  <Button
                    title={abierto ? 'Cerrar' : r.estado === 'confirmada' ? 'Cambiar personal' : 'Programar y asignar'}
                    size="sm"
                    variant={abierto ? 'outline' : 'primary'}
                    onPress={() => abrirProgramacion(r)}
                  />
                  <Button title="Cancelar" size="sm" variant="danger" onPress={() => cancelar(r)} />
                </View>
              )}

              {abierto && (
                <View style={[styles.panel, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  {r.requiere_documento && (
                    <RequisitosDocumentales key={`${r.id_reserva}-${refreshKey}`} idReserva={r.id_reserva} />
                  )}

                  <Text style={[styles.panelTitle, { color: theme.text }]}>Trabajadores</Text>
                  {cargandoTrab ? (
                    <ActivityIndicator color={theme.accent} />
                  ) : trabajadores.length === 0 ? (
                    <View style={{ gap: Spacing.two }}>
                      <Text style={{ color: theme.textSecondary }}>Aún no hay trabajadores registrados.</Text>
                      <Button title="Registrar trabajadores" size="sm" onPress={() => router.push('/admin-trabajadores')} />
                    </View>
                  ) : (
                    <View style={styles.wrap}>
                      {trabajadores.map((t) => {
                        const bloqueado = !t.disponible || t.ocupado;
                        const activo = elegidos.includes(t.id_trabajador);
                        return (
                          <Pressable
                            key={t.id_trabajador}
                            disabled={bloqueado}
                            onPress={() => alternar(t.id_trabajador)}
                            style={[
                              styles.worker,
                              activo
                                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                                : { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                              bloqueado && { opacity: 0.5 },
                            ]}>
                            <Ionicons
                              name={activo ? 'checkmark-circle' : 'person-outline'}
                              size={16}
                              color={activo ? '#ffffff' : theme.textSecondary}
                            />
                            <View>
                              <Text style={{ fontWeight: '700', color: activo ? '#ffffff' : theme.text }}>{t.nombre}</Text>
                              {bloqueado && (
                                <Text style={{ fontSize: 11, color: theme.danger }}>
                                  {!t.disponible ? 'No disponible' : 'Ocupado en este horario'}
                                </Text>
                              )}
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  <Button
                    title="Confirmar programación"
                    loading={guardando}
                    disabled={cargandoTrab || elegidos.length === 0}
                    onPress={() => confirmarProgramacion(r)}
                    style={{ marginTop: Spacing.three }}
                  />
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
  panel: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  panelTitle: { fontSize: 15, fontWeight: '800', marginBottom: Spacing.two },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  worker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
});
