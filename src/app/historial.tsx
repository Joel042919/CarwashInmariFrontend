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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconText } from '@/components/ui/IconText';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Colors, BorderRadius, Spacing, MaxContentWidth } from '@/constants/theme';
import { clienteService } from '@/services/cliente.service';
import { useAuth } from '@/context/AuthContext';
import {
  HistorialClienteUnificado,
  ReservaHistorial,
  AtencionHistorial,
  PagoHistorial,
  PedidoHistorial,
} from '@/types';

type TabType = 'reservas' | 'atenciones' | 'pagos' | 'pedidos';

export default function HistorialScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { isAuthenticated, token } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('reservas');
  const [data, setData] = useState<HistorialClienteUnificado | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistorial = async () => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    try {
      const resp = await clienteService.getHistorial();
      setData(resp);
    } catch (err) {
      console.error('Error cargando historial:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      loadHistorial();
    }
  }, [isAuthenticated, token]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistorial();
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
                Historial de Servicios
              </Text>
              <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
                RF-02: Trazabilidad integral de tus reservas, atenciones, pagos y compras de productos
              </Text>
            </View>

            {/* Category Pills (Estilo All Car / Bmw / Toyota) */}
            <View style={styles.categoryPillsRow}>
              {(['reservas', 'atenciones', 'pagos', 'pedidos'] as TabType[]).map((t) => {
                const count =
                  t === 'reservas'
                    ? data?.reservas?.length || 0
                    : t === 'atenciones'
                    ? data?.atenciones?.length || 0
                    : t === 'pagos'
                    ? data?.pagos?.length || 0
                    : data?.pedidos?.length || 0;

                const label =
                  t === 'reservas'
                    ? 'Reservas'
                    : t === 'atenciones'
                    ? 'Atenciones'
                    : t === 'pagos'
                    ? 'Pagos'
                    : 'Compras';

                const active = activeTab === t;

                return (
                  <Pressable
                    key={t}
                    onPress={() => setActiveTab(t)}
                    style={[
                      styles.categoryPill,
                      active
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    ]}>
                    <Text
                      style={[
                        styles.categoryPillText,
                        {
                          color: active ? '#ffffff' : theme.textSecondary,
                          fontWeight: active ? '800' : '600',
                        },
                      ]}>
                      {label} ({count})
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Contenido de la pestaña */}
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={theme.text} />
              <Text style={{ marginTop: 10, color: theme.textSecondary }}>
                Cargando historial unificado...
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: Spacing.two }}>
              {/* TAB 1: RESERVAS */}
              {activeTab === 'reservas' && (
                <>
                  {!data?.reservas || data.reservas.length === 0 ? (
                    <EmptyState
                      icon="calendar-outline"
                      title="No tienes reservas registradas"
                      subtitle="Tus reservas programadas y anteriores aparecerán aquí."
                      theme={theme}
                    />
                  ) : (
                    data.reservas.map((item: ReservaHistorial) => (
                      <Card key={item.id_reserva} style={styles.itemCard}>
                        <View style={styles.cardHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, flex: 1, minWidth: 0 }}>
                            <View style={[styles.iconCircle, { backgroundColor: theme.surface }]}>
                              <Ionicons name="car-sport" size={22} color={theme.text} />
                            </View>
                            <View style={{ flexShrink: 1 }}>
                              <Text style={[styles.itemTitle, { color: theme.text }]}>
                                {item.modelo} ({item.placa_vehiculo})
                              </Text>
                              <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
                                Bahía de lavado: {item.codigo_espacio}
                              </Text>
                            </View>
                          </View>
                          <Badge label={item.estado} status={item.estado} />
                        </View>

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        <View style={styles.cardFooter}>
                          <View style={styles.footerInline}>
                            <IconText icon="calendar-outline" style={[styles.footerDetail, { color: theme.textSecondary }]}>
                              {item.fecha_reserva.split('T')[0]}
                            </IconText>
                            <Text style={[styles.footerDetail, { color: theme.textSecondary }]}>•</Text>
                            <IconText icon="time-outline" style={[styles.footerDetail, { color: theme.textSecondary }]}>
                              {item.hora_inicio.slice(0, 5)} - {item.hora_fin.slice(0, 5)}
                            </IconText>
                          </View>
                          <Text style={[styles.footerPrice, { color: theme.text }]}>
                            S/ {item.total_estimado?.toFixed(2)}
                          </Text>
                        </View>
                      </Card>
                    ))
                  )}
                </>
              )}

              {/* TAB 2: ATENCIONES */}
              {activeTab === 'atenciones' && (
                <>
                  {!data?.atenciones || data.atenciones.length === 0 ? (
                    <EmptyState
                      icon="construct-outline"
                      title="No hay atenciones en registro"
                      subtitle="Cuando tu vehículo ingrese a bahía de lavado, verás el estado en vivo."
                      theme={theme}
                    />
                  ) : (
                    data.atenciones.map((item: AtencionHistorial) => (
                      <Card key={item.id_atencion} style={styles.itemCard}>
                        <View style={styles.cardHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, flex: 1, minWidth: 0 }}>
                            <View style={[styles.iconCircle, { backgroundColor: theme.surface }]}>
                              <Ionicons name="sparkles" size={22} color={theme.accent} />
                            </View>
                            <View style={{ flexShrink: 1 }}>
                              <Text style={[styles.itemTitle, { color: theme.text }]}>
                                Atención en Bahía ({item.placa_vehiculo})
                              </Text>
                              <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
                                ID Atención: {item.id_atencion.slice(0, 8)}...
                              </Text>
                            </View>
                          </View>
                          <Badge label={item.estado} status={item.estado} />
                        </View>

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        <View style={styles.cardFooter}>
                          <IconText icon="timer-outline" style={[styles.footerDetail, { color: theme.textSecondary }]}>
                            Inicio:{' '}
                            {item.fecha_inicio_real
                              ? new Date(item.fecha_inicio_real).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Por iniciar'}
                          </IconText>
                          <IconText icon="flag-outline" style={[styles.footerDetail, { color: theme.textSecondary }]}>
                            Entrega:{' '}
                            {item.fecha_fin_real
                              ? new Date(item.fecha_fin_real).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'En proceso de secado'}
                          </IconText>
                        </View>
                      </Card>
                    ))
                  )}
                </>
              )}

              {/* TAB 3: PAGOS */}
              {activeTab === 'pagos' && (
                <>
                  {!data?.pagos || data.pagos.length === 0 ? (
                    <EmptyState
                      icon="receipt-outline"
                      title="No se encontraron pagos"
                      subtitle="Los comprobantes y pagos cancelados se registrarán aquí."
                      theme={theme}
                    />
                  ) : (
                    data.pagos.map((item: PagoHistorial) => (
                      <Card key={item.id_pago} style={styles.itemCard}>
                        <View style={styles.cardHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, flex: 1, minWidth: 0 }}>
                            <View style={[styles.iconCircle, { backgroundColor: theme.surface }]}>
                              <Ionicons name="card" size={22} color={theme.accent} />
                            </View>
                            <View style={{ flexShrink: 1 }}>
                              <Text style={[styles.itemTitle, { color: theme.text }]}>
                                Comprobante {item.comprobante_interno}
                              </Text>
                              <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
                                Método:{' '}
                                <Text style={{ textTransform: 'capitalize', fontWeight: '600' }}>
                                  {item.metodo.replace('_', ' ')}
                                </Text>
                              </Text>
                            </View>
                          </View>
                          <Badge label={item.estado} status={item.estado} />
                        </View>

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        <View style={styles.cardFooter}>
                          <IconText icon="calendar-outline" style={[styles.footerDetail, { color: theme.textSecondary }]}>
                            {item.fecha_pago ? new Date(item.fecha_pago).toLocaleDateString() : '-'}
                          </IconText>
                          <Text style={[styles.footerPrice, { color: theme.accent }]}>
                            S/ {item.monto?.toFixed(2)}
                          </Text>
                        </View>
                      </Card>
                    ))
                  )}
                </>
              )}

              {/* TAB 4: COMPRAS */}
              {activeTab === 'pedidos' && (
                <>
                  {!data?.pedidos || data.pedidos.length === 0 ? (
                    <EmptyState
                      icon="bag-handle-outline"
                      title="Sin compras de productos"
                      subtitle="Tus compras de aditivos y productos de estética vehicular aparecerán aquí."
                      theme={theme}
                    />
                  ) : (
                    data.pedidos.map((item: PedidoHistorial) => (
                      <Card key={item.id_pedido} style={styles.itemCard}>
                        <View style={styles.cardHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, flex: 1, minWidth: 0 }}>
                            <View style={[styles.iconCircle, { backgroundColor: theme.surface }]}>
                              <Ionicons name="bag-check" size={22} color={theme.accent} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.itemTitle, { color: theme.text }]}>
                                Pedido #{item.id_pedido.slice(0, 8)}
                              </Text>
                              {item.observaciones ? (
                                <Text
                                  numberOfLines={2}
                                  style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
                                  {item.observaciones}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                          <Badge label={item.estado} status={item.estado} />
                        </View>

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        <View style={styles.cardFooter}>
                          <IconText icon="calendar-outline" style={[styles.footerDetail, { color: theme.textSecondary }]}>
                            {item.fecha_registro ? new Date(item.fecha_registro).toLocaleDateString() : '-'}
                          </IconText>
                          <Text style={[styles.footerPrice, { color: theme.text }]}>
                            Total: S/ {item.total?.toFixed(2)}
                          </Text>
                        </View>
                      </Card>
                    ))
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </ResponsiveLayout>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  theme: any;
}) {
  return (
    <Card style={styles.emptyCard}>
      <Ionicons name={icon} size={48} color={theme.textSecondary} style={{ marginBottom: Spacing.two }} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
    </Card>
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
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flexShrink: 1,
    maxWidth: '100%',
    gap: Spacing.two,
  },
  categoryPill: {
    minHeight: 38,
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: Spacing.four,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 13,
  },
  itemCard: {
    padding: Spacing.four + 2,
    marginBottom: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.three,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerDetail: {
    fontSize: 13,
    fontWeight: '500',
  },
  footerInline: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    flexShrink: 1,
  },
  footerPrice: {
    fontSize: 17,
    fontWeight: '900',
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
