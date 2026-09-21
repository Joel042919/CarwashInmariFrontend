import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Pressable,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Colors, BorderRadius, Spacing, MaxContentWidth } from '@/constants/theme';
import { reclamosService } from '@/services/reclamos.service';
import { clienteService } from '@/services/cliente.service';
import { Reclamo, HistorialClienteUnificado } from '@/types';

export default function DashboardScreen() {
  const { isTrabajador } = useAuth();
  if (isTrabajador) return <Redirect href="/mis-asignaciones" />;
  return <DashboardContent />;
}

function DashboardContent() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user, token, isAuthenticated, isAdmin } = useAuth();

  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [historial, setHistorial] = useState<HistorialClienteUnificado | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [showMoreAccess, setShowMoreAccess] = useState(false);

  const loadData = async () => {
    // Protección contra llamadas sin token
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    try {
      if (isAdmin) {
        const data = await reclamosService.getAdminReclamos();
        setReclamos(data);
      } else {
        const [recs, hist] = await Promise.all([
          reclamosService.getMisReclamos().catch(() => []),
          clienteService.getHistorial().catch(() => null),
        ]);
        setReclamos(recs);
        if (hist) setHistorial(hist);
      }
    } catch (err) {
      console.error('Error cargando datos de dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      loadData();
    }
  }, [isAuthenticated, token, isAdmin]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const reclamosPendientes = reclamos.filter(
    (r) => r.estado === 'registrado' || r.estado === 'en_revision'
  ).length;

  const ultimaReserva = historial?.reservas?.[0];
  const ultimoPago = historial?.pagos?.[0];
  const moreAccess = isAdmin
    ? [
        { name: 'Reservas', href: '/admin-reservas', icon: 'calendar-outline' },
        { name: 'Espacios y horarios', href: '/admin-espacios', icon: 'grid-outline' },
        { name: 'Trabajadores', href: '/admin-trabajadores', icon: 'people-outline' },
        { name: 'Productos', href: '/admin-productos', icon: 'cube-outline' },
        { name: 'Pedidos', href: '/admin-pedidos', icon: 'receipt-outline' },
        { name: 'Documentos', href: '/admin-documentos', icon: 'document-text-outline' },
        { name: 'Reportes', href: '/admin-reportes', icon: 'bar-chart-outline' },
        { name: 'Reclamos', href: '/admin-reclamos', icon: 'chatbubble-ellipses-outline' },
      ] as const
    : [
        { name: 'Nueva reserva', href: '/nueva-reserva', icon: 'add-circle-outline' },
        { name: 'Mis reservas', href: '/reservas', icon: 'calendar-outline' },
        { name: 'Vehículos', href: '/vehiculos', icon: 'car-sport-outline' },
        { name: 'Historial', href: '/historial', icon: 'time-outline' },
        { name: 'Productos', href: '/productos', icon: 'cart-outline' },
        { name: 'Pedidos', href: '/pedidos', icon: 'receipt-outline' },
        { name: 'Documentos', href: '/documentos', icon: 'document-text-outline' },
        { name: 'Reclamos', href: '/reclamos', icon: 'chatbubble-ellipses-outline' },
      ] as const;

  return (
    <ResponsiveLayout>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.contentWrapper}>
          {/* Header Title Section (Estilo Tableau de bord) */}
          <View style={styles.topHeaderSection}>
            <View style={styles.headerText}>
              <Text style={[styles.mainHeading, { color: theme.text }]}>
                {isAdmin ? 'Panel de Administración' : 'Centro de Atención Vehicular'}
              </Text>
              <Text style={[styles.mainSubheading, { color: theme.textSecondary }]}>
                {isAdmin
                  ? 'Gestión integral operativa, supervisión de clientes y resolución de reclamos.'
                  : 'Bienvenido a Carwash Inmari. Supervisa el estado de tu vehículo en tiempo real.'}
              </Text>
            </View>

            <View style={styles.categoryPillsRow}>
              {(isAdmin
                ? ['todos', 'servicios', 'admin-reclamos', 'pagos']
                : ['todos', 'servicios', 'reclamos', 'pagos']
              ).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => {
                    setSelectedFilter(tab);
                    if (tab === 'reclamos') router.push('/reclamos');
                    if (tab === 'admin-reclamos') router.push('/admin-reclamos');
                    if (tab === 'servicios') router.push(isAdmin ? '/admin-servicios' : '/servicios');
                    if (tab === 'pagos') router.push(isAdmin ? '/admin-pagos' : '/mis-pagos');
                  }}
                  style={[
                    styles.categoryPill,
                    selectedFilter === tab
                      ? { backgroundColor: theme.primary, borderColor: theme.primary }
                      : { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}>
                  <Text
                    style={[
                      styles.categoryPillText,
                      {
                        color: selectedFilter === tab ? '#ffffff' : theme.textSecondary,
                        fontWeight: selectedFilter === tab ? '800' : '600',
                      },
                    ]}>
                    {tab === 'admin-reclamos' ? 'ADMIN RECLAMOS' : tab.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Card style={styles.moreAccessCard}>
            <Pressable onPress={() => setShowMoreAccess((value) => !value)} style={styles.moreAccessHeader}>
              <View><Text style={[styles.moreAccessTitle, { color: theme.text }]}>Más accesos</Text><Text style={{ color: theme.textSecondary, fontSize: 12 }}>Herramientas disponibles para tu perfil</Text></View>
              <Ionicons name={showMoreAccess ? 'chevron-up' : 'chevron-down'} size={22} color={theme.accent} />
            </Pressable>
            {showMoreAccess && <View style={styles.moreAccessGrid}>{moreAccess.map((item) => <Pressable key={item.href} onPress={() => router.push(item.href)} style={[styles.moreAccessItem, { backgroundColor: theme.surface, borderColor: theme.border }]}><Ionicons name={item.icon} size={22} color={theme.accent} /><Text style={[styles.moreAccessName, { color: theme.text }]}>{item.name}</Text></Pressable>)}</View>}
          </Card>

          {/* HERO CAR CARD (Copiando el Hero de Volvo EX30 / BMW en capturas) */}
          <Card style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <Badge
                label={isAdmin ? 'Plataforma Administrativa' : 'Vehículo en Atención'}
                status="completada"
                showDot={true}
              />
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={13} color="#d9a441" />
                <Text style={styles.ratingText}>4.98 Calidad</Text>
              </View>
            </View>

            <View style={styles.heroContentRow}>
              <View style={styles.heroInfoCol}>
                <Text style={[styles.heroCarTitle, { color: theme.text }]}>
                  {isAdmin ? 'Carwash Inmari Central' : 'Toyota Corolla Cross'}
                </Text>
                <Text style={[styles.heroCarSubtitle, { color: theme.textSecondary }]}>
                  {isAdmin
                    ? 'Supervisión en vivo de servicios, módulos y resolución de quejas'
                    : 'Placa: T3A-456 • Lavado Premium & Secado Interior'}
                </Text>

                <View style={styles.heroSpecTagsRow}>
                  <View style={[styles.specTag, { backgroundColor: theme.surface }]}>
                    <Ionicons name="shield-checkmark" size={14} color={theme.accent} />
                    <Text style={[styles.specTagText, { color: theme.text }]}>
                      Garantía 100%
                    </Text>
                  </View>
                  <View style={[styles.specTag, { backgroundColor: theme.surface }]}>
                    <Ionicons name="water" size={14} color={theme.sky} />
                    <Text style={[styles.specTagText, { color: theme.text }]}>
                      Cera Hidrofóbica
                    </Text>
                  </View>
                  <View style={[styles.specTag, { backgroundColor: theme.surface }]}>
                    <Ionicons name="sparkles" size={14} color="#d9a441" />
                    <Text style={[styles.specTagText, { color: theme.text }]}>
                      Secado por Aire
                    </Text>
                  </View>
                </View>

                <View style={styles.heroActionRow}>
                  {isAdmin ? (
                    <Button
                      title="Gestionar Reclamos"
                      icon={<Ionicons name="arrow-forward" size={16} color="#ffffff" />}
                      iconPosition="right"
                      onPress={() => router.push('/admin-reclamos')}
                    />
                  ) : (
                    <Button
                      title="Radicar Reclamo con Foto"
                      icon={<Ionicons name="camera" size={16} color="#ffffff" />}
                      iconPosition="left"
                      onPress={() => router.push('/reclamos')}
                    />
                  )}
                  <Button
                    title="Ver Historial"
                    variant="secondary"
                    onPress={() => router.push('/historial')}
                  />
                </View>
              </View>

              {/* Imagen elegante de auto estilizado */}
              <View style={styles.heroImageWrapper}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80',
                  }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          </Card>

          {/* FILA DE MÉTRICAS CLAVE (Estilo Bento Grid 3 cards) */}
          <View style={styles.metricsRow}>
            <Card style={styles.metricCard}>
              <View style={[styles.metricIconBox, { backgroundColor: theme.surface }]}>
                <Ionicons name="calendar-outline" size={22} color={theme.text} />
              </View>
              <Text style={[styles.metricNumber, { color: theme.text }]}>
                {historial?.reservas?.length || (isAdmin ? 24 : 1)}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Reservas y atenciones
              </Text>
            </Card>

            <Card style={styles.metricCard}>
              <View style={[styles.metricIconBox, { backgroundColor: theme.surface }]}>
                <Ionicons name="shield-checkmark-outline" size={22} color={theme.accent} />
              </View>
              <Text style={[styles.metricNumber, { color: theme.text }]}>
                98%
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Índice de satisfacción
              </Text>
            </Card>

            <Pressable
              style={{ flex: 1, minWidth: 140 }}
              onPress={() => router.push(isAdmin ? '/admin-reclamos' : '/reclamos')}>
              <Card style={styles.metricCard}>
                <View style={[styles.metricIconBox, { backgroundColor: theme.surface }]}>
                  <Ionicons name="chatbox-ellipses-outline" size={22} color={theme.danger} />
                </View>
                <Text style={[styles.metricNumber, { color: theme.text }]}>
                  {reclamosPendientes}
                </Text>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  {isAdmin ? 'Reclamos por atender' : 'Reclamos en revisión'}
                </Text>
              </Card>
            </Pressable>
          </View>

          {/* BENTO GRID: 3 COLUMNAS MODULARES (Sede, Cita/Reserva, Pago) */}
          <View style={styles.bentoGrid}>
            {/* Bento 1: Sede y Ubicación */}
            <Card style={styles.bentoCard}>
              <View style={styles.bentoHeader}>
                <Text style={[styles.bentoTitle, { color: theme.text }]}>
                  Bahía de Atención
                </Text>
                <Ionicons name="navigate-circle-outline" size={20} color={theme.textSecondary} />
              </View>
              <Text style={[styles.bentoSubtitle, { color: theme.textSecondary }]}>
                Sede Central Carwash Inmari
              </Text>

              <View style={[styles.mapPlaceholder, { backgroundColor: theme.surface }]}>
                <Ionicons name="location" size={28} color={theme.accent} />
                <Text style={[styles.mapText, { color: theme.text }]}>
                  Av. América Norte 1245, Trujillo
                </Text>
                <Text style={[styles.mapSubtext, { color: theme.textSecondary }]}>
                  Bahía Techada BOX-01 • Hidrolavadoras 180 Bar
                </Text>
              </View>
            </Card>

            {/* Bento 2: Próxima Cita / Horario */}
            <Card style={styles.bentoCard}>
              <View style={styles.bentoHeader}>
                <Text style={[styles.bentoTitle, { color: theme.text }]}>
                  Atención Registrada
                </Text>
                <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
              </View>
              <Text style={[styles.bentoSubtitle, { color: theme.textSecondary }]}>
                {ultimaReserva ? `Placa: ${ultimaReserva.placa_vehiculo}` : 'Horario de programación'}
              </Text>

              <View style={styles.dateBlock}>
                <View style={[styles.dateBigPill, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.dateDayNumber, { color: theme.text }]}>
                    {ultimaReserva?.fecha_reserva ? ultimaReserva.fecha_reserva.slice(8, 10) : '17'}
                  </Text>
                  <Text style={[styles.dateMonthText, { color: theme.textSecondary }]}>
                    SET. 2026
                  </Text>
                </View>

                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={[styles.dateHourText, { color: theme.text }]}>
                    {ultimaReserva ? `${ultimaReserva.hora_inicio.slice(0, 5)} - ${ultimaReserva.hora_fin.slice(0, 5)}` : '10:00 - 11:00 AM'}
                  </Text>
                  <Badge
                    label={ultimaReserva?.estado || 'Finalizada'}
                    status={ultimaReserva?.estado || 'completada'}
                    size="sm"
                  />
                </View>
              </View>
            </Card>

            {/* Bento 3: Método de Pago (Estilo Tarjeta Luxury en capturas) */}
            <Card style={[styles.bentoCard, styles.paymentCard]}>
              <View style={styles.bentoHeader}>
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>
                  Comprobante y Pago
                </Text>
                <Ionicons name="card" size={20} color="#6fd0ae" />
              </View>

              <Text style={{ color: '#9bd8c1', fontSize: 12, marginTop: 4 }}>
                {ultimoPago ? `Comprobante: ${ultimoPago.comprobante_interno}` : 'Comprobante interno emitido'}
              </Text>

              <View style={styles.paymentCardChipRow}>
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: 1.5 }}>
                  **** **** 2468
                </Text>
                <Text style={{ color: '#6fd0ae', fontSize: 18, fontWeight: '800' }}>
                  S/ {ultimoPago?.monto ? ultimoPago.monto.toFixed(2) : '45.00'}
                </Text>
              </View>

              <Button
                title="Ver Mis Comprobantes"
                variant="accent"
                size="sm"
                onPress={() => router.push('/historial')}
                style={{ marginTop: Spacing.two }}
              />
            </Card>
          </View>
        </View>
      </ScrollView>
    </ResponsiveLayout>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
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
  topHeaderSection: {
    marginBottom: Spacing.four,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  mainHeading: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  mainSubheading: {
    fontSize: 13,
    marginTop: 4,
    maxWidth: 550,
    lineHeight: 18,
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
    paddingVertical: 8,
    paddingHorizontal: Spacing.three + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  moreAccessCard: { padding: Spacing.four, marginBottom: Spacing.four },
  moreAccessHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  moreAccessTitle: { fontSize: 17, fontWeight: '800' },
  moreAccessGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.three },
  moreAccessItem: { flexGrow: 1, flexBasis: 145, minHeight: 82, borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.three, gap: 6, justifyContent: 'center' },
  moreAccessName: { fontWeight: '700', fontSize: 13 },

  // Hero Car Card
  heroCard: {
    padding: Spacing.five,
    marginBottom: Spacing.four,
  },
  heroTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(217, 164, 65, 0.16)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e2b65c',
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.four,
  },
  // flexBasis decide cuándo la imagen salta de línea; flexShrink/minWidth evitan que el
  // contenido se desborde en pantallas de menos de 300px de ancho útil.
  heroInfoCol: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 260,
    minWidth: 0,
  },
  heroCarTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  heroCarSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.three,
  },
  heroSpecTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  specTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  specTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  heroImageWrapper: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 220,
    maxWidth: 320,
    minWidth: 0,
    height: 160,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.lg,
  },

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.four,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 160,
    padding: Spacing.four,
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  metricIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  metricNumber: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Bento Grid
  bentoGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
    flexWrap: 'wrap',
  },
  bentoCard: {
    flex: 1,
    minWidth: 260,
    padding: Spacing.four,
    marginBottom: 0,
  },
  bentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  bentoSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: Spacing.three,
  },
  mapPlaceholder: {
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  mapText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  mapSubtext: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  dateBigPill: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    minWidth: 70,
  },
  dateDayNumber: {
    fontSize: 24,
    fontWeight: '900',
  },
  dateMonthText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateHourText: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },

  // Payment Card (Dark luxury)
  paymentCard: {
    backgroundColor: '#12352b',
    borderColor: '#1f5a48',
  },
  paymentCardChipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.three,
  },
});
