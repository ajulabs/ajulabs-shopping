import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthEntregadorStore } from '../src/store';

export default function RootLayout() {
  const router = useRouter();
  const isLoggedIn = useAuthEntregadorStore(s => s.isLoggedIn);
  const segments = useSegments();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/');
    }
  }, [isLoggedIn, segments, mounted]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
