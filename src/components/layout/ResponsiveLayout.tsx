import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  useColorScheme,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { canAccessRoute } from '@/constants/access';
import { Colors, BREAKPOINT_DESKTOP, Spacing, BorderRadius, MaxContentWidth } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';

interface NavItem {
  name: string;
  href: string;
  iconName: keyof typeof Ionicons.glyphMap;
  activeIconName: keyof typeof Ionicons.glyphMap;
  adminOnly?: boolean;
  clientOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Inicio', href: '/', iconName: 'home-outline', activeIconName: 'home' },
  { name: 'Mis asignaciones', href: '/mis-asignaciones', iconName: 'clipboard-outline', activeIconName: 'clipboard' },
  { name: 'Atenciones', href: '/atenciones', iconName: 'car-outline', activeIconName: 'car' },
  { name: 'Mis pagos', href: '/mis-pagos', iconName: 'card-outline', activeIconName: 'card' },
  { name: 'Historial', href: '/historial', iconName: 'car-sport-outline', activeIconName: 'car-sport' },
  { name: 'Reclamos', href: '/reclamos', iconName: 'chatbubble-ellipses-outline', activeIconName: 'chatbubble-ellipses', clientOnly: true },
  { name: 'Admin Reclamos', href: '/admin-reclamos', iconName: 'shield-checkmark-outline', activeIconName: 'shield-checkmark', adminOnly: true },
  { name: 'Servicios', href: '/servicios', iconName: 'water-outline', activeIconName: 'water', clientOnly: true },
  { name: 'Tienda', href: '/productos', iconName: 'cart-outline', activeIconName: 'cart', clientOnly: true },
  { name: 'Admin Servicios', href: '/admin-servicios', iconName: 'construct-outline', activeIconName: 'construct', adminOnly: true },
  { name: 'Admin Documentos', href: '/admin-documentos', iconName: 'document-text-outline', activeIconName: 'document-text', adminOnly: true },
  { name: 'Admin Productos', href: '/admin-productos', iconName: 'cube-outline', activeIconName: 'cube', adminOnly: true },
  { name: 'Admin Pedidos', href: '/admin-pedidos', iconName: 'receipt-outline', activeIconName: 'receipt', adminOnly: true },
  { name: 'Admin Pagos', href: '/admin-pagos', iconName: 'cash-outline', activeIconName: 'cash', adminOnly: true },
  { name: 'Admin Reportes', href: '/admin-reportes', iconName: 'bar-chart-outline', activeIconName: 'bar-chart', adminOnly: true },
  { name: 'Reservas', href: '/reservas', iconName: 'calendar-outline', activeIconName: 'calendar', clientOnly: true },
  { name: 'Vehículos', href: '/vehiculos', iconName: 'speedometer-outline', activeIconName: 'speedometer', clientOnly: true },
  { name: 'Admin Reservas', href: '/admin-reservas', iconName: 'calendar-outline', activeIconName: 'calendar', adminOnly: true },
  { name: 'Admin Espacios', href: '/admin-espacios', iconName: 'grid-outline', activeIconName: 'grid', adminOnly: true },
  { name: 'Admin Trabajadores', href: '/admin-trabajadores', iconName: 'id-card-outline', activeIconName: 'id-card', adminOnly: true },
  { name: 'Mi Perfil', href: '/perfil', iconName: 'person-outline', activeIconName: 'person' },
];

