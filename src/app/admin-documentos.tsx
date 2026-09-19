import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FilterChips } from '@/components/ui/FilterChips';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { documentosService } from '@/services/documentos.service';
import { resolveMediaUrl } from '@/services/api';
import { DocumentoPrevio } from '@/types';
import { badgeStatus, confirmAction, errorMessage, notify } from '@/utils/dialog';

export default function AdminDocumentosScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();

  const [documentos, setDocumentos] = useState<DocumentoPrevio[]>([]);
  const [estado, setEstado] = useState('adjuntado');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rechazando, setRechazando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) router.replace('/documentos');
  }, [isAuthenticated, isAdmin, router]);

  const load = useCallback(async () => {
    try {
      setDocumentos(await documentosService.listarAdmin(estado === 'todos' ? undefined : estado));
    } catch (err) {
      notify('Error', errorMessage(err, 'No se pudieron cargar los documentos'), 'error');
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

  const validar = async (d: DocumentoPrevio) => {
    const ok = await confirmAction(
      'Validar documento',
      `¿Confirmas que el PDF de ${d.nombre_cliente} para "${d.nombre_servicio}" es correcto?`
    );
    if (!ok) return;
    setProcesando(true);
    try {
      await documentosService.resolver(d.id_documento, { estado: 'validado' });
      await load();
    } catch (err) {
      notify('Error', errorMessage(err), 'error');
    } finally {
      setProcesando(false);
    }
  };

  const rechazar = async (d: DocumentoPrevio) => {
    if (!motivo.trim()) return notify('Campo requerido', 'Indica el motivo del rechazo');
    setProcesando(true);
    try {
      await documentosService.resolver(d.id_documento, {
        estado: 'rechazado',
        admin_respuesta: motivo.trim(),
      });
      setRechazando(null);
      setMotivo('');
      await load();
    } catch (err) {
      notify('Error', errorMessage(err), 'error');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Screen
      title="Validación de documentos"
      subtitle="RF-07: revisa los PDF firmados. Las reservas con servicios que exigen documento no se confirman hasta que sean validados."
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}>
      <FilterChips
        value={estado}
        onChange={setEstado}
        options={[
          { value: 'adjuntado', label: 'Pendientes' },
          { value: 'validado', label: 'Validados' },
          { value: 'rechazado', label: 'Rechazados' },
          { value: 'todos', label: 'Todos' },
        ]}
      />

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} />
      ) : documentos.length === 0 ? (
        <Card style={{ padding: Spacing.five, alignItems: 'center' }}>
          <Text style={{ color: theme.textSecondary }}>No hay documentos en este estado.</Text>
        </Card>
      ) : (
        documentos.map((d) => (
          <Card key={d.id_documento} style={styles.card}>
            <View style={styles.top}>
              <View style={{ flex: 1, minWidth: 200 }}>
                <Text style={[styles.name, { color: theme.text }]}>{d.nombre_servicio}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                  {d.nombre_cliente} • {d.correo_cliente}
                </Text>
                <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                  Reserva {d.id_reserva.slice(0, 8)} • {new Date(d.created_at).toLocaleString()}
                </Text>
              </View>
              <Badge label={d.estado} status={badgeStatus(d.estado)} />
            </View>

            {d.admin_respuesta ? (
              <Text style={{ color: theme.textSecondary, marginTop: Spacing.two, fontSize: 13 }}>
                Respuesta: {d.admin_respuesta}
              </Text>
            ) : null}

            <Pressable
              onPress={() => Linking.openURL(resolveMediaUrl(d.ruta_pdf))}
              style={{ marginTop: Spacing.two }}>
              <Text style={{ color: theme.sky, fontWeight: '700' }}>Abrir PDF</Text>
            </Pressable>

            {d.estado === 'adjuntado' && rechazando !== d.id_documento && (
              <View style={styles.actions}>
                <Button title="Validar" size="sm" disabled={procesando} onPress={() => validar(d)} />
                <Button
                  title="Rechazar"
                  size="sm"
                  variant="danger"
                  disabled={procesando}
                  onPress={() => {
                    setRechazando(d.id_documento);
                    setMotivo('');
                  }}
                />
              </View>
            )}

            {rechazando === d.id_documento && (
              <View style={{ marginTop: Spacing.three }}>
                <Input
                  label="Motivo del rechazo"
                  value={motivo}
                  onChangeText={setMotivo}
                  multiline
                  style={{ minHeight: 70, textAlignVertical: 'top' }}
                />
                <View style={styles.actions}>
                  <Button
                    title="Confirmar rechazo"
                    size="sm"
                    variant="danger"
                    loading={procesando}
                    onPress={() => rechazar(d)}
                  />
                  <Button title="Cancelar" size="sm" variant="outline" onPress={() => setRechazando(null)} />
                </View>
              </View>
            )}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.four, marginBottom: Spacing.three },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two, flexWrap: 'wrap' },
  name: { fontSize: 16, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three, flexWrap: 'wrap' },
});
