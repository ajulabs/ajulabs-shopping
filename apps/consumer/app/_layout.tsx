import { useEffect, useRef, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { useAuthStore, useThemeStore } from '../src/store';
import { SplashConsumer } from '../src/features/consumer/splash';
import { usePushRegistration } from '../src/hooks';

export default function RootLayout() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const refreshAccessToken = useAuthStore((s) => s.refreshAccessToken);
  const isDark = useThemeStore((s) => s.isDark);
  const segments = useSegments();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  // tokenReady = true quando o refresh silencioso na inicialização terminar
  const [tokenReady, setTokenReady] = useState(false);
  const refreshedRef = useRef(false);

  usePushRegistration();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Roda uma única vez após o AsyncStorage hidratar.
  // Se o usuário já estava logado, renova o token silenciosamente antes
  // de liberar o roteamento — evita o caso onde o token expirou mas o
  // refreshToken ainda é válido.
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
    // Espera o storage carregar E o refresh terminar antes de decidir
    // redirect, senão pisca a tela de login mesmo pra usuário logado.
    if (!mounted || !hasHydrated || !tokenReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/(consumer)/chat');
    }
  }, [isLoggedIn, hasHydrated, tokenReady, segments, mounted]);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      {/* Login e splash são navy (ícones claros). No app logado segue o tema:
          modo claro → ícones escuros; modo escuro → ícones claros. */}
      <StatusBar style={!isLoggedIn || showSplash || isDark ? 'light' : 'dark'} />
      {isLoggedIn && showSplash ? <SplashConsumer onDone={() => setShowSplash(false)} /> : <Slot />}
    </SafeAreaProvider>
  );
}
