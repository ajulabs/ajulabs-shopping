import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuthLojistaStore } from '../../../../store';
import { enrichRateLimit } from '../../../../shared/lib/enrichRateLimit';
import { formatCNPJ } from '../lib/formatCNPJ';

export function useLogin(onLoginSuccess?: () => void) {
  const router = useRouter();
  const login = useAuthLojistaStore((s) => s.login);
  const [cnpj, setCnpj] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onChangeCnpj = useCallback((v: string) => {
    setCnpj(formatCNPJ(v));
    setError('');
  }, []);

  const onChangeSenha = useCallback((v: string) => {
    setSenha(v);
    setError('');
  }, []);

  const handleLogin = useCallback(async () => {
    if (!cnpj.trim() || !senha.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(cnpj, senha);
      onLoginSuccess?.();
      router.replace('/(lojista)/pedidos');
    } catch (err) {
      const isNetwork =
        err instanceof Error &&
        (err.message.includes('Network') ||
          err.message.includes('fetch') ||
          err.message.includes('Failed'));
      const msg = isNetwork
        ? 'Sem conexão com o servidor. Verifique sua internet.'
        : err instanceof Error
          ? err.message
          : 'CNPJ ou senha incorretos. Tente novamente.';
      setError(enrichRateLimit(msg));
    } finally {
      setLoading(false);
    }
  }, [cnpj, senha, login, onLoginSuccess, router]);

  return {
    cnpj,
    senha,
    loading,
    error,
    onChangeCnpj,
    onChangeSenha,
    handleLogin,
  };
}
