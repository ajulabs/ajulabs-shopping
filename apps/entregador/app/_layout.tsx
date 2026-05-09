import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthEntregadorStore } from '../src/store';

export default function RootLayout() {
  const router     = useRouter();
  const isLoggedIn = useAuthEntregadorStore(s => s.isLoggedIn);
  const hydrated   = useAuthEntregadorStore(s => s.hydrated);
  const hydrate    = useAuthEntregadorStore(s => s.hydrate);
  const segments   = useSegments();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { hydrate().then(() => setMounted(true)); }, []);

  useEffect(() => {
    if (!mounted || !hydrated) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/');
    }
  }, [isLoggedIn, segments, mounted, hydrated]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0F22' }}>
        <ActivityIndicator size="large" color="#F2760F" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
