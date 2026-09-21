import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, TextInput, View, useColorScheme } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing } from '@/constants/theme';
import { evidenciasService } from '@/services/atenciones.service';
import { resolveMediaUrl } from '@/services/api';
import { errorMessage } from '@/utils/dialog';
import type { EvidenciaAtencion } from '@/types/atenciones';

export function EvidenciasPanel({ idAtencion, idVehiculo, canRegister }: { idAtencion: string; idVehiculo: string; canRegister: boolean }) {
  const theme = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [items, setItems] = useState<EvidenciaAtencion[] | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => { setBusy(true); try { setItems(await evidenciasService.listar(idAtencion)); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }, [idAtencion]);
  useEffect(() => { load(); }, [load]);
  const elegir = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError('Permite el acceso a tus fotos para registrar la evidencia.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) { const a = result.assets[0]; setFoto({ uri: a.uri, name: a.fileName || `evidencia-${Date.now()}.jpg`, type: a.mimeType || 'image/jpeg' }); }
  };
  const guardar = async () => {
    if (!foto) { setError('Selecciona una fotografía.'); return; }
    if (descripcion.trim().length < 3) { setError('Agrega una descripción breve del daño o condición.'); return; }
    setBusy(true); setError('');
    try { await evidenciasService.registrar(idAtencion, idVehiculo, descripcion.trim(), foto); setDescripcion(''); setFoto(null); await load(); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };
  return <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
    <Text style={{ color: theme.text, fontWeight: '800' }}>Evidencias de recepción</Text>
    {canRegister && <View style={{ gap: Spacing.two }}>
      <TextInput value={descripcion} onChangeText={setDescripcion} placeholder="Ej.: Abolladura leve en puerta posterior izquierda" placeholderTextColor={theme.textTertiary} multiline maxLength={500} style={{ minHeight: 70, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 10, color: theme.text }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}><Button title={foto ? 'Foto seleccionada' : 'Seleccionar foto'} size="sm" variant="outline" icon={<Ionicons name="camera-outline" size={16} color={theme.accent} />} onPress={elegir} /><Button title="Guardar evidencia" size="sm" loading={busy} onPress={guardar} /></View>
    </View>}
    {busy && items === null && <ActivityIndicator color={theme.accent} />}
    {!!error && <Text style={{ color: theme.danger }}>{error}</Text>}
    {items?.length === 0 && <Text style={{ color: theme.textSecondary }}>Aún no se registraron daños o condiciones preexistentes.</Text>}
    {items?.map((e) => <View key={e.id_evidencia} style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}><Image source={{ uri: resolveMediaUrl(e.ruta_foto) }} style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: theme.surface }} /><View style={{ flex: 1 }}><Text style={{ color: theme.text }}>{e.descripcion || 'Sin descripción'}</Text><Text style={{ color: theme.textSecondary, fontSize: 12 }}>{new Date(e.created_at).toLocaleString('es-PE')}</Text></View></View>)}
  </View>;
}
