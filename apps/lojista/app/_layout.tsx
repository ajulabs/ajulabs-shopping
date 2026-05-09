import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthLojistaStore } from '../src/features/lojista/auth/model/store';

export default function RootLayout() {
  const isLoggedIn = useAuthLojistaStore(s => s.isLoggedIn);
  const segments = useSegments();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/(lojista)/pedidos');
    }
  }, [isLoggedIn, segments, mounted]);

  return (
    <>
      <StatusBar style="light" backgroundColor="#000933" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(lojista)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </>
  );
}