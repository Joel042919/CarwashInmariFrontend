import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments, usePathname } from 'expo-router';
import { canAccessRoute } from '@/constants/access';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { DialogHost } from '@/components/ui/DialogHost';

function AuthGate() {
  const { isAuthenticated, isLoading, role } = useAuth();
  const pathname = usePathname();
  const allowed = canAccessRoute(pathname, role);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirigir a login si no tiene sesión activa
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirigir al dashboard si ya tiene sesión
      router.replace('/');
    } else if (isAuthenticated && !allowed) {
      router.replace(role === 'trabajador' ? '/mis-asignaciones' : '/');
    }
  }, [isAuthenticated, isLoading, segments, router, allowed, role]);

  const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

  if (isLoading || (!isAuthenticated && !inAuthGroup) || (isAuthenticated && (inAuthGroup || !allowed))) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.light.background,
        }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthGate />
        <DialogHost />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
