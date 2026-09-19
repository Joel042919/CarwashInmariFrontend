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
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { IconText } from '@/components/ui/IconText';
import { Colors, BorderRadius, Spacing, MaxContentWidth } from '@/constants/theme';
import { reclamosService } from '@/services/reclamos.service';
import { resolveMediaUrl } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Reclamo } from '@/types';

type ReclamosTab = 'lista' | 'nuevo';

interface SelectedImage {
  uri: string;
  name: string;
  type: string;
}

export default function ReclamosScreen() {
  const scheme = useColorScheme();
  const { width } = useWindowDimensions();
  const compact = width < 480;
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { isAuthenticated, token, isAdmin } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ReclamosTab>('lista');
  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Redirigir al administrador a su bandeja exclusiva de reclamos
  useEffect(() => {
    if (isAdmin) {
      router.replace('/admin-reclamos');
    }
  }, [isAdmin, router]);

  // Formulario
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [descripcionEvidencia, setDescripcionEvidencia] = useState('');
  const [imagenes, setImagenes] = useState<SelectedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadReclamos = async () => {
    if (!isAuthenticated || !token || isAdmin) {
      setLoading(false);
      return;
    }
    try {
      const data = await reclamosService.getMisReclamos();
      setReclamos(data);
    } catch (err) {
      console.error('Error cargando reclamos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token && !isAdmin) {
      loadReclamos();
    }
  }, [isAuthenticated, token, isAdmin]);

  if (isAdmin) {
    return null;
  }

  const onRefresh = () => {
    setRefreshing(true);
    loadReclamos();
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso denegado',
          'Se requiere permiso para seleccionar fotos de evidencia.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages: SelectedImage[] = result.assets.map((asset, idx) => {
          const fileName = asset.fileName || `evidencia_${Date.now()}_${idx}.jpg`;
          return {
            uri: asset.uri,
            name: fileName,
            type: asset.mimeType || 'image/jpeg',
          };
        });

        setImagenes((prev) => [...prev, ...newImages]);
      }
    } catch (err) {
      console.error('Error seleccionando imagen:', err);
      Alert.alert('Error', 'No se pudo cargar la imagen');
    }
  };

  const removeImage = (index: number) => {
    setImagenes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCrearReclamo = async () => {
    if (!asunto.trim() || !descripcion.trim()) {
      setFormError('El asunto y la descripción del reclamo son obligatorios.');
      return;
    }

    setFormError('');
    setSubmitting(true);

    try {
      await reclamosService.crearReclamo({
        asunto: asunto.trim(),
        descripcion: descripcion.trim(),
        descripcion_evidencia: descripcionEvidencia.trim() || undefined,
        imagenes: imagenes.length > 0 ? imagenes : undefined,
      });

      // Limpiar formulario
      setAsunto('');
      setDescripcion('');
      setDescripcionEvidencia('');
      setImagenes([]);

      await loadReclamos();
      setActiveTab('lista');

      if (Platform.OS === 'web') {
        alert('Reclamo registrado exitosamente. Será revisado por administración.');
      } else {
        Alert.alert('Éxito', 'Reclamo y evidencias registrados correctamente.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Error al radicar reclamo';
      setFormError(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

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
          <View style={styles.pageHeader}>
            <View style={styles.headerText}>
              <Text style={[styles.pageTitle, { color: theme.text }]}>
                Reclamos e Inconvenientes
              </Text>
              <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
                RF-15: Garantía post-servicio. Adjunta evidencias fotográficas y recibe respuesta oficial.
              </Text>
            </View>

            {/* Pill Tabs Selector */}
            <View style={styles.tabPillsRow}>
              <Pressable
                onPress={() => setActiveTab('lista')}
                style={[
                  styles.tabPill,
                  activeTab === 'lista'
                    ? { backgroundColor: theme.primary, borderColor: theme.primary }
                    : { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <Ionicons
                  name="list"
                  size={15}
                  color={activeTab === 'lista' ? '#ffffff' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.tabPillText,
                    {
                      color: activeTab === 'lista' ? '#ffffff' : theme.textSecondary,
                      fontWeight: activeTab === 'lista' ? '800' : '600',
                    },
                  ]}>
                  Mis Reclamos ({reclamos.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('nuevo')}
                style={[
                  styles.tabPill,
                  activeTab === 'nuevo'
                    ? { backgroundColor: theme.primary, borderColor: theme.primary }
                    : { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <Ionicons
                  name="add-circle"
                  size={15}
                  color={activeTab === 'nuevo' ? '#ffffff' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.tabPillText,
                    {
                      color: activeTab === 'nuevo' ? '#ffffff' : theme.textSecondary,
                      fontWeight: activeTab === 'nuevo' ? '800' : '600',
                    },
                  ]}>
                  Radicar Reclamo
                </Text>
              </Pressable>
            </View>
          </View>

          {/* TAB 1: LISTADO DE RECLAMOS */}
          {activeTab === 'lista' && (
            <View style={{ marginTop: Spacing.two }}>
              {loading ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={theme.text} />
                  <Text style={{ marginTop: 10, color: theme.textSecondary }}>
                    Consultando tus reclamos...
                  </Text>
                </View>
              ) : reclamos.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={48}
                    color={theme.accent}
                    style={{ marginBottom: Spacing.two }}
                  />
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    No tienes reclamos registrados
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                    Si experimentaste algún inconveniente con el lavado, secado o cobro, puedes radicar tu solicitud.
                  </Text>
                  <Button
                    title="Registrar Nuevo Reclamo"
                    onPress={() => setActiveTab('nuevo')}
                    style={{ marginTop: Spacing.three }}
                  />
                </Card>
              ) : (
                reclamos.map((rec) => (
                  <Card key={rec.id_reclamo} style={styles.claimCard}>
                    {/* Header del Reclamo */}
                    <View style={styles.claimTopRow}>
                      <View style={{ flex: 1, marginRight: Spacing.two }}>
                        <Text style={[styles.claimAsunto, { color: theme.text }]}>
                          {rec.asunto}
                        </Text>
                        <Text style={[styles.claimFecha, { color: theme.textSecondary }]}>
                          Registrado el {new Date(rec.fecha_registro).toLocaleDateString()} a las{' '}
                          {new Date(rec.fecha_registro).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <Badge label={rec.estado} status={rec.estado} />
                    </View>

                    {/* Descripción */}
                    <Text style={[styles.claimDescripcion, { color: theme.text }]}>
                      {rec.descripcion}
                    </Text>

                    {/* Galería de Evidencias Fotográficas */}
                    {rec.evidencias && rec.evidencias.length > 0 && (
                      <View style={styles.evidenceGallery}>
                        <IconText icon="camera-outline" style={[styles.evidenceLabel, { color: theme.textSecondary }]}>
                          Fotos de evidencia adjuntadas ({rec.evidencias.length}):
                        </IconText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                          {rec.evidencias.map((ev) => {
                            const fullUrl = resolveMediaUrl(ev.ruta_archivo);
                            return (
                              <View key={ev.id_evidencia} style={styles.evidenceImageFrame}>
                                <Image
                                  source={{ uri: fullUrl }}
                                  style={styles.evidencePhoto}
                                  resizeMode="cover"
                                />
                              </View>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}

                    {/* Respuesta Oficial del Administrador */}
                    {rec.respuesta_admin ? (
                      <View
                        style={[
                          styles.responseBox,
                          {
                            backgroundColor: theme.accentBg,
                            borderColor: theme.accent,
                          },
                        ]}>
                        <View style={styles.responseHeader}>
                          <Ionicons name="shield-checkmark" size={18} color="#8fd6bb" />
                          <Text style={styles.responseTitle}>
                            Respuesta Oficial del Administrador
                          </Text>
                          {rec.fecha_respuesta && (
                            <Text style={styles.responseDate}>
                              {new Date(rec.fecha_respuesta).toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.responseText}>
                          {rec.respuesta_admin}
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.pendingNotice, { backgroundColor: theme.surface }]}>
                        <Ionicons name="time" size={16} color={theme.textSecondary} />
                        <Text style={[styles.pendingNoticeText, { color: theme.textSecondary }]}>
                          Reclamo registrado. En espera de evaluación por el área de administración.
                        </Text>
                      </View>
                    )}
                  </Card>
                ))
              )}
            </View>
          )}

          {/* TAB 2: RADICAR RECLAMO (Formulario Luxury) */}
          {activeTab === 'nuevo' && (
            <Card style={[styles.formCard, compact && styles.cardCompact]}>
              <Text style={[styles.formHeading, { color: theme.text }]}>
                Nuevo Reclamo o Queja
              </Text>
              <Text style={[styles.formSubheading, { color: theme.textSecondary }]}>
                Adjunta información clara y fotografías para una resolución rápida.
              </Text>

              {formError ? (
                <View style={[styles.errorBox, { backgroundColor: theme.dangerBg }]}>
                  <Ionicons name="alert-circle" size={18} color={theme.danger} />
                  <Text style={[styles.errorBoxText, { color: theme.danger }]}>
                    {formError}
                  </Text>
                </View>
              ) : null}

              <Input
                label="Asunto *"
                placeholder="Ej: Inconformidad con el secado de espejos / mancha preexistente"
                value={asunto}
                onChangeText={setAsunto}
              />

              <Input
                label="Descripción detallada *"
                placeholder="Describe qué sucedió, qué parte del vehículo requiere atención o qué observación tienes..."
                multiline
                numberOfLines={4}
                style={{ height: 110, textAlignVertical: 'top' }}
                value={descripcion}
                onChangeText={setDescripcion}
              />

              {/* Selector de Evidencias */}
              <View style={styles.evidenceUploadSection}>
                <Text style={[styles.uploadSectionTitle, { color: theme.text }]}>
                  Evidencias Fotográficas
                </Text>
                <Text style={[styles.uploadSectionSubtitle, { color: theme.textSecondary }]}>
                  Sube fotos nítidas de la zona afectada o del comprobante.
                </Text>

                <Button
                  title="Adjuntar Fotografías"
                  variant="secondary"
                  icon={<Ionicons name="images-outline" size={18} color={theme.text} />}
                  onPress={pickImage}
                  style={{ alignSelf: 'flex-start', marginTop: 8 }}
                />

                {/* Grid de Fotos Seleccionadas */}
                {imagenes.length > 0 && (
                  <View style={styles.previewSection}>
                    <Text style={[styles.previewCountText, { color: theme.textSecondary }]}>
                      {imagenes.length} imagen(es) seleccionada(s):
                    </Text>
                    <View style={styles.previewGrid}>
                      {imagenes.map((img, idx) => (
                        <View key={idx} style={styles.previewThumbBox}>
                          <Image source={{ uri: img.uri }} style={styles.previewThumb} />
                          <Pressable
                            onPress={() => removeImage(idx)}
                            style={styles.removeThumbBtn}>
                            <Ionicons name="close" size={14} color="#ffffff" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <Button
                title="Enviar Reclamo a Administración"
                icon={<Ionicons name="send" size={16} color="#ffffff" />}
                iconPosition="right"
                onPress={handleCrearReclamo}
                loading={submitting}
                style={{ marginTop: Spacing.four }}
              />
            </Card>
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
  // El bloque de título puede encogerse y saltar de línea en pantallas angostas.
  headerText: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 280,
    minWidth: 0,
  },
  pageHeader: {
    marginBottom: Spacing.four,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 4,
    maxWidth: 550,
  },
  tabPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flexShrink: 1,
    maxWidth: '100%',
    gap: Spacing.two,
  },
  tabPill: {
    minHeight: 38,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: Spacing.four,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tabPillText: {
    fontSize: 13,
  },
  claimCard: {
    padding: Spacing.four + 2,
    marginBottom: Spacing.three,
  },
  claimTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  claimAsunto: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  claimFecha: {
    fontSize: 12,
  },
  claimDescripcion: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.three,
  },
  evidenceGallery: {
    marginBottom: Spacing.three,
  },
  evidenceLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  evidenceImageFrame: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.two,
    backgroundColor: '#26322d',
  },
  evidencePhoto: {
    width: '100%',
    height: '100%',
  },
  responseBox: {
    borderLeftWidth: 4,
    padding: Spacing.three + 2,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.one,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  responseTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8fd6bb',
    flex: 1,
  },
  responseDate: {
    fontSize: 11,
    color: '#6fd0ae',
  },
  responseText: {
    fontSize: 13,
    color: '#cfe8dd',
    lineHeight: 19,
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two + 4,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.one,
  },
  pendingNoticeText: {
    fontSize: 12,
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
    maxWidth: 400,
  },
  formCard: {
    padding: Spacing.five,
  },
  cardCompact: {
    padding: Spacing.four,
  },
  formHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  formSubheading: {
    fontSize: 13,
    marginBottom: Spacing.four,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.three,
  },
  errorBoxText: {
    fontSize: 13,
    fontWeight: '600',
  },
  evidenceUploadSection: {
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  uploadSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  uploadSectionSubtitle: {
    fontSize: 12,
  },
  previewSection: {
    marginTop: Spacing.three,
  },
  previewCountText: {
    fontSize: 12,
    marginBottom: 6,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  previewThumbBox: {
    position: 'relative',
  },
  previewThumb: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: '#26322d',
  },
  removeThumbBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
