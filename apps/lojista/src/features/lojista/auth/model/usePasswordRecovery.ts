import { useState, useCallback } from 'react';
import { enrichRateLimit } from '../../../../shared/lib/enrichRateLimit';

const API_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1/';

export type RecoveryStep = 'form' | 'codigo' | 'senha' | 'success';

export function usePasswordRecovery(onClose: () => void) {
  const [step, setStep] = useState<RecoveryStep>('form');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = useCallback(() => {
    setStep('form');
    setEmail('');
    setCodigo('');
    setNovaSenha('');
    setConfirmar('');
    setShowNovaSenha(false);
    setShowConfirmar(false);
    setError('');
    onClose();
  }, [onClose]);

  const handleEnviarCodigo = useCallback(async () => {
    if (!email.includes('@') || !email.includes('.')) {
      setError('Email inválido.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}auth/lojista/recuperar-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : 'Erro ao enviar código.');
      }
      setStep('codigo');
    } catch (err) {
      const isNetwork =
        err instanceof Error &&
        (err.message.includes('Network') ||
          err.message.includes('fetch') ||
          err.message.includes('Failed'));
      setError(
        enrichRateLimit(
          isNetwork
            ? 'Sem conexão. Verifique sua internet.'
            : err instanceof Error
              ? err.message
              : 'Erro ao enviar.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleVerificarCodigo = useCallback(() => {
    if (codigo.length !== 6) {
      setError('Digite o código de 6 dígitos enviado ao seu email.');
      return;
    }
    setError('');
    setStep('senha');
  }, [codigo]);

  const handleRedefinirSenha = useCallback(async () => {
    if (novaSenha.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (!/[A-Z]/.test(novaSenha)) {
      setError('A senha deve conter pelo menos 1 letra maiúscula.');
      return;
    }
    if (!/[0-9]/.test(novaSenha)) {
      setError('A senha deve conter pelo menos 1 número.');
      return;
    }
    if (novaSenha !== confirmar) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}auth/lojista/redefinir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo, novaSenha }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : 'Erro ao redefinir senha.');
      }
      setStep('success');
    } catch (err) {
      const isNetwork =
        err instanceof Error &&
        (err.message.includes('Network') ||
          err.message.includes('fetch') ||
          err.message.includes('Failed'));
      setError(
        enrichRateLimit(
          isNetwork
            ? 'Sem conexão. Verifique sua internet.'
            : err instanceof Error
              ? err.message
              : 'Erro ao redefinir senha.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [email, codigo, novaSenha, confirmar]);

  return {
    step,
    setStep,
    email,
    setEmail,
    codigo,
    setCodigo,
    novaSenha,
    setNovaSenha,
    confirmar,
    setConfirmar,
    showNovaSenha,
    setShowNovaSenha,
    showConfirmar,
    setShowConfirmar,
    loading,
    error,
    setError,
    handleClose,
    handleEnviarCodigo,
    handleVerificarCodigo,
    handleRedefinirSenha,
  };
}
