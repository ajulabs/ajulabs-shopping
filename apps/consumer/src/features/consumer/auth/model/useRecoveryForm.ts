import { useState, useCallback } from 'react';

const API_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1/';

export type RecoveryStep = 'form' | 'codigo' | 'senha' | 'success';

function mensagemErro(err: unknown, fallback: string) {
  const isNetwork =
    err instanceof Error &&
    (err.message.includes('Network') ||
      err.message.includes('fetch') ||
      err.message.includes('Failed'));
  if (isNetwork) return 'Sem conexão. Verifique sua internet.';
  return err instanceof Error ? err.message : fallback;
}

export function useRecoveryForm(onClose: () => void) {
  const [step, setStep] = useState<RecoveryStep>('form');
  const [cpf, setCpf] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = useCallback(() => {
    setStep('form');
    setCpf('');
    setCodigo('');
    setNovaSenha('');
    setConfirmar('');
    setShowNovaSenha(false);
    setShowConfirmar(false);
    setError('');
    onClose();
  }, [onClose]);

  const handleEnviarCodigo = useCallback(async () => {
    if (cpf.replace(/\D/g, '').length !== 11) {
      setError('CPF inválido — deve ter 11 dígitos.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}auth/usuario/recuperar-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpf.replace(/\D/g, '') }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : 'Erro ao enviar código.');
      }
      setStep('codigo');
    } catch (err) {
      setError(mensagemErro(err, 'Erro ao enviar. Tente novamente.'));
    } finally {
      setLoading(false);
    }
  }, [cpf]);

  const handleVerificarCodigo = useCallback(async () => {
    if (codigo.replace(/\D/g, '').length !== 6) {
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
      const res = await fetch(`${API_URL}auth/usuario/redefinir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpf.replace(/\D/g, ''), codigo, novaSenha }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : 'Erro ao redefinir senha.');
      }
      setStep('success');
    } catch (err) {
      setError(mensagemErro(err, 'Erro ao redefinir senha.'));
    } finally {
      setLoading(false);
    }
  }, [cpf, codigo, novaSenha, confirmar]);

  return {
    step,
    setStep,
    cpf,
    setCpf,
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
