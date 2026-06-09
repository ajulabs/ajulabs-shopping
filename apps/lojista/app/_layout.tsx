import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { useAuthLojistaStore } from '../src/features/lojista/auth/model/store';
import { usePushRegistrationLojista } from '../src/hooks';
import { SplashLojista } from '../src/features/lojista/splash';

export default function RootLayout() {
  const isLoggedIn = useAuthLojistaStore((s) => s.isLoggedIn);
  const hasHydrated = useAuthLojistaStore((s) => s.hasHydrated);
  const refreshAccessToken = useAuthLojistaStore((s) => s.refreshAccessToken);
  const segments = useSegments();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);
  const refreshedRef = useRef(false);
  const [showSplash, setShowSplash] = useState(true);

  usePushRegistrationLojista();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Renova o token silenciosamente no boot se já estava logado — evita o limbo
  // onde o token de acesso expirou mas o refreshToken ainda é válido.
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
      // When coming from register the screen itself navigates to onboarding —
      // let it handle navigation instead of overriding with pedidos.
      const currentScreen = segments[1];
      if (currentScreen !== 'register') {
        router.replace('/(lojista)/pedidos');
      }
    }
  }, [isLoggedIn, hasHydrated, tokenReady, segments, mounted]);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      {/* Login e splash são navy (ícones claros); demais telas são claras → ícones escuros. */}
      <StatusBar style={!isLoggedIn || showSplash ? 'light' : 'dark'} />
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
