import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

const COMPACT_WIDTH = 480;

interface ScreenProps {
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  children: React.ReactNode;
}

// Contenedor común de las pantallas: layout responsive, scroll, cabecera y pull-to-refresh.
export const Screen: React.FC<ScreenProps> = ({
  title,
  subtitle,
  headerRight,
  refreshing = false,
  onRefresh,
  children,
}) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_WIDTH;

  return (
    <ResponsiveLayout>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          // Solo se tocan horizontal y arriba: paddingVertical pisaría el paddingBottom
          // que reserva el espacio de la barra de navegación inferior.
          compact && { paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
        }>
        <View style={styles.wrapper}>
          {compact ? (
            // Móvil: título + botón en una fila y la descripción debajo, a todo el ancho.
            <View style={styles.headerCompact}>
              <View style={styles.headerCompactRow}>
                <Text style={[styles.title, styles.titleCompact, { color: theme.text }]}>{title}</Text>
                {headerRight ? (
                  <View style={styles.headerCompactAction}>
                    {/* En móvil el botón de la cabecera se reduce para caber junto al título */}
                    {React.isValidElement(headerRight)
                      ? React.cloneElement(headerRight as React.ReactElement<{ size?: string }>, { size: 'sm' })
                      : headerRight}
                  </View>
                ) : null}
              </View>
              {subtitle ? (
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.header}>
              <View style={{ flex: 1, minWidth: 220 }}>
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                {subtitle ? (
                  <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
                ) : null}
              </View>
              {headerRight}
            </View>
          )}
          {children}
        </View>
      </ScrollView>
    </ResponsiveLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    paddingBottom: 120, // deja espacio para la barra de navegación inferior en móvil
  },
  wrapper: { width: '100%', maxWidth: MaxContentWidth },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  headerCompact: { marginBottom: Spacing.three },
  // Título y botón siempre en la misma fila: el título se encoge y salta de línea si hace falta.
  headerCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerCompactAction: { flexShrink: 0 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, flexShrink: 1 },
  titleCompact: { fontSize: 20 },
  subtitle: { fontSize: 13, marginTop: 6, lineHeight: 18, maxWidth: 600 },
});
