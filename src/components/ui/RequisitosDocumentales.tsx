import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing } from '@/constants/theme';
import { documentosService } from '@/services/documentos.service';
import { RequisitosReserva } from '@/types';
import { badgeStatus, errorMessage } from '@/utils/dialog';

interface Props {
  idReserva: string;
  /** Se llama con `puede_confirmarse` cada vez que se consulta el estado. */
  onChange?: (puedeConfirmarse: boolean) => void;
}

// Muestra los documentos previos que exige una reserva (RF-07) y su estado.
// Pensado para usarse dentro de la pantalla de reservas: <RequisitosDocumentales idReserva={id} />.
// No muestra nada si la reserva no tiene servicios que exijan documento.
export const RequisitosDocumentales: React.FC<Props> = ({ idReserva, onChange }) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  const [data, setData] = useState<RequisitosReserva | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await documentosService.requisitosReserva(idReserva);
      setData(res);
      setError(null);
      onChange?.(res.puede_confirmarse);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo consultar la documentación de la reserva'));
    } finally {
      setLoading(false);
    }
  }, [idReserva, onChange]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  if (loading) return <ActivityIndicator color={theme.accent} style={{ marginVertical: Spacing.three }} />;

  if (error) {
    return (
      <Card style={styles.card}>
        <Text style={{ color: theme.danger }}>{error}</Text>
      </Card>
    );
  }

  if (!data || data.requisitos.length === 0) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons
          name={data.puede_confirmarse ? 'checkmark-circle' : 'document-text-outline'}
          size={22}
          color={data.puede_confirmarse ? theme.success : theme.warning}
        />
        <Text style={[styles.title, { color: theme.text }]}>
          {data.puede_confirmarse
            ? 'Documentación completa'
            : 'Esta reserva requiere documentos firmados'}
        </Text>
      </View>

      {data.requisitos.map((r) => {
        const estado = r.estado_documento ?? 'sin enviar';
        const puedeAdjuntar = !r.estado_documento || r.estado_documento === 'rechazado';
        return (
          <View key={r.id_servicio} style={styles.row}>
            <View style={styles.rowTop}>
              <Text style={[styles.service, { color: theme.text }]}>{r.nombre_servicio}</Text>
              <Badge label={estado} status={badgeStatus(estado)} size="sm" />
            </View>
            {puedeAdjuntar && (
              <Button
                title={r.estado_documento === 'rechazado' ? 'Volver a adjuntar' : 'Adjuntar documento'}
                size="sm"
                variant="outline"
                onPress={() =>
                  router.push({
                    pathname: '/documentos',
                    params: { id_reserva: idReserva, id_servicio: r.id_servicio },
                  })
                }
              />
            )}
          </View>
        );
      })}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { padding: Spacing.four, marginBottom: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.three },
  title: { fontSize: 15, fontWeight: '800', flexShrink: 1 },
  row: { gap: Spacing.two, marginBottom: Spacing.three },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  service: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
});
