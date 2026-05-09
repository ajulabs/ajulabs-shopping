import { Redirect } from 'expo-router';
import { useAuthLojistaStore } from '../src/features/lojista/auth/model/store';

export default function Index() {
  const isLoggedIn = useAuthLojistaStore(s => s.isLoggedIn);
  const hydrated   = useAuthLojistaStore(s => s.hydrated);

  if (!hydrated) return null;
  return <Redirect href={isLoggedIn ? '/(lojista)/pedidos' : '/(auth)/login'} />;
}
