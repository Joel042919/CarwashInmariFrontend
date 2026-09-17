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

export default function LoginScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { login } = useAuth();

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (emailToUse?: string, pwdToUse?: string) => {
    const finalEmail = (emailToUse || correo).trim();
    const finalPwd = pwdToUse || contrasena;

    if (!finalEmail || !finalPwd) {
      setErrorMsg('Por favor ingresa tu correo y contraseña');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      await login({ correo: finalEmail, contrasena: finalPwd });
      router.replace('/');
    } catch (err: any) {
      const msg = err?.message || 'Error al iniciar sesión';
      setErrorMsg(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Acceso denegado', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email: string, pass: string) => {
    setCorreo(email);
    setContrasena(pass);
    handleLogin(email, pass);
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
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoIcon, { backgroundColor: theme.primary }]}>
              <Ionicons name="car-sport" size={28} color="#000000" />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              CARWASH INMARI
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Plataforma de gestión y trazabilidad vehicular
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

          {/* Formulario */}
          <Input
            label="Correo Electrónico"
            placeholder="ejemplo@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            pill={true}
            value={correo}
            onChangeText={(text) => {
              setCorreo(text);
              setErrorMsg('');
            }}
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            secureTextEntry
            pill={true}
            value={contrasena}
            onChangeText={(text) => {
              setContrasena(text);
              setErrorMsg('');
            }}
          />

          <Button
            title="Ingresar a la Plataforma"
            icon={<Ionicons name="arrow-forward" size={16} color="#000000" />}
            iconPosition="right"
            onPress={() => handleLogin()}
            loading={loading}
            style={styles.submitBtn}
          />

          {/* Enlace de Registro */}
          <View style={styles.registerRow}>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
              ¿Aún no tienes cuenta?{' '}
            </Text>
            <Pressable onPress={() => router.push('/register')}>
              <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 13 }}>
                Crear cuenta de cliente
              </Text>
            </Pressable>
          </View>

          {/* Acceso Rápido Demo */}
          <View style={[styles.demoSection, { borderTopColor: theme.border }]}>
            <Text style={[styles.demoTitle, { color: theme.textSecondary }]}>
              ACCESO RÁPIDO DEMO
            </Text>
            <View style={styles.demoButtonsRow}>
              <Button
                title="👤 Cliente (Joel)"
                variant="secondary"
                size="sm"
                onPress={() => quickLogin('joel@cliente.com', 'cliente123')}
                style={styles.demoBtn}
              />
              <Button
                title="🛡️ Admin Inmari"
                variant="secondary"
                size="sm"
                onPress={() => quickLogin('admin@inmari.com', 'admin123')}
                style={styles.demoBtn}
              />
            </View>
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
    maxWidth: 440,
    borderRadius: BorderRadius.xl, // 24px luxury card
    borderWidth: 1,
    padding: Spacing.six,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 40px -4px rgba(15, 23, 42, 0.08)',
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  logoIcon: {
    width: 54,
    height: 54,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
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
  submitBtn: {
    marginTop: Spacing.two,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  demoSection: {
    marginTop: Spacing.five,
    paddingTop: Spacing.four,
    borderTopWidth: 1,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  demoBtn: {
    flex: 1,
  },
});