export const ResponsiveLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT_DESKTOP;
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, role, logout } = useAuth();

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!canAccessRoute(item.href, role)) return false;
    if (role === 'trabajador' && item.href === '/atenciones') return false;
    if (item.adminOnly && !isAdmin) return false;
    if (item.clientOnly && isAdmin) return false;
    return true;
  });

  // La barra móvil es deliberadamente corta: la navegación completa se ofrece con
  // icono y nombre desde el dashboard, evitando una tira horizontal difícil de usar.
  const mobileRoutes = role === 'trabajador'
    ? ['/mis-asignaciones']
    : isAdmin
      ? ['/', '/atenciones', '/admin-servicios', '/admin-pagos']
      : ['/', '/atenciones', '/servicios', '/mis-pagos'];
  const mobileNavItems = mobileRoutes
    .map((href) => filteredNavItems.find((item) => item.href === href))
    .filter((item): item is NavItem => Boolean(item));
  const insets = useSafeAreaInsets();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '';
    return pathname.startsWith(href);
  };

  const userInitials = (user?.nombre?.[0] || 'U') + (user?.apellido?.[0] || '');

  // -------------------------------------------------------------
  // VISTA DESKTOP: Floating Sidebar vertical + Top Bar + Bento Grid
  // -------------------------------------------------------------
  if (isDesktop) {
    return (
      <View style={[styles.desktopWrapper, { backgroundColor: theme.background }]}>
        {/* Floating Sidebar Pill (Estilo BMW Luxury Dark) */}
        <View style={styles.sidebarOuter}>
          <View
            style={[
              styles.floatingSidebar,
              {
                backgroundColor: theme.nav,
                borderColor: theme.nav,
              },
            ]}>
            {/* Logo Mark */}
            <Pressable
              onPress={() => router.push('/')}
              style={[styles.sidebarLogoBox, { backgroundColor: theme.navActive }]}>
              <Ionicons name="car-sport" size={22} color="#ffffff" />
            </Pressable>

            {/* Stack de Iconos de Navegación */}
            <ScrollView
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={styles.sidebarIconStack}
              showsVerticalScrollIndicator={false}>
              {filteredNavItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Pressable
                    key={item.href}
                    onPress={() => router.push(item.href as any)}
                    style={({ pressed }) => [
                      styles.sidebarIconBtn,
                      active && {
                        backgroundColor: '#ffffff',
                      },
                      pressed && { opacity: 0.8 },
                    ]}>
                    <Ionicons
                      name={active ? item.activeIconName : item.iconName}
                      size={22}
                      color={active ? theme.nav : theme.navText}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Separador entre la navegación y el botón de salir */}
            <View style={styles.sidebarDivider} />

            {/* Logout al pie del sidebar: fondo blanco e ícono rojo, igual que en móvil */}
            <Pressable
              onPress={logout}
              style={({ pressed }) => [
                styles.sidebarLogoutBtn,
                pressed && { backgroundColor: theme.dangerBg },
              ]}>
              <Ionicons name="log-out-outline" size={22} color={theme.danger} />
            </Pressable>
          </View>
        </View>

        {/* CONTENIDO PRINCIPAL CON HEADER SUPERIOR */}
        <View style={styles.desktopMain}>
          {/* Top Bar Desktop */}
          <View style={styles.desktopTopBar}>
            <View>
              <Text style={[styles.topBarTitle, { color: theme.text }]}>
                CARWASH INMARI
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <Badge label="Servicio Activo" status="completada" size="sm" />
                <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                  Sede Central Trujillo
                </Text>
              </View>
            </View>

            {/* Acciones de la derecha: Notificaciones y Perfil */}
            <View style={styles.topBarRight}>
              <Pressable
                style={[
                  styles.circleActionBtn,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <Ionicons name="notifications-outline" size={18} color={theme.text} />
              </Pressable>

              <Pressable
                onPress={() => router.push('/perfil')}
                style={[
                  styles.profilePillBtn,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <View style={[styles.userAvatarSm, { backgroundColor: theme.primary }]}>
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>
                    {userInitials.toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.profilePillName, { color: theme.text }]}>
                    {user?.nombre} {user?.apellido}
                  </Text>
                  <Text style={[styles.profilePillRole, { color: theme.textSecondary }]}>
                    {user?.rol}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Área de Pantalla */}
          <View style={styles.desktopScrollArea}>
            {children}
          </View>
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // VISTA MÓVIL / PWA / ANDROID: Header limpio + Floating Bottom Pill Nav
  // -------------------------------------------------------------
  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.mobileContainer, { backgroundColor: theme.background }]}>
      {/* Header Superior Móvil */}
      <View style={styles.mobileHeader}>
        <View style={styles.mobileHeaderBrand}>
          <View style={[styles.mobileLogoBox, { backgroundColor: theme.primary }]}>
            <Ionicons name="car-sport" size={18} color="#ffffff" />
          </View>
          <View>
            <Text style={[styles.mobileBrandTitle, { color: theme.text }]}>
              INMARI
            </Text>
            <Text style={[styles.mobileBrandSubtitle, { color: theme.textSecondary }]}>
              {user?.nombre || 'Usuario'} • <Text style={{ textTransform: 'capitalize' }}>{user?.rol}</Text>
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          <Pressable
            onPress={() => router.push('/perfil')}
            style={[styles.circleActionBtnSm, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Ionicons name="person-outline" size={17} color={theme.text} />
          </Pressable>
          <Pressable
            onPress={logout}
            style={[styles.circleActionBtnSm, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Ionicons name="log-out-outline" size={17} color={theme.danger} />
          </Pressable>
        </View>
      </View>

      {/* Contenedor de Pantalla con padding inferior para la barra flotante */}
      <View style={styles.mobileContentArea}>
        {children}
      </View>

      {/* Floating Bottom Navigation Bar (Estilo BMW Luxury Dark) */}
      <View
        style={[styles.floatingBottomNavContainer, { bottom: Math.max(Spacing.three, insets.bottom) }]}
        pointerEvents="box-none">
        <View
          style={[
            styles.floatingBottomNavPill,
            {
              backgroundColor: theme.nav,
              borderColor: theme.nav,
            },
          ]}>
          {(() => {
            const botones = mobileNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Pressable
                  key={item.href}
                  onPress={() => router.push(item.href as any)}
                  style={({ pressed }) => [
                    styles.floatingNavItem,
                    active && styles.floatingNavItemActive,
                    pressed && { opacity: 0.7 },
                  ]}>
                  <View
                    style={[
                      styles.navIconWrapper,
                      active && { backgroundColor: '#ffffff' },
                    ]}>
                    <Ionicons
                      name={active ? item.activeIconName : item.iconName}
                      size={20}
                      color={active ? theme.nav : theme.navText}
                    />
                  </View>
                </Pressable>
              );
            });
            return botones;
          })()}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Desktop
  desktopWrapper: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
  },
  sidebarOuter: {
    paddingVertical: Spacing.four,
    paddingLeft: Spacing.four,
  },
  floatingSidebar: {
    width: 80,
    height: '100%',
    borderRadius: BorderRadius.xl, // 24px rounded floating panel
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: Spacing.four,
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px -4px rgba(15, 23, 42, 0.05)',
      },
    }),
  },
  sidebarLogoBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  sidebarIconStack: {
    flexGrow: 1, // dentro de un ScrollView: centra los íconos y permite scroll si no caben
    paddingVertical: Spacing.two,
    gap: Spacing.two + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarIconBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarDivider: {
    width: 36,
    height: 1,
    backgroundColor: 'rgba(167, 243, 208, 0.35)',
    marginBottom: Spacing.three,
  },
  sidebarLogoutBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopMain: {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  desktopTopBar: {
    paddingHorizontal: Spacing.six,
    paddingTop: Spacing.four + 4,
    paddingBottom: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  circleActionBtn: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: Spacing.three,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.two,
  },
  userAvatarSm: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePillName: {
    fontSize: 13,
    fontWeight: '700',
  },
  profilePillRole: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  desktopScrollArea: {
    flex: 1,
    height: '100%',
  },

  // Mobile
  mobileContainer: {
    flex: 1,
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
  },
  mobileHeaderBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  mobileLogoBox: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileBrandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mobileBrandSubtitle: {
    fontSize: 11,
  },
  circleActionBtnSm: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileContentArea: {
    flex: 1,
  },
  floatingBottomNavContainer: {
    position: 'absolute',
    bottom: Spacing.three,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  floatingBottomNavPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: BorderRadius.full, // Floating Pill shape
    borderWidth: 1,
    alignSelf: 'center',
    minHeight: 54,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
      },
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
    }),
  },
  floatingNavItem: {
    width: 48,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingNavItemActive: {},
  navIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
