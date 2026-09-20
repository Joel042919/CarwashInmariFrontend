import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Switch, Text, View, useColorScheme } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TrabajadorForm } from '@/components/trabajadores/TrabajadorForm';
import { AtencionesPanel } from '@/components/atenciones/AtencionesPanel';
import { Colors } from '@/constants/theme';
import { trabajadoresService } from '@/services/trabajadores.service';
import type { Trabajador, CrearTrabajadorPayload, ActualizarTrabajadorPayload } from '@/types/trabajadores';
import { confirmAction, errorMessage, notify } from '@/utils/dialog';

export default function AdminTrabajadoresScreen() {
  const theme = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [items, setItems] = useState<Trabajador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editing, setEditing] = useState<Trabajador | 'new' | null>(null);
  const [selected, setSelected] = useState<Trabajador | null>(null);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await trabajadoresService.listar()); }
    catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const save = async (data: CrearTrabajadorPayload | ActualizarTrabajadorPayload) => {
    if (saving) return;
    setSaving(true); setFormError('');
    try {
      if (editing && editing !== 'new') {
        if (!data.fecha_contratacion) throw new Error('La fecha de contratación es obligatoria.');
        await trabajadoresService.actualizar(editing.id_usuario, { ...data, fecha_contratacion: data.fecha_contratacion });
      } else if ('contrasena' in data) { await trabajadoresService.crear(data); }
      setEditing(null); await load();
    } catch (err) { setFormError(errorMessage(err)); }
    finally { setSaving(false); }
  };
  const disponibilidad = async (t: Trabajador, disponible: boolean) => {
    setSaving(true);
    try { await trabajadoresService.cambiarDisponibilidad(t.id_usuario, disponible); await load(); }
    catch (err) { notify('No se pudo actualizar', errorMessage(err), 'error'); }
    finally { setSaving(false); }
  };
  const baja = async (t: Trabajador) => {
    if (!await confirmAction('Dar de baja', `${t.nombre} ${t.apellido} perderá acceso al sistema. Se conservará su historial. Las atenciones pendientes deben reasignarse o finalizarse antes.`)) return;
    setSaving(true);
    try { await trabajadoresService.darBaja(t.id_usuario); await load(); }
    catch (err) { notify('No se pudo dar de baja', errorMessage(err), 'warning'); setSelected(t); }
    finally { setSaving(false); }
  };

  if (selected) return <Screen title={`${selected.nombre} ${selected.apellido}`} subtitle="Asignaciones y participación en servicios del equipo." headerRight={<Button title="Volver al personal" variant="outline" onPress={() => setSelected(null)} />}>
    <AtencionesPanel key={selected.id_usuario} trabajador={selected.id_usuario} />
  </Screen>;

  const query = search.trim().toLocaleLowerCase();
  const filtered = items.filter((t) => (showInactive || t.activo) && `${t.nombre} ${t.apellido} ${t.correo} ${t.dni}`.toLocaleLowerCase().includes(query));
  return <Screen title="Trabajadores" subtitle="Administra el personal, sus asignaciones y rendimiento." refreshing={loading} onRefresh={load}
    headerRight={!editing ? <Button title="Nuevo trabajador" disabled={saving} onPress={() => { setFormError(''); setEditing('new'); }} /> : undefined}>
    {editing && <TrabajadorForm key={editing === 'new' ? 'new' : editing.id_usuario} trabajador={editing === 'new' ? undefined : editing} saving={saving} error={formError} onSave={save} onCancel={() => setEditing(null)} />}
    <Input label="Buscar trabajador" placeholder="Nombre, correo o documento" value={search} onChangeText={setSearch} />
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <Switch accessibilityLabel="Mostrar trabajadores dados de baja" value={showInactive} onValueChange={setShowInactive} />
      <Text style={{ color: theme.text }}>Incluir personal dado de baja</Text>
    </View>
    {!!error && <Card style={{ padding: 16 }}><Text accessibilityRole="alert" style={{ color: theme.danger }}>{error}</Text><Button title="Reintentar" onPress={load} /></Card>}
    {loading ? <ActivityIndicator color={theme.primary} /> : !error && <>
      {filtered.length === 0 && <Text style={{ color: theme.textSecondary }}>No hay trabajadores que coincidan con la búsqueda.</Text>}
      {filtered.map((t) => <Card key={t.id_usuario} style={{ padding: 20, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 18 }}>{t.nombre} {t.apellido}</Text>
          <Badge label={!t.activo ? 'De baja' : t.disponible ? 'Disponible' : 'No disponible'} status={!t.activo ? 'cancelado' : t.disponible ? 'disponible' : 'pendiente'} />
        </View>
        <Text style={{ color: theme.textSecondary }}>{t.correo} · DNI {t.dni}{t.telefono ? ` · ${t.telefono}` : ''}</Text>
        <Text style={{ color: theme.textSecondary }}>Contratación: {t.fecha_contratacion}{t.fecha_cese ? ` · Cese: ${t.fecha_cese}` : ''}</Text>
        {t.activo && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Switch accessibilityLabel={`Disponibilidad de ${t.nombre}`} value={t.disponible} disabled={saving} onValueChange={(v) => disponibilidad(t, v)} /><Text style={{ color: theme.text }}>Disponible para nuevas asignaciones</Text></View>}
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Button title="Asignaciones y rendimiento" variant="outline" disabled={saving} onPress={() => setSelected(t)} />
          {t.activo && <><Button title="Editar" variant="outline" disabled={saving} onPress={() => { setFormError(''); setEditing(t); }} /><Button title="Dar de baja" variant="danger" disabled={saving} onPress={() => baja(t)} /></>}
        </View>
      </Card>)}
    </>}
  </Screen>;
}
