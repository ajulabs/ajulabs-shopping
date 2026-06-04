import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { useAuthLojistaStore } from '../src/features/lojista/auth/model/store';
import { usePushRegistrationLojista } from '../src/hooks';
import { SplashLojista } from '../src/features/lojista/splash';

export default function RootLayout() {
  const isLoggedIn = useAuthLojistaStore((s) => s.isLoggedIn);
  const hasHydrated = useAuthLojistaStore((s) => s.hasHydrated);
  const segments = useSegments();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  usePushRegistrationLojista();

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
      // When coming from register the screen itself navigates to onboarding —
      // let it handle navigation instead of overriding with pedidos.
      const currentScreen = segments[1];
      if (currentScreen !== 'register') {
        router.replace('/(lojista)/pedidos');
      }
    }
  }, [isLoggedIn, hasHydrated, segments, mounted]);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar style="light" backgroundColor="#000933" />
      {isLoggedIn && showSplash ? (
        <SplashLojista onDone={() => setShowSplash(false)} />
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(lojista)" />
          <Stack.Screen name="(auth)" />
        </Stack>
      )}
    </SafeAreaProvider>
  );
}
