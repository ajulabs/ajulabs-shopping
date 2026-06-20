import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { RBACService } from '@ajulabs/api-client';
import type { Colaborador } from '@ajulabs/types';
import { useAuthLojistaStore } from '../../../../store';
import { FormState, FORM_INICIAL } from '../lib/colaboradores';

export function useColaboradores() {
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const token = useAuthLojistaStore((s) => s.token);

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [editando, setEditando] = useState<Colaborador | null>(null);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    if (!lojaId || !token) return;
    setLoading(true);
    try {
      const lista = await RBACService.listarColaboradores(lojaId, token);
      setColaboradores(lista);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os colaboradores.');
    } finally {
      setLoading(false);
    }
  }, [lojaId, token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrirCriacao = useCallback(() => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setErro('');
    setModalVisivel(true);
  }, []);

  const abrirEdicao = useCallback((col: Colaborador) => {
    setEditando(col);
    setForm({ nome: col.nome, email: col.email, senha: '', papel: col.papel });
    setErro('');
    setModalVisivel(true);
  }, []);

  const salvar = useCallback(async () => {
    if (!form.nome.trim() || !form.email.trim()) {
      setErro('Nome e email são obrigatórios.');
      return;
    }
    if (!editando && !form.senha.trim()) {
      setErro('Senha é obrigatória para novo colaborador.');
      return;
    }
    if (!lojaId || !token) return;
    setSalvando(true);
    setErro('');
    try {
      if (editando) {
        await RBACService.atualizarColaborador(editando.id, lojaId, token, {
          nome: form.nome.trim(),
          papel: form.papel,
          ativo: true,
          ...(form.senha.trim() ? { senha: form.senha.trim() } : {}),
        });
      } else {
        await RBACService.criarColaborador(lojaId, token, {
          nome: form.nome.trim(),
          email: form.email.trim(),
          senha: form.senha.trim(),
          papel: form.papel,
        });
      }
      setModalVisivel(false);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }, [form, editando, lojaId, token, carregar]);

  const alternarAtivo = useCallback(
    async (col: Colaborador) => {
      if (!lojaId || !token) return;
      try {
        await RBACService.atualizarColaborador(col.id, lojaId, token, { ativo: !col.ativo });
        carregar();
      } catch {
        Alert.alert('Erro', 'Não foi possível alterar o status.');
      }
    },
    [lojaId, token, carregar],
  );

  return {
    colaboradores,
    loading,
    modalVisivel,
    setModalVisivel,
    editando,
    form,
    setForm,
    salvando,
    erro,
    abrirCriacao,
    abrirEdicao,
    salvar,
    alternarAtivo,
  };
}
