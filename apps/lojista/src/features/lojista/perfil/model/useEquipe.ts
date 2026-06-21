import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { RBACService } from '@ajulabs/api-client';
import type { Colaborador } from '@ajulabs/types';
import { useAuthLojistaStore } from '../../../../store';
import { FORM_VAZIO, type FormColaborador } from '../lib/equipe';

export function useEquipe() {
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const isLojistaDono = useAuthLojistaStore((s) => s.isLojistaDono);

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [equipeModal, setEquipeModal] = useState(false);
  const [editandoCol, setEditandoCol] = useState<Colaborador | null>(null);
  const [formCol, setFormCol] = useState<FormColaborador>(FORM_VAZIO);
  const [salvandoCol, setSalvandoCol] = useState(false);
  const [erroCol, setErroCol] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  const carregarColaboradores = useCallback(() => {
    if (!lojaId || !token || !isLojistaDono) return;
    RBACService.listarColaboradores(lojaId, token)
      .then(setColaboradores)
      .catch(() => {});
  }, [lojaId, token, isLojistaDono]);

  // carrega colaboradores (só para o dono)
  useEffect(() => {
    if (!token || !lojaId || !isLojistaDono) return;
    RBACService.listarColaboradores(lojaId, token)
      .then(setColaboradores)
      .catch(() => {});
  }, [token, lojaId, isLojistaDono]);

  const abrirCriarColaborador = useCallback(() => {
    setEditandoCol(null);
    setFormCol(FORM_VAZIO);
    setErroCol('');
    setSenhaVisivel(false);
    setEquipeModal(true);
  }, []);

  const abrirEditarColaborador = useCallback((col: Colaborador) => {
    setEditandoCol(col);
    setFormCol({ nome: col.nome, email: col.email, senha: '', papel: col.papel });
    setErroCol('');
    setSenhaVisivel(false);
    setEquipeModal(true);
  }, []);

  const salvarColaborador = useCallback(async () => {
    if (!formCol.nome.trim() || !formCol.email.trim()) {
      setErroCol('Nome e email são obrigatórios.');
      return;
    }
    if (!editandoCol && !formCol.senha.trim()) {
      setErroCol('Informe uma senha para o novo colaborador.');
      return;
    }
    if (!lojaId || !token) return;
    setSalvandoCol(true);
    setErroCol('');
    try {
      if (editandoCol) {
        await RBACService.atualizarColaborador(editandoCol.id, lojaId, token, {
          nome: formCol.nome.trim(),
          papel: formCol.papel,
          ativo: editandoCol.ativo,
          ...(formCol.senha.trim() ? { senha: formCol.senha.trim() } : {}),
        });
      } else {
        await RBACService.criarColaborador(lojaId, token, {
          nome: formCol.nome.trim(),
          email: formCol.email.trim(),
          senha: formCol.senha.trim(),
          papel: formCol.papel,
        });
      }
      setEquipeModal(false);
      carregarColaboradores();
    } catch (e) {
      setErroCol(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSalvandoCol(false);
    }
  }, [formCol, editandoCol, lojaId, token, carregarColaboradores]);

  const alternarAtivoColaborador = useCallback(
    async (col: Colaborador) => {
      if (!lojaId || !token) return;
      try {
        await RBACService.atualizarColaborador(col.id, lojaId, token, { ativo: !col.ativo });
        carregarColaboradores();
      } catch {
        Alert.alert('Erro', 'Não foi possível alterar o status.');
      }
    },
    [lojaId, token, carregarColaboradores],
  );

  return {
    colaboradores,
    equipeModal,
    setEquipeModal,
    editandoCol,
    formCol,
    setFormCol,
    salvandoCol,
    erroCol,
    senhaVisivel,
    setSenhaVisivel,
    abrirCriarColaborador,
    abrirEditarColaborador,
    salvarColaborador,
    alternarAtivoColaborador,
  };
}
