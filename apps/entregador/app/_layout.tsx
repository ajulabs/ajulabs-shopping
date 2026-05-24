import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthEntregadorStore } from '../src/store';
import { usePushRegistrationEntregador } from '../src/hooks';

export default function RootLayout() {
  const router = useRouter();
  const isLoggedIn = useAuthEntregadorStore((s) => s.isLoggedIn);
  const hasHydrated = useAuthEntregadorStore((s) => s.hasHydrated);
  const segments = useSegments();
  const [mounted, setMounted] = useState(false);

  usePushRegistrationEntregador();

  useEffect(() => {
    setMounted(true);
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

  return <Stack screenOptions={{ headerShown: false }} />;
}
