import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthEntregadorStore } from '../src/store';

export default function RootLayout() {
  const router = useRouter();
  const isLoggedIn = useAuthEntregadorStore(s => s.isLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/(auth)/login');
    }
  }, [isLoggedIn]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
