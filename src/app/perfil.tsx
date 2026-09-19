import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, BorderRadius, Spacing, MaxContentWidth } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { clienteService } from '@/services/cliente.service';
import { ClientePerfil } from '@/types';

export default function PerfilScreen() {
  const scheme = useColorScheme();
  const { width } = useWindowDimensions();
  const compact = width < 480;
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { user, token, isAuthenticated, updateUserLocal } = useAuth();

  const [perfil, setPerfil] = useState<ClientePerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Formulario
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadPerfil = async () => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    try {
      const data = await clienteService.getPerfil();
      setPerfil(data);
      setNombre(data.nombre || user?.nombre || '');
      setApellido(data.apellido || user?.apellido || '');
      setTelefono(data.telefono || user?.telefono || '');
      setDireccion(data.direccion || '');
      if (data.fecha_nacimiento) {
        setFechaNacimiento(data.fecha_nacimiento.split('T')[0]);
      }
    } catch (err: any) {
      // Si el usuario es administrador o no tiene fila en clientes, usar datos de sesión
      if (user) {
        setNombre(user.nombre || '');
        setApellido(user.apellido || '');
        setTelefono(user.telefono || '');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      loadPerfil();
    }
  }, [isAuthenticated, token]);

  const handleGuardar = async () => {
    if (!nombre.trim() || !apellido.trim()) {
      setErrorMsg('Nombre y apellido son obligatorios');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await clienteService.updatePerfil({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim() || undefined,
        direccion: direccion.trim() || undefined,
        fecha_nacimiento: fechaNacimiento.trim() ? `${fechaNacimiento.trim()}T00:00:00Z` : undefined,
      });

      await updateUserLocal({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim() || undefined,
      });

      setSuccessMsg('Perfil actualizado correctamente');
      if (Platform.OS === 'web') {
        alert('Perfil actualizado con éxito');
      } else {
        Alert.alert('Éxito', 'Tus datos han sido actualizados');
      }
    } catch (err: any) {
      const msg = err?.message || 'Error al actualizar perfil';
      setErrorMsg(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const userInitials = (nombre?.[0] || 'U') + (apellido?.[0] || '');

  return (
    <ResponsiveLayout>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              Configuración de Perfil
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              RF-02: Información de contacto, dirección y datos de cuenta
            </Text>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={theme.text} />
              <Text style={{ marginTop: 10, color: theme.textSecondary }}>
                Cargando tu información...
              </Text>
            </View>
          ) : (
            <>
              {/* Tarjeta de Resumen / Avatar */}
              <Card style={[styles.userSummaryCard, compact && styles.cardCompact]}>
                <View style={[styles.bigAvatar, { backgroundColor: theme.primary }]}>
                  <Text style={styles.bigAvatarText}>
                    {userInitials.toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.summaryName, { color: theme.text }]}>
                    {nombre} {apellido}
                  </Text>
                  <Text style={[styles.summaryEmail, { color: theme.textSecondary }]}>
                    {perfil?.correo || user?.correo}
                  </Text>
                  <View style={{ marginTop: 6 }}>
                    <Badge label={user?.rol || 'cliente'} status={user?.rol || 'cliente'} />
                  </View>
                </View>
              </Card>

              {/* Formulario (Estilo Driver details de checkout) */}
              <Card style={[styles.formCard, compact && styles.cardCompact]}>
                <Text style={[styles.formHeading, { color: theme.text }]}>
                  Datos Personales
                </Text>

                {successMsg ? (
                  <View style={[styles.banner, { backgroundColor: theme.accentBg }]}>
                    <Ionicons name="checkmark-circle" size={18} color="#8fd6bb" />
                    <Text style={{ color: '#8fd6bb', fontSize: 13, fontWeight: '700' }}>
                      {successMsg}
                    </Text>
                  </View>
                ) : null}

                {errorMsg ? (
                  <View style={[styles.banner, { backgroundColor: theme.dangerBg }]}>
                    <Ionicons name="alert-circle" size={18} color={theme.danger} />
                    <Text style={{ color: theme.danger, fontSize: 13, fontWeight: '700' }}>
                      {errorMsg}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Input
                      label="Nombre *"
                      value={nombre}
                      onChangeText={setNombre}
                    />
                  </View>
                  <View style={styles.col}>
                    <Input
                      label="Apellido *"
                      value={apellido}
                      onChangeText={setApellido}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Input
                      label="Documento de Identidad (DNI)"
                      value={perfil?.dni || '72345678'}
                      editable={false}
                      style={{ opacity: 0.7 }}
                    />
                  </View>
                  <View style={styles.col}>
                    <Input
                      label="Teléfono Celular"
                      value={telefono}
                      onChangeText={setTelefono}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <Input
                  label="Dirección de Domicilio"
                  placeholder="Ej: Urb. Las Quintanas Mz B Lt 4"
                  value={direccion}
                  onChangeText={setDireccion}
                />

                <Input
                  label="Fecha de Nacimiento (AAAA-MM-DD)"
                  placeholder="1998-05-15"
                  value={fechaNacimiento}
                  onChangeText={setFechaNacimiento}
                  helper="Formato AAAA-MM-DD"
                />

                <Button
                  title="Guardar Cambios"
                  icon={<Ionicons name="checkmark-sharp" size={16} color="#ffffff" />}
                  iconPosition="right"
                  onPress={handleGuardar}
                  loading={saving}
                  style={{ marginTop: Spacing.three }}
                />
              </Card>
            </>
          )}
        </View>
      </ScrollView>
    </ResponsiveLayout>
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
  header: {
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  userSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    padding: Spacing.five,
    marginBottom: Spacing.four,
  },
  bigAvatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigAvatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  summaryName: {
    fontSize: 20,
    fontWeight: '900',
  },
  summaryEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  formCard: {
    padding: Spacing.five,
  },
  formHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  col: {
    flexGrow: 1,
    flexBasis: 150,
  },
  cardCompact: {
    padding: Spacing.four,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.three,
  },
});
