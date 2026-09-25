import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FilterChips } from '@/components/ui/FilterChips';
import { RequisitosDocumentales } from '@/components/ui/RequisitosDocumentales';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { documentosService } from '@/services/documentos.service';
import { serviciosService } from '@/services/servicios.service';
import { reservasService } from '@/services/reservas.service';
import { resolveMediaUrl } from '@/services/api';
import { DocumentoPrevio, Reserva, Servicio } from '@/types';
import { badgeStatus, errorMessage, notify } from '@/utils/dialog';

// Pantalla del cliente para RF-07. El flujo de reservas puede abrirla con
// /documentos?id_reserva=...&id_servicio=... para dejar el formulario prellenado.
export default function DocumentosScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{ id_reserva?: string; id_servicio?: string }>();

  const [documentos, setDocumentos] = useState<DocumentoPrevio[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [idReserva, setIdReserva] = useState(params.id_reserva ?? '');
  const [reservaAsociada, setReservaAsociada] = useState<Reserva | null>(null);
  const [idServicio, setIdServicio] = useState(params.id_servicio ?? '');
  const [archivo, setArchivo] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // fuerza a recargar el estado de la reserva

  useEffect(() => {
    if (isAdmin) router.replace('/admin-documentos');
  }, [isAdmin, router]);

  useEffect(() => {
    if (params.id_reserva) setIdReserva(params.id_reserva);
    if (params.id_servicio) setIdServicio(params.id_servicio);
  }, [params.id_reserva, params.id_servicio]);

  const load = useCallback(async () => {
    try {
      const [docs, srv, reservas] = await Promise.all([
        documentosService.misDocumentos(),
        serviciosService.listar(),
        reservasService.misReservas(),
      ]);
      setDocumentos(docs);
      setServicios(srv.filter((s) => s.requiere_documento));
      const reserva = params.id_reserva
        ? reservas.find((item) => item.id_reserva === params.id_reserva) ?? null
        : reservas.find((item) => item.requiere_documento && !['cancelada', 'completada'].includes(item.estado)) ?? null;
      setReservaAsociada(reserva);
      setIdReserva(reserva?.id_reserva ?? params.id_reserva ?? '');
    } catch (err) {
      notify('Error', errorMessage(err, 'No se pudieron cargar tus documentos'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.id_reserva]);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) load();
  }, [isAuthenticated, isAdmin, load]);

  if (isAdmin) return null;

  const elegirPdf = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf', copyToCacheDirectory: true, multiple: false,
    });
    if (!res.canceled && res.assets.length > 0) {
      const selected = res.assets[0];
      if (selected.size && selected.size > 10 * 1024 * 1024) {
        notify('Archivo muy grande', 'El PDF no puede superar los 10MB.');
        return;
      }
      setArchivo(selected);
    }
  };

  const enviar = async () => {
    if (!idReserva) return notify('Reserva requerida', 'No encontramos una reserva activa que requiera documentación.');
    if (!idServicio) return notify('Campo requerido', 'Selecciona el servicio que requiere el documento');
    if (!archivo) return notify('Campo requerido', 'Selecciona el PDF firmado');

    setEnviando(true);
    try {
      await documentosService.subir({
        id_reserva: idReserva,
        id_servicio: idServicio,
        pdf: { uri: archivo.uri, name: archivo.name || 'documento.pdf', type: archivo.mimeType || 'application/pdf' },
      });
      setArchivo(null);
      notify('Documento enviado', 'Un administrador lo revisará y validará.', 'success');
      setRefreshKey((k) => k + 1);
      await load();
    } catch (err) {
      notify('No se pudo enviar', errorMessage(err), 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Screen
      title="Documentación previa"
      subtitle="Los servicios que manipulan piezas internas requieren un PDF firmado. Tu reserva se confirma cuando el documento sea validado."
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}>
      {/* Si se llega desde una reserva (?id_reserva=...) se muestra qué documentos exige y su estado */}
      {idReserva ? (
        <RequisitosDocumentales key={`${idReserva}-${refreshKey}`} idReserva={idReserva} />
      ) : null}

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Adjuntar documento</Text>

        {reservaAsociada ? (
          <View style={[styles.reservaInfo, { backgroundColor: theme.accentBg }]}>
            <Ionicons name="calendar-outline" size={18} color={theme.accent} />
            <Text style={{ color: theme.text, flex: 1 }}>
              Documento asociado a tu reserva: {reservaAsociada.vehiculo} ({reservaAsociada.placa}) · {reservaAsociada.fecha_reserva}
            </Text>
          </View>
        ) : (
          <Text style={{ color: theme.warning, marginBottom: Spacing.three }}>
            No tienes una reserva activa que requiera documentación.
          </Text>
        )}

        <Text style={[styles.label, { color: theme.textSecondary }]}>Servicio</Text>
        {servicios.length === 0 ? (
          <Text style={{ color: theme.textTertiary, marginBottom: Spacing.three }}>
            No hay servicios que requieran documento.
          </Text>
        ) : (
          <FilterChips
            value={idServicio}
            onChange={setIdServicio}
            options={servicios.map((s) => ({ value: s.id_servicio, label: s.nombre }))}
          />
        )}

        <Pressable
          onPress={elegirPdf}
          style={[styles.picker, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Ionicons name="document-attach-outline" size={22} color={theme.accent} />
          <Text style={{ color: archivo ? theme.text : theme.textSecondary, flex: 1 }} numberOfLines={1}>
            {archivo ? archivo.name : 'Seleccionar PDF firmado (máx. 10MB)'}
          </Text>
        </Pressable>

        <Button title="Enviar documento" loading={enviando} onPress={enviar} />
      </Card>

      <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: Spacing.three }]}>
        Mis documentos
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} />
      ) : documentos.length === 0 ? (
        <Card style={{ padding: Spacing.five, alignItems: 'center' }}>
          <Text style={{ color: theme.textSecondary }}>Todavía no has enviado documentos.</Text>
        </Card>
      ) : (
        documentos.map((d) => (
          <Card key={d.id_documento} style={styles.docCard}>
            <View style={styles.docTop}>
              <View style={{ flex: 1, minWidth: 200 }}>
                <Text style={[styles.docName, { color: theme.text }]}>{d.nombre_servicio}</Text>
                <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                  Reserva {d.id_reserva.slice(0, 8)} • {new Date(d.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Badge label={d.estado} status={badgeStatus(d.estado)} />
            </View>
            {d.admin_respuesta ? (
              <Text style={{ color: theme.textSecondary, marginTop: Spacing.two, fontSize: 13 }}>
                Respuesta del administrador: {d.admin_respuesta}
              </Text>
            ) : null}
            <Pressable
              onPress={() => Linking.openURL(resolveMediaUrl(d.ruta_pdf))}
              style={{ marginTop: Spacing.two }}>
              <Text style={{ color: theme.sky, fontWeight: '700' }}>Ver PDF</Text>
            </Pressable>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  formCard: { padding: Spacing.four, marginBottom: Spacing.four },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: Spacing.two },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    marginBottom: Spacing.three,
  },
  reservaInfo: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    padding: Spacing.three, borderRadius: 12, marginBottom: Spacing.three,
  },
  docCard: { padding: Spacing.four, marginBottom: Spacing.three },
  docTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two, flexWrap: 'wrap' },
  docName: { fontSize: 16, fontWeight: '800' },
});
