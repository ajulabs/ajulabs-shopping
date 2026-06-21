import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuthLojistaStore } from '../../../../store';

export function useLoginColaborador(onLoginSuccess?: () => void) {
  const router = useRouter();
  const loginColaborador = useAuthLojistaStore((s) => s.loginColaborador);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !senha.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginColaborador(email.trim(), senha);
      onLoginSuccess?.();
      router.replace('/(lojista)/pedidos');
    } catch (err) {
      const isNetwork =
        err instanceof Error &&
        (err.message.includes('Network') ||
          err.message.includes('fetch') ||
          err.message.includes('Failed'));
      setError(
        isNetwork
          ? 'Sem conexão com o servidor. Verifique sua internet.'
          : err instanceof Error
            ? err.message
            : 'Email ou senha incorretos.',
      );
    } finally {
      setLoading(false);
    }
  }, [email, senha, loginColaborador, onLoginSuccess, router]);

  return {
    router,
    email,
    setEmail,
    senha,
    setSenha,
    senhaVisivel,
    setSenhaVisivel,
    loading,
    error,
    setError,
    handleLogin,
  };
}
