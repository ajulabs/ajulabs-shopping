import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { RBACService } from '@ajulabs/api-client';
import type { SolicitacaoPreco, StatusSolicitacaoPreco } from '@ajulabs/types';
import { useAuthLojistaStore } from '../../../../store';
import { usePermissions } from '../../../../shared/hooks/usePermissions';

export function useSolicitacoes() {
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const colaboradorId = useAuthLojistaStore((s) => s.colaboradorId);
  const token = useAuthLojistaStore((s) => s.token);
  const { canApprovePrice, isFuncionario } = usePermissions();

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoPreco[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<StatusSolicitacaoPreco | undefined>(undefined);

  // Modal de revisão (aprovar/rejeitar)
  const [revisaoModal, setRevisaoModal] = useState<{
    sol: SolicitacaoPreco;
    acao: 'aprovar' | 'rejeitar';
  } | null>(null);
  const [notaRevisao, setNotaRevisao] = useState('');
  const [processando, setProcessando] = useState(false);

  const carregar = useCallback(
    async (silent = false) => {
      if (!lojaId || !token) return;
      if (!silent) setLoading(true);
      try {
        const opts: { solicitanteId?: string; status?: StatusSolicitacaoPreco } = {};
        if (isFuncionario && colaboradorId) opts.solicitanteId = colaboradorId;
        if (filtroStatus) opts.status = filtroStatus;
        const lista = await RBACService.listarSolicitacoes(lojaId, token, opts.status);
        // filter by solicitante client-side if funcionario
        const filtrada =
          isFuncionario && colaboradorId
            ? lista.filter((s) => s.solicitanteId === colaboradorId)
            : lista;
        setSolicitacoes(filtrada);
      } catch {
        if (!silent) Alert.alert('Erro', 'Não foi possível carregar as solicitações.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [lojaId, token, isFuncionario, colaboradorId, filtroStatus],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  const revisar = useCallback(async () => {
    if (!revisaoModal || !lojaId || !token) return;
    const { sol, acao } = revisaoModal;
    setProcessando(true);
    try {
      if (acao === 'aprovar') {
        await RBACService.aprovarSolicitacao(sol.id, lojaId, token, notaRevisao || undefined);
      } else {
        await RBACService.rejeitarSolicitacao(sol.id, lojaId, token, notaRevisao || undefined);
      }
      setRevisaoModal(null);
      setNotaRevisao('');
      carregar(true);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao processar solicitação.');
    } finally {
      setProcessando(false);
    }
  }, [revisaoModal, lojaId, token, notaRevisao, carregar]);

  return {
    solicitacoes,
    loading,
    refreshing,
    setRefreshing,
    filtroStatus,
    setFiltroStatus,
    revisaoModal,
    setRevisaoModal,
    notaRevisao,
    setNotaRevisao,
    processando,
    carregar,
    revisar,
    canApprovePrice,
    isFuncionario,
  };
}
