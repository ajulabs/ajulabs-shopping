import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store';

export default function Index() {
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);

  if (isLoggedIn) {
    return <Redirect href="/(consumer)/chat" />;
  }

  return <Redirect href="/(auth)/login" />;
}