import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FilterChips } from '@/components/ui/FilterChips';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { serviciosService } from '@/services/servicios.service';
import { CategoriaServicio, Servicio } from '@/types';
import { formatSoles } from '@/utils/dialog';

export default function ServiciosScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [categorias, setCategorias] = useState<CategoriaServicio[]>([]);
  const [categoria, setCategoria] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) router.replace('/admin-servicios');
  }, [isAdmin, router]);

  const load = useCallback(async () => {
    try {
      const [srv, cats] = await Promise.all([
        serviciosService.listar(),
        serviciosService.listarCategorias(),
      ]);
      setServicios(srv);
      setCategorias(cats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) load();
  }, [isAuthenticated, isAdmin, load]);

  if (isAdmin) return null;

  const visibles =
    categoria === 'todas' ? servicios : servicios.filter((s) => s.id_categoria === categoria);

  return (
    <Screen
      title="Nuestros Servicios"
      subtitle="Elige el servicio para tu vehículo. Algunos requieren adjuntar un documento firmado antes de programarse."
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      headerRight={
        <Button
          title="Mis documentos"
          variant="secondary"
          icon={<Ionicons name="document-text-outline" size={16} color={theme.accentDark} />}
          onPress={() => router.push('/documentos')}
        />
      }>
      <FilterChips
        value={categoria}
        onChange={setCategoria}
        options={[
          { value: 'todas', label: 'Todas' },
          ...categorias.map((c) => ({ value: c.id_categoria_servicio, label: c.categoria_servicio })),
        ]}
      />

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: Spacing.five }} />
      ) : error ? (
        <Card style={styles.empty}>
          <Text style={{ color: theme.danger, marginBottom: Spacing.three }}>{error}</Text>
          <Button title="Reintentar" onPress={load} />
        </Card>
      ) : visibles.length === 0 ? (
        <Card style={styles.empty}>
          <Ionicons name="water-outline" size={44} color={theme.textSecondary} />
          <Text style={{ color: theme.textSecondary, marginTop: Spacing.two }}>
            No hay servicios disponibles en esta categoría.
          </Text>
        </Card>
      ) : (
        <View style={styles.grid}>
          {visibles.map((s) => (
            <Card key={s.id_servicio} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={[styles.name, { color: theme.text }]}>{s.nombre}</Text>
                <Text style={[styles.price, { color: theme.accent }]}>{formatSoles(s.precio)}</Text>
              </View>
              {s.categoria ? (
                <Text style={{ color: theme.textTertiary, fontSize: 12 }}>{s.categoria}</Text>
              ) : null}
              {s.descripcion ? (
                <Text style={[styles.desc, { color: theme.textSecondary }]}>{s.descripcion}</Text>
              ) : null}
              <View style={styles.meta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={15} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                    {s.duracion_estimada_min} min
                  </Text>
                </View>
                {s.requiere_documento ? (
                  <Badge label="Requiere documento firmado" status="pendiente" size="sm" />
                ) : (
                  <Badge label="Sin documentación" status="disponible" size="sm" />
                )}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.three }}>
                <Button
                  title="Reservar"
                  size="sm"
                  onPress={() =>
                    router.push({ pathname: '/nueva-reserva', params: { servicios: s.id_servicio } })
                  }
                />
                {s.requiere_documento ? (
                  <Button
                    title="Adjuntar documento"
                    size="sm"
                    variant="outline"
                    onPress={() =>
                      router.push({ pathname: '/documentos', params: { id_servicio: s.id_servicio } })
                    }
                  />
                ) : null}
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  card: { flexGrow: 1, flexBasis: 300, padding: Spacing.four, marginBottom: 0 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  name: { fontSize: 17, fontWeight: '800', flex: 1 },
  price: { fontSize: 17, fontWeight: '900' },
  desc: { fontSize: 13, lineHeight: 18, marginTop: Spacing.two },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  empty: { alignItems: 'center', padding: Spacing.five },
});
