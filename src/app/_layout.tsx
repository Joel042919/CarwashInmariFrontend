import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { DialogHost } from '@/components/ui/DialogHost';

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
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
    }
  }, [isAuthenticated, isLoading, segments, router]);

  const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

  if (isLoading || (!isAuthenticated && !inAuthGroup) || (isAuthenticated && inAuthGroup)) {
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
