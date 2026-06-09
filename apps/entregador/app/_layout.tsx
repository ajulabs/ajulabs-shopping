import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthEntregadorStore } from '../src/store';
import { usePushRegistrationEntregador } from '../src/hooks';
import { setupNotificationChannels } from '../src/tasks/notificationChannels';

export default function RootLayout() {
  const router = useRouter();
  const isLoggedIn = useAuthEntregadorStore((s) => s.isLoggedIn);
  const hasHydrated = useAuthEntregadorStore((s) => s.hasHydrated);
  const refreshAccessToken = useAuthEntregadorStore((s) => s.refreshAccessToken);
  const segments = useSegments();
  const [mounted, setMounted] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);
  const refreshedRef = useRef(false);

  usePushRegistrationEntregador();

  useEffect(() => {
    setMounted(true);
    // Cria canal Android customizado pra alerta de corrida (som alto,
    // ignora silencioso, vibração longa). No-op em iOS/web.
    setupNotificationChannels().catch(() => {});
  }, []);

  // Renova o token silenciosamente no boot se já estava logado — evita o limbo
  // onde o token expirou mas o refreshToken é válido ("login expirado" + nenhuma
  // corrida chegando, mesmo "logado").
  useEffect(() => {
    if (!hasHydrated || refreshedRef.current) return;
    refreshedRef.current = true;
    if (!isLoggedIn) {
      setTokenReady(true);
      return;
    }
    refreshAccessToken().finally(() => setTokenReady(true));
  }, [hasHydrated]);

  useEffect(() => {
    // Espera storage carregar E o refresh terminar antes de redirecionar.
    if (!mounted || !hasHydrated || !tokenReady) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/');
    }
  }, [isLoggedIn, hasHydrated, tokenReady, segments, mounted]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
