import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { EntregadorService } from '../../../../shared/lib/authServices';
import { useAuthEntregadorStore } from '../../../../store';

export function useSeguranca() {
  const token = useAuthEntregadorStore((s) => s.token);
  const nomeAuth = useAuthEntregadorStore((s) => s.nome);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [savingPerfil, setSavingPerfil] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [savingSenha, setSavingSenha] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadingPerfil(false);
      return;
    }
    EntregadorService.buscarPerfil(token)
      .then((p) => {
        setNome(p?.entregador?.nome ?? nomeAuth ?? '');
        setEmail(p?.entregador?.email ?? '');
        setTelefone(p?.entregador?.telefone ?? '');
      })
      .catch(() => {
        setNome(nomeAuth ?? '');
      })
      .finally(() => setLoadingPerfil(false));
  }, [token]);

  const salvarDados = async () => {
    if (!token) return;
    if (nome.trim().length < 2) {
      Alert.alert('Erro', 'Nome muito curto.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Erro', 'Email inválido.');
      return;
    }
    setSavingPerfil(true);
    try {
      await EntregadorService.atualizarDadosPessoais(token, {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
      });
      Alert.alert('Salvo!', 'Dados pessoais atualizados com sucesso.');
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível atualizar os dados.');
    } finally {
      setSavingPerfil(false);
    }
  };

  const alterarSenha = async () => {
    if (!token) return;
    if (!senhaAtual) {
      Alert.alert('Erro', 'Informe a senha atual.');
      return;
    }
    if (novaSenha.length < 6) {
      Alert.alert('Erro', 'Nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmar) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }
    setSavingSenha(true);
    try {
      await EntregadorService.alterarSenha(token, senhaAtual, novaSenha);
      Alert.alert('Senha alterada!', 'Sua senha foi atualizada com sucesso.');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmar('');
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível alterar a senha.');
    } finally {
      setSavingSenha(false);
    }
  };

  return {
    nome,
    setNome,
    email,
    setEmail,
    telefone,
    setTelefone,
    loadingPerfil,
    savingPerfil,
    senhaAtual,
    setSenhaAtual,
    novaSenha,
    setNovaSenha,
    confirmar,
    setConfirmar,
    savingSenha,
    salvarDados,
    alterarSenha,
  };
}
