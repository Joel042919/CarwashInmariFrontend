import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconText } from '@/components/ui/IconText';
import { FilterChips } from '@/components/ui/FilterChips';
import { RequisitosDocumentales } from '@/components/ui/RequisitosDocumentales';
import { formatFecha } from '@/components/ui/DateStrip';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { reservasService } from '@/services/reservas.service';
import { Reserva } from '@/types';
import { badgeStatus, confirmAction, errorMessage, formatSoles, notify } from '@/utils/dialog';

const ACTIVAS = ['pendiente', 'confirmada', 'reprogramada'];

export default function ReservasScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [vista, setVista] = useState<'activas' | 'historial'>('activas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAdmin) router.replace('/admin-reservas');
  }, [isAdmin, router]);

  const load = useCallback(async () => {
    try {
      setReservas(await reservasService.misReservas());
    } catch (err) {
      notify('Error', errorMessage(err, 'No se pudieron cargar tus reservas'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) load();
  }, [isAuthenticated, isAdmin, load]);

  if (isAdmin) return null;

  const visibles = reservas.filter((r) =>
    vista === 'activas' ? ACTIVAS.includes(r.estado) : !ACTIVAS.includes(r.estado)
  );

  const cancelar = async (r: Reserva) => {
    const ok = await confirmAction(
      'Cancelar reserva',
      `¿Seguro que deseas cancelar tu reserva del ${formatFecha(r.fecha_reserva)} a las ${r.hora_inicio}?`
    );
    if (!ok) return;
    try {
      await reservasService.cancelar(r.id_reserva);
      notify('Reserva cancelada', 'El horario quedó liberado.', 'success');
      await load();
    } catch (err) {
      notify('No se pudo cancelar', errorMessage(err), 'error');
    }
  };

  return (
    <Screen
      title="Mis Reservas"
      subtitle="Consulta, reprograma o cancela tus reservas activas."
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      headerRight={
        <Button
          title="Nueva reserva"
          icon={<Ionicons name="add" size={16} color="#ffffff" />}
          onPress={() => router.push('/nueva-reserva')}
        />
      }>
      <FilterChips
        value={vista}
        onChange={(v) => setVista(v as 'activas' | 'historial')}
        options={[
          { value: 'activas', label: 'Activas' },
          { value: 'historial', label: 'Historial' },
        ]}
      />

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} />
      ) : visibles.length === 0 ? (
        <Card style={{ padding: Spacing.five, alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={44} color={theme.textSecondary} />
          <Text style={{ color: theme.textSecondary, marginTop: Spacing.two, textAlign: 'center' }}>
            {vista === 'activas' ? 'No tienes reservas activas.' : 'Aún no tienes reservas en el historial.'}
          </Text>
          {vista === 'activas' && (
            <Button
              title="Crear reserva"
              size="sm"
              style={{ marginTop: Spacing.three }}
              onPress={() => router.push('/nueva-reserva')}
            />
          )}
        </Card>
      ) : (
        visibles.map((r) => {
          const modificable = ACTIVAS.includes(r.estado) && (!r.estado_atencion || r.estado_atencion === 'programada');
          const esperaDocumento = r.requiere_documento && (r.estado === 'pendiente' || r.estado === 'reprogramada');
          return (
            <Card key={r.id_reserva} style={styles.card}>
              <View style={styles.top}>
                <View style={{ flex: 1, minWidth: 180 }}>
                  <Text style={[styles.title, { color: theme.text }]}>
                    {formatFecha(r.fecha_reserva)} · {r.hora_inicio} - {r.hora_fin}
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
                    • {s.nombre} — {formatSoles(s.precio_unitario)}
                  </Text>
                ))}
              </View>

              <View style={styles.totalRow}>
                <Text style={{ color: theme.textTertiary, fontSize: 12 }}>Total estimado</Text>
                <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 17 }}>{formatSoles(r.total_estimado)}</Text>
              </View>

              {r.trabajadores.length > 0 && (
                <IconText
                  icon="people-outline"
                  style={{ color: theme.textSecondary, fontSize: 13 }}
                  containerStyle={{ marginTop: Spacing.two }}>
                  Atenderá: {r.trabajadores.map((t) => t.nombre).join(', ')}
                </IconText>
              )}

              {r.estado === 'reprogramada' && (
                <Text style={{ color: theme.warning, fontSize: 12, marginTop: Spacing.two }}>
                  Esperando nueva confirmación y asignación de personal.
                </Text>
              )}

              {r.estado === 'cancelada' && r.motivo_cancelacion ? (
                <Text style={{ color: theme.danger, fontSize: 13, marginTop: Spacing.two }}>
                  Motivo: {r.motivo_cancelacion}
                </Text>
              ) : null}

              {esperaDocumento && (
                <View style={{ marginTop: Spacing.three }}>
                  <RequisitosDocumentales idReserva={r.id_reserva} />
                </View>
              )}

              {modificable && (
                <View style={styles.actions}>
                  <Button
                    title="Reprogramar"
                    size="sm"
                    variant="secondary"
                    onPress={() => router.push({ pathname: '/nueva-reserva', params: { reprogramar: r.id_reserva } })}
                  />
                  <Button title="Cancelar" size="sm" variant="danger" onPress={() => cancelar(r)} />
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three, flexWrap: 'wrap' },
});
