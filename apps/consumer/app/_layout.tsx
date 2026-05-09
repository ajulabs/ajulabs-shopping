import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore, useCartStore } from '../src/store';

export default function RootLayout() {
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);
  const hydrated   = useAuthStore(s => s.hydrated);
  const hydrate        = useAuthStore(s => s.hydrate);
  const hydrateCart    = useCartStore(s => s.hydrate);
  const segments   = useSegments();
  const router     = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Promise.all([hydrate(), hydrateCart()]).then(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!mounted || !hydrated) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/(consumer)/chat');
    }
  }, [isLoggedIn, segments, mounted, hydrated]);

  // Aguarda hidratação para evitar flash de tela de login
  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0F22' }}>
        <ActivityIndicator size="large" color="#F2760F" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(consumer)" />
    </Stack>
  );
}