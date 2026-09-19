import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { IconText } from '@/components/ui/IconText';
import { Button } from '@/components/ui/Button';
import { Colors, BorderRadius, Spacing, MaxContentWidth } from '@/constants/theme';
import { reclamosService } from '@/services/reclamos.service';
import { resolveMediaUrl } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Reclamo, EstadoReclamo } from '@/types';

export default function AdminReclamosScreen() {
  const scheme = useColorScheme();
  const { width } = useWindowDimensions();
  const compact = width < 480;
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { isAuthenticated, token, isAdmin } = useAuth();
  const router = useRouter();

  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Redirigir a clientes a su pantalla de reclamos
  useEffect(() => {
    if (!isAdmin) {
      router.replace('/reclamos');
    }
  }, [isAdmin, router]);

  // Modal / Formulario de Respuesta
  const [reclamoSeleccionado, setReclamoSeleccionado] = useState<Reclamo | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState<EstadoReclamo>('respondido');
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

  const loadReclamos = async () => {
    if (!isAuthenticated || !token || !isAdmin) {
      setLoading(false);
      return;
    }
    try {
      const data = await reclamosService.getAdminReclamos();
      setReclamos(data);
    } catch (err) {
      console.error('Error cargando reclamos de admin:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token && isAdmin) {
      loadReclamos();
    }
  }, [isAuthenticated, token, isAdmin]);

  if (!isAdmin) {
    return null;
  }

  const onRefresh = () => {
    setRefreshing(true);
    loadReclamos();
  };

  const abrirModalRespuesta = (r: Reclamo) => {
    setReclamoSeleccionado(r);
    setRespuestaTexto(r.respuesta_admin || '');
    setNuevoEstado(r.estado === 'registrado' ? 'respondido' : r.estado);
  };

  const handleEnviarRespuesta = async () => {
    if (!reclamoSeleccionado) return;
    if (!respuestaTexto.trim()) {
      Alert.alert('Campo requerido', 'Por favor redacta la respuesta administrativa');
      return;
    }

    setEnviandoRespuesta(true);
    try {
      await reclamosService.responderReclamo(reclamoSeleccionado.id_reclamo, {
        respuesta_admin: respuestaTexto.trim(),
        nuevo_estado: nuevoEstado,
      });

      if (Platform.OS === 'web') {
        alert('Respuesta registrada y notificada al cliente con éxito.');
      } else {
        Alert.alert('Éxito', 'Respuesta guardada y notificada al cliente.');
      }

      setReclamoSeleccionado(null);
      await loadReclamos();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo guardar la respuesta');
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  const reclamosFiltrados = reclamos.filter((r) => {
    const coincideEstado = filtroEstado === 'todos' || r.estado === filtroEstado;
    const query = busqueda.toLowerCase().trim();
    const coincideTexto =
      !query ||
      r.asunto.toLowerCase().includes(query) ||
      (r.nombre_cliente && r.nombre_cliente.toLowerCase().includes(query)) ||
      (r.correo_cliente && r.correo_cliente.toLowerCase().includes(query));
    return coincideEstado && coincideTexto;
  });

  return (
    <ResponsiveLayout>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.contentWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              Bandeja de Reclamos Administrativa
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              RF-15: Supervisión de quejas, inspección de fotos de evidencia y emisión de respuestas formales
            </Text>
          </View>

          {/* Buscador estilo Pill */}
          <Input
            placeholder="Buscar por cliente, correo o asunto..."
            search
            value={busqueda}
            onChangeText={setBusqueda}
            style={{ marginBottom: Spacing.two }}
          />

          {/* Chips de Filtrado */}
          <View style={styles.filterChipsRow}>
            {['todos', 'registrado', 'en_revision', 'respondido', 'cerrado'].map((st) => (
              <Pressable
                key={st}
                onPress={() => setFiltroEstado(st)}
                style={[
                  styles.filterChip,
                  filtroEstado === st
                    ? { backgroundColor: theme.primary, borderColor: theme.primary }
                    : { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: filtroEstado === st ? '#ffffff' : theme.textSecondary,
                      fontWeight: filtroEstado === st ? '800' : '600',
                    },
                  ]}>
                  {st === 'todos' ? 'Todos' : st.replace('_', ' ')}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Formulario de Respuesta / Resolución */}
          {reclamoSeleccionado && (
            <Card style={[styles.replyBox, compact && styles.replyBoxCompact]}>
              <View style={styles.replyBoxHeader}>
                <Text style={[styles.replyBoxTitle, { color: theme.text }]}>
                  Responder: {reclamoSeleccionado.asunto}
                </Text>
                <Pressable onPress={() => setReclamoSeleccionado(null)} hitSlop={8}>
                  <Ionicons name="close-circle" size={24} color={theme.textSecondary} />
                </Pressable>
              </View>

              <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: Spacing.two }}>
                Cliente: <Text style={{ fontWeight: '700', color: theme.text }}>{reclamoSeleccionado.nombre_cliente}</Text> ({reclamoSeleccionado.correo_cliente})
              </Text>

              {/* Selector de Nuevo Estado */}
              <Text style={[styles.statusLabel, { color: theme.text }]}>
                Actualizar Estado a:
              </Text>
              <View style={styles.statusOptionsRow}>
                {(['en_revision', 'respondido', 'cerrado'] as EstadoReclamo[]).map((st) => (
                  <Pressable
                    key={st}
                    onPress={() => setNuevoEstado(st)}
                    style={[
                      styles.statusOptionBtn,
                      nuevoEstado === st
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}>
                    <Text
                      style={[
                        styles.statusOptionText,
                        {
                          color: nuevoEstado === st ? '#ffffff' : theme.textSecondary,
                          fontWeight: nuevoEstado === st ? '800' : '600',
                        },
                      ]}>
                      {st.replace('_', ' ')}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Input
                label="Respuesta Administrativa Oficial *"
                placeholder="Redacta la solución o aclaración para el cliente..."
                multiline
                numberOfLines={4}
                style={{ height: 110, textAlignVertical: 'top' }}
                value={respuestaTexto}
                onChangeText={setRespuestaTexto}
              />

              <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={() => setReclamoSeleccionado(null)}
                />
                <Button
                  title="Guardar y Notificar"
                  icon={<Ionicons name="checkmark-circle" size={16} color="#ffffff" />}
                  onPress={handleEnviarRespuesta}
                  loading={enviandoRespuesta}
                />
              </View>
            </Card>
          )}

          {/* Lista de Reclamos */}
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={theme.text} />
              <Text style={{ marginTop: 10, color: theme.textSecondary }}>
                Cargando bandeja de reclamos...
              </Text>
            </View>
          ) : reclamosFiltrados.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="file-tray-outline" size={48} color={theme.textSecondary} style={{ marginBottom: Spacing.two }} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No se encontraron reclamos
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                No hay reclamos que coincidan con los filtros seleccionados.
              </Text>
            </Card>
          ) : (
            reclamosFiltrados.map((rec) => (
              <Card key={rec.id_reclamo}>
                <View style={styles.claimHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.claimTitle, { color: theme.text }]}>
                      {rec.asunto}
                    </Text>
                    <IconText icon="person-outline" style={[styles.clientInfo, { color: theme.textSecondary }]}>
                      <Text style={{ fontWeight: '700', color: theme.text }}>{rec.nombre_cliente}</Text> • {rec.correo_cliente}
                    </IconText>
                    <IconText icon="calendar-outline" style={[styles.claimDate, { color: theme.textSecondary }]}>
                      {new Date(rec.fecha_registro).toLocaleDateString()} a las{' '}
                      {new Date(rec.fecha_registro).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </IconText>
                  </View>
                  <Badge label={rec.estado} status={rec.estado} />
                </View>

                {/* Descripción */}
                <Text style={[styles.claimDesc, { color: theme.text }]}>
                  {rec.descripcion}
                </Text>

                {/* Evidencias fotográficas con URL resuelta */}
                {rec.evidencias && rec.evidencias.length > 0 && (
                  <View style={styles.evidenceSection}>
                    <IconText icon="camera-outline" style={[styles.evidenceLabel, { color: theme.textSecondary }]}>
                      Evidencias fotográficas ({rec.evidencias.length}):
                    </IconText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                      {rec.evidencias.map((ev) => {
                        const fullUrl = resolveMediaUrl(ev.ruta_archivo);
                        return (
                          <View key={ev.id_evidencia} style={styles.evidenceThumbWrapper}>
                            <Image
                              source={{ uri: fullUrl }}
                              style={styles.evidenceThumb}
                              resizeMode="cover"
                            />
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Respuesta actual si existe */}
                {rec.respuesta_admin && (
                  <View style={[styles.currentResponseBox, { backgroundColor: theme.accentBg }]}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#8fd6bb', marginBottom: 2 }}>
                      Respuesta actual emitida por Administración:
                    </Text>
                    <Text style={{ fontSize: 13, color: '#cfe8dd', lineHeight: 18 }}>
                      {rec.respuesta_admin}
                    </Text>
                  </View>
                )}

                {/* Botón para responder o actualizar */}
                <Button
                  title={rec.respuesta_admin ? 'Modificar Respuesta' : 'Responder Reclamo'}
                  variant="secondary"
                  icon={<Ionicons name="create-outline" size={17} color={theme.text} />}
                  onPress={() => abrirModalRespuesta(rec)}
                  style={{ marginTop: Spacing.two }}
                />
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </ResponsiveLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    paddingBottom: 120,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  header: {
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  filterChip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  replyBox: {
    borderColor: '#3fae88',
    borderWidth: 2,
    marginBottom: Spacing.four,
    padding: Spacing.five,
  },
  replyBoxCompact: {
    padding: Spacing.three,
  },
  replyBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  replyBoxTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  statusOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  statusOptionBtn: {
    flexGrow: 1,
    flexBasis: 100,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  claimTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 3,
  },
  clientInfo: {
    fontSize: 13,
    marginBottom: 2,
  },
  claimDate: {
    fontSize: 11,
  },
  claimDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.three,
  },
  evidenceSection: {
    marginBottom: Spacing.three,
  },
  evidenceLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  evidenceThumbWrapper: {
    marginRight: Spacing.two,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#26322d',
  },
  evidenceThumb: {
    width: 90,
    height: 90,
  },
  currentResponseBox: {
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.two,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});
