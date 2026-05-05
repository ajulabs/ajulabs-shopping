import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/store';

export default function RootLayout() {
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);
  const segments = useSegments();
  const router = useRouter();
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
      router.replace('/(consumer)/chat');
    }
  }, [isLoggedIn, segments, mounted]);

  return <Slot />;
}