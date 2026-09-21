import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DateStrip, formatFecha, toISODate } from '@/components/ui/DateStrip';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { reservasService, vehiculosService } from '@/services/reservas.service';
import { serviciosService } from '@/services/servicios.service';
import { ApiError } from '@/services/api';
import { DisponibilidadResponse, Reserva, Servicio, Vehiculo } from '@/types';
import { errorMessage, formatSoles, notify } from '@/utils/dialog';

interface SlotElegido {
  id_espacio: string;
  codigo: string;
  hora_inicio: string;
  hora_fin: string;
}

const parseServiciosParam = (raw?: string | string[]): string[] => {
  if (!raw) return [];
  const s = Array.isArray(raw) ? raw.join(',') : raw;
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
};

/** RF-06: crear o reprogramar una reserva del cliente. */
export default function NuevaReservaScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();
  const { reprogramar, servicios: serviciosParam } = useLocalSearchParams<{
    reprogramar?: string;
    servicios?: string | string[];
  }>();
  const modoReprogramar = !!reprogramar;

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [original, setOriginal] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(true);

  const [vehiculoId, setVehiculoId] = useState('');
  const [seleccion, setSeleccion] = useState<string[]>(() => parseServiciosParam(serviciosParam));
  const [fecha, setFecha] = useState(toISODate(new Date()));
  const [disp, setDisp] = useState<DisponibilidadResponse | null>(null);
  const [dispLoading, setDispLoading] = useState(false);
  const [slot, setSlot] = useState<SlotElegido | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [enviando, setEnviando] = useState(false);
  const peticion = useRef(0);

  useEffect(() => {
    if (isAdmin) router.replace('/admin-reservas');
  }, [isAdmin, router]);

  useEffect(() => {
    if (!isAuthenticated || isAdmin) return;
    (async () => {
      try {
        if (modoReprogramar && reprogramar) {
          setOriginal(await reservasService.obtener(reprogramar));
        } else {
          const [v, s] = await Promise.all([vehiculosService.misVehiculos(), serviciosService.listar()]);
          setVehiculos(v);
          setServicios(s);
          if (v.length === 1) setVehiculoId(v[0].id_vehiculo);
          const pre = parseServiciosParam(serviciosParam);
          if (pre.length > 0) {
            const validos = new Set(s.map((x) => x.id_servicio));
            setSeleccion(pre.filter((id) => validos.has(id)));
          }
        }
      } catch (err) {
        notify('Error', errorMessage(err, 'No se pudo cargar la información'), 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, isAdmin, modoReprogramar, reprogramar, serviciosParam]);

  const claveServicios = seleccion.join(',');

  const cargarDisponibilidad = useCallback(async () => {
    if (!modoReprogramar && seleccion.length === 0) {
      setDisp(null);
      return;
    }
    const n = ++peticion.current;
    setDispLoading(true);
    try {
      const res = await reservasService.disponibilidad({
        fecha,
        servicios: modoReprogramar ? undefined : seleccion,
        excluirReserva: modoReprogramar ? reprogramar : undefined,
      });
      if (n === peticion.current) setDisp(res);
    } catch (err) {
      if (n === peticion.current) {
        setDisp(null);
        notify('No se pudo consultar la disponibilidad', errorMessage(err), 'error');
      }
    } finally {
      if (n === peticion.current) setDispLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, claveServicios, modoReprogramar, reprogramar]);

  useEffect(() => {
    setSlot(null);
    if (isAuthenticated && !isAdmin && !loading) cargarDisponibilidad();
  }, [cargarDisponibilidad, isAuthenticated, isAdmin, loading]);

  const elegidos = useMemo(() => servicios.filter((s) => seleccion.includes(s.id_servicio)), [servicios, seleccion]);
  const total = elegidos.reduce((acc, s) => acc + s.precio, 0);
  const duracion = elegidos.reduce((acc, s) => acc + s.duracion_estimada_min, 0);
  const exigeDocumento = elegidos.some((s) => s.requiere_documento);

  if (isAdmin) return null;

  const alternarServicio = (id: string) =>
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const confirmar = async () => {
    if (!slot) return notify('Falta el horario', 'Elige una hora disponible para continuar.');

    setEnviando(true);
    try {
      if (modoReprogramar && reprogramar) {
        await reservasService.reprogramar(reprogramar, {
          id_espacio: slot.id_espacio,
          fecha,
          hora_inicio: slot.hora_inicio,
        });
        notify(
          'Reserva reprogramada',
          'Quedó pendiente de nueva confirmación. Un administrador asignará personal al nuevo horario.',
          'success'
        );
        router.replace('/reservas');
        return;
      }

      if (!vehiculoId) return notify('Falta el vehículo', 'Selecciona el vehículo para la reserva.');
      if (seleccion.length === 0) return notify('Faltan servicios', 'Selecciona al menos un servicio.');

      const r = await reservasService.crear({
        id_vehiculo: vehiculoId,
        id_espacio: slot.id_espacio,
        fecha,
        hora_inicio: slot.hora_inicio,
        servicios: seleccion,
        observaciones: observaciones.trim() || undefined,
      });

      if (r.requiere_documento) {
        notify(
          'Reserva registrada',
          'Uno de tus servicios exige un documento firmado. Adjúntalo para que podamos confirmar la reserva.',
          'success'
        );
        router.replace({ pathname: '/documentos', params: { id_reserva: r.id_reserva } });
      } else {
        notify('Reserva registrada', 'Un administrador la confirmará y asignará al personal.', 'success');
        router.replace('/reservas');
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        notify('Horario no disponible', err.message, 'warning');
        cargarDisponibilidad();
      } else {
        notify('No se pudo guardar la reserva', errorMessage(err), 'error');
      }
    } finally {
      setEnviando(false);
    }
  };

  const titulo = modoReprogramar ? 'Reprogramar reserva' : 'Nueva reserva';

  return (
    <Screen
      title={titulo}
      subtitle={
        modoReprogramar
          ? 'Elige la nueva fecha y hora. La duración se mantiene; deberás esperar nueva confirmación.'
          : 'Elige tu vehículo, los servicios, la fecha y un horario disponible.'
      }
      headerRight={
        <Button
          title="Mis reservas"
          variant="secondary"
          icon={<Ionicons name="calendar-outline" size={16} color={theme.accentDark} />}
          onPress={() => router.push('/reservas')}
        />
      }>
      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} />
      ) : (
        <>
          {modoReprogramar && original && (
            <Card style={styles.card}>
              <Text style={[styles.section, { color: theme.text }]}>Reserva actual</Text>
              <Text style={{ color: theme.textSecondary }}>
                {original.vehiculo} · {original.placa}
              </Text>
              <Text style={{ color: theme.textSecondary }}>
                {formatFecha(original.fecha_reserva)} · {original.hora_inicio} - {original.hora_fin} ·{' '}
                {original.codigo_espacio}
              </Text>
              <Text style={{ color: theme.textTertiary, fontSize: 12, marginTop: 4 }}>
                {original.servicios.map((s) => s.nombre).join(', ')}
              </Text>
            </Card>
          )}

          {!modoReprogramar && (
            <>
              <Card style={styles.card}>
                <Text style={[styles.section, { color: theme.text }]}>1. Vehículo</Text>
                {vehiculos.length === 0 ? (
                  <View style={{ gap: Spacing.two }}>
                    <Text style={{ color: theme.textSecondary }}>Aún no tienes vehículos registrados.</Text>
                    <Button title="Registrar un vehículo" size="sm" onPress={() => router.push('/vehiculos')} />
                  </View>
                ) : (
                  <View style={styles.wrap}>
                    {vehiculos.map((v) => {
                      const activo = v.id_vehiculo === vehiculoId;
                      return (
                        <Pressable
                          key={v.id_vehiculo}
                          onPress={() => setVehiculoId(v.id_vehiculo)}
                          style={[
                            styles.option,
                            activo
                              ? { backgroundColor: theme.primary, borderColor: theme.primary }
                              : { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                          ]}>
                          <Ionicons name="car-sport" size={18} color={activo ? '#ffffff' : theme.accentDark} />
                          <View>
                            <Text style={{ fontWeight: '800', color: activo ? '#ffffff' : theme.text }}>{v.placa}</Text>
                            <Text style={{ fontSize: 12, color: activo ? '#d1fae5' : theme.textSecondary }}>
                              {v.marca} {v.modelo}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </Card>

              <Card style={styles.card}>
                <Text style={[styles.section, { color: theme.text }]}>2. Servicios</Text>
                {servicios.length === 0 ? (
                  <Text style={{ color: theme.textSecondary }}>No hay servicios disponibles por ahora.</Text>
                ) : (
                  servicios.map((s) => {
                    const activo = seleccion.includes(s.id_servicio);
                    return (
                      <Pressable
                        key={s.id_servicio}
                        onPress={() => alternarServicio(s.id_servicio)}
                        style={[
                          styles.serviceRow,
                          {
                            borderColor: activo ? theme.primary : theme.border,
                            backgroundColor: activo ? theme.accentBg : theme.backgroundElement,
                          },
                        ]}>
                        <Ionicons
                          name={activo ? 'checkbox' : 'square-outline'}
                          size={22}
                          color={activo ? theme.primary : theme.textTertiary}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '800', color: theme.text }}>{s.nombre}</Text>
                          <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                            {s.duracion_estimada_min} min
                            {s.requiere_documento ? ' · requiere documento firmado' : ''}
                          </Text>
                        </View>
                        <Text style={{ fontWeight: '900', color: theme.accent }}>{formatSoles(s.precio)}</Text>
                      </Pressable>
                    );
                  })
                )}
              </Card>
            </>
          )}

          <Card style={styles.card}>
            <Text style={[styles.section, { color: theme.text }]}>
              {modoReprogramar ? '1. Fecha' : '3. Fecha'}
            </Text>
            <DateStrip value={fecha} onChange={setFecha} />

            <Text style={[styles.section, { color: theme.text }]}>
              {modoReprogramar ? '2. Horario' : '4. Horario'}
            </Text>
            {!modoReprogramar && seleccion.length === 0 ? (
              <Text style={{ color: theme.textSecondary }}>Selecciona al menos un servicio para ver los horarios.</Text>
            ) : dispLoading ? (
              <ActivityIndicator color={theme.accent} />
            ) : !disp || disp.espacios.length === 0 ? (
              <Text style={{ color: theme.textSecondary }}>
                No hay horarios disponibles para este día. Prueba con otra fecha o revisa que existan espacios con
                horario activo.
              </Text>
            ) : (
              disp.espacios.map((e) => (
                <View key={e.id_espacio} style={{ marginBottom: Spacing.three }}>
                  <Text style={{ color: theme.textSecondary, fontWeight: '700', marginBottom: 6 }}>
                    Espacio {e.codigo}
                  </Text>
                  <View style={styles.wrap}>
                    {e.slots.map((s) => {
                      const activo = slot?.id_espacio === e.id_espacio && slot.hora_inicio === s.hora_inicio;
                      return (
                        <Pressable
                          key={`${e.id_espacio}-${s.hora_inicio}`}
                          onPress={() =>
                            setSlot({
                              id_espacio: e.id_espacio,
                              codigo: e.codigo,
                              hora_inicio: s.hora_inicio,
                              hora_fin: s.hora_fin,
                            })
                          }
                          style={[
                            styles.slot,
                            activo
                              ? { backgroundColor: theme.primary, borderColor: theme.primary }
                              : { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                          ]}>
                          <Text style={{ fontWeight: '800', color: activo ? '#ffffff' : theme.text }}>{s.hora_inicio}</Text>
                          <Text style={{ fontSize: 10, color: activo ? '#d1fae5' : theme.textTertiary }}>{s.hora_fin}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
            {disp && disp.espacios.length > 0 && (
              <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                Duración: {disp.duracion_min} min. Cada casilla muestra inicio y fin del servicio.
              </Text>
            )}
          </Card>

          {!modoReprogramar && (
            <Card style={styles.card}>
              <Input
                label="Observaciones (opcional)"
                value={observaciones}
                onChangeText={setObservaciones}
                multiline
                style={{ minHeight: 70, textAlignVertical: 'top' }}
                maxLength={300}
              />
            </Card>
          )}

          <Card style={styles.card}>
            <Text style={[styles.section, { color: theme.text }]}>Resumen</Text>
            {slot ? (
              <Text style={{ color: theme.textSecondary, marginBottom: 4 }}>
                {formatFecha(fecha)} · {slot.hora_inicio} - {slot.hora_fin} · Espacio {slot.codigo}
              </Text>
            ) : (
              <Text style={{ color: theme.textTertiary, marginBottom: 4 }}>Aún no eliges un horario.</Text>
            )}
            {!modoReprogramar && (
              <View style={styles.totalRow}>
                <Text style={{ color: theme.textSecondary }}>
                  {seleccion.length} servicio(s) · {duracion} min
                </Text>
                <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 18 }}>{formatSoles(total)}</Text>
              </View>
            )}
            {exigeDocumento && (
              <View style={{ marginTop: Spacing.two, alignSelf: 'flex-start' }}>
                <Badge label="Requiere documento firmado" status="pendiente" size="sm" />
              </View>
            )}
            <Button
              title={modoReprogramar ? 'Confirmar cambio' : 'Reservar'}
              loading={enviando}
              disabled={!slot}
              onPress={confirmar}
              style={{ marginTop: Spacing.three }}
            />
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.four, marginBottom: Spacing.three },
  section: { fontSize: 16, fontWeight: '800', marginBottom: Spacing.three },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  slot: {
    minHeight: 44,
    minWidth: 72,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
});
