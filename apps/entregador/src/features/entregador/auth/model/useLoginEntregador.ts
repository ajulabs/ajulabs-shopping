import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuthEntregadorStore } from './store';
import { enrichRateLimit } from '../../../../shared/lib/enrichRateLimit';

export function useLoginEntregador(onLoginSuccess?: () => void) {
  const router = useRouter();
  const login = useAuthEntregadorStore((s) => s.login);
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!cpf.trim() || !senha.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(cpf, senha);
      onLoginSuccess?.();
      router.replace('/');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      const isNetwork = msg.includes('Network') || msg.includes('fetch') || msg.includes('Failed');
      setError(
        enrichRateLimit(
          isNetwork
            ? 'Sem conexão com o servidor. Verifique sua internet.'
            : msg || 'CPF ou senha incorretos. Tente novamente.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [cpf, senha, login, onLoginSuccess, router]);

  return {
    cpf,
    setCpf,
    senha,
    setSenha,
    loading,
    error,
    setError,
    showRecovery,
    setShowRecovery,
    handleLogin,
    router,
  };
}
