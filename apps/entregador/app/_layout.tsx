import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthEntregadorStore } from '../src/store';
import { usePushRegistrationEntregador } from '../src/hooks';
import { setupNotificationChannels } from '../src/tasks/notificationChannels';

export default function RootLayout() {
  const router = useRouter();
  const isLoggedIn = useAuthEntregadorStore((s) => s.isLoggedIn);
  const hasHydrated = useAuthEntregadorStore((s) => s.hasHydrated);
  const segments = useSegments();
  const [mounted, setMounted] = useState(false);

  usePushRegistrationEntregador();

  useEffect(() => {
    setMounted(true);
    // Cria canal Android customizado pra alerta de corrida (som alto,
    // ignora silencioso, vibração longa). No-op em iOS/web.
    setupNotificationChannels().catch(() => {});
  }, []);

  useEffect(() => {
    // Espera storage carregar antes de redirecionar (evita piscar login).
    if (!mounted || !hasHydrated) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/');
    }
  }, [isLoggedIn, hasHydrated, segments, mounted]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
