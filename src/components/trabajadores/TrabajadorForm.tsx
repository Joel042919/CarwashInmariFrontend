import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Trabajador, ActualizarTrabajadorPayload, CrearTrabajadorPayload } from '@/types/trabajadores';

interface Props {
  trabajador?: Trabajador;
  saving: boolean;
  error: string;
  onSave: (data: CrearTrabajadorPayload | ActualizarTrabajadorPayload) => void;
  onCancel: () => void;
}

export function TrabajadorForm({ trabajador, saving, error, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    nombre: trabajador?.nombre ?? '', apellido: trabajador?.apellido ?? '',
    correo: trabajador?.correo ?? '', telefono: trabajador?.telefono ?? '',
    dni: trabajador?.dni ?? '', fecha_contratacion: trabajador?.fecha_contratacion ?? '', contrasena: '',
  });
  const field = (name: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [name]: value }));
  const submit = () => {
    const data = {
      nombre: form.nombre.trim(), apellido: form.apellido.trim(), correo: form.correo.trim(),
      telefono: form.telefono.trim() || undefined, dni: form.dni.trim(), fecha_contratacion: form.fecha_contratacion.trim(),
    };
    onSave(trabajador ? data : { ...data, contrasena: form.contrasena });
  };
  return <Card style={{ padding: 20, gap: 8 }}>
    <Input label="Nombre" value={form.nombre} onChangeText={(v) => field('nombre', v)} maxLength={100} editable={!saving} />
    <Input label="Apellido" value={form.apellido} onChangeText={(v) => field('apellido', v)} maxLength={100} editable={!saving} />
    <Input label="Correo" value={form.correo} onChangeText={(v) => field('correo', v)} keyboardType="email-address" autoCapitalize="none" maxLength={150} editable={!saving} />
    <Input label="DNI / documento" value={form.dni} onChangeText={(v) => field('dni', v)} maxLength={20} editable={!saving} />
    <Input label="Teléfono" value={form.telefono} onChangeText={(v) => field('telefono', v)} keyboardType="phone-pad" maxLength={20} editable={!saving} />
    <Input label="Fecha de contratación" placeholder="AAAA-MM-DD" helper={trabajador ? undefined : 'Vacío: se registra la fecha de hoy en Lima.'} value={form.fecha_contratacion} onChangeText={(v) => field('fecha_contratacion', v)} maxLength={10} editable={!saving} />
    {!trabajador && <Input label="Contraseña inicial" secureTextEntry value={form.contrasena} onChangeText={(v) => field('contrasena', v)} editable={!saving} />}
    {!!error && <Text accessibilityRole="alert" style={{ color: '#bf4949' }}>{error}</Text>}
    <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
      <Button title={trabajador ? 'Guardar cambios' : 'Registrar trabajador'} loading={saving} onPress={submit} />
      <Button title="Cancelar" variant="outline" disabled={saving} onPress={onCancel} />
    </View>
  </Card>;
}
