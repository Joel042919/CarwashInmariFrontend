import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function RegisterScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { register } = useAuth();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    if (!nombre.trim() || !apellido.trim() || !correo.trim() || !contrasena.trim()) {
      setErrorMsg('Nombre, apellido, correo y contraseña son obligatorios');
      return;
    }
    if (contrasena.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      await register({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim() || undefined,
        telefono: telefono.trim() || undefined,
        correo: correo.trim().toLowerCase(),
        contrasena,
      });
      router.replace('/');
    } catch (err: any) {
      const msg = err?.message || 'Error al registrar cliente';
      setErrorMsg(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Error de registro', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}>
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>
              Volver
            </Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              Crear Cuenta
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Regístrate en Carwash Inmari para seguimiento y beneficios
            </Text>
          </View>

          {/* Error Banner */}
          {errorMsg ? (
            <View style={[styles.errorBanner, { backgroundColor: theme.dangerBg }]}>
              <Ionicons name="alert-circle" size={18} color={theme.danger} />
              <Text style={[styles.errorText, { color: theme.danger }]}>
                {errorMsg}
              </Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <View style={styles.col}>
              <Input
                label="Nombre *"
                placeholder="Carlos"
                pill={true}
                value={nombre}
                onChangeText={setNombre}
              />
            </View>
            <View style={styles.col}>
              <Input
                label="Apellido *"
                placeholder="Mendoza"
                pill={true}
                value={apellido}
                onChangeText={setApellido}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Input
                label="DNI (Opcional)"
                placeholder="72345678"
                keyboardType="numeric"
                maxLength={12}
                pill={true}
                value={dni}
                onChangeText={setDni}
              />
            </View>
            <View style={styles.col}>
              <Input
                label="Teléfono (Opcional)"
                placeholder="987654321"
                keyboardType="phone-pad"
                pill={true}
                value={telefono}
                onChangeText={setTelefono}
              />
            </View>
          </View>

          <Input
            label="Correo Electrónico *"
            placeholder="carlos@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            pill={true}
            value={correo}
            onChangeText={setCorreo}
          />

          <Input
            label="Contraseña * (Mín. 6 caracteres)"
            placeholder="••••••••"
            secureTextEntry
            pill={true}
            value={contrasena}
            onChangeText={setContrasena}
          />

          <Button
            title="Crear Mi Cuenta"
            icon={<Ionicons name="arrow-forward" size={16} color="#000000" />}
            iconPosition="right"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitBtn}
          />

          <View style={styles.loginRow}>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
              ¿Ya tienes cuenta?{' '}
            </Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 13 }}>
                Iniciar sesión
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.six,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 40px -4px rgba(15, 23, 42, 0.08)',
      },
    }),
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.three,
  },
  header: {
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.three,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  col: {
    flex: 1,
  },
  submitBtn: {
    marginTop: Spacing.two,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.four,
  },
});
