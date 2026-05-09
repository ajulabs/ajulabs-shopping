import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthLojistaStore } from '../src/features/lojista/auth/model/store';

export default function RootLayout() {
  const isLoggedIn = useAuthLojistaStore(s => s.isLoggedIn);
  const hydrated   = useAuthLojistaStore(s => s.hydrated);
  const hydrate    = useAuthLojistaStore(s => s.hydrate);
  const segments   = useSegments();
  const router     = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { hydrate().then(() => setMounted(true)); }, []);

  useEffect(() => {
    if (!mounted || !hydrated) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/(lojista)/pedidos');
    }
  }, [isLoggedIn, segments, mounted, hydrated]);

  if (!mounted) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000933' }}>
        <ActivityIndicator size="large" color="#F2760F" />
      </View>
    );
  }

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