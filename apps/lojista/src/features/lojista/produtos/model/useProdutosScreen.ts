import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { LojistaService, RBACService } from '@ajulabs/api-client';
import { Produto, NivelEstoque } from '@ajulabs/types';
import { useAuthLojistaStore } from '../../../../store';
import { usePermissions } from '../../../../shared/hooks/usePermissions';

export type Mode =
  | 'main'
  | 'add'
  | 'edit'
  | 'movimentacoes'
  | 'nivel'
  | 'colaboradores'
  | 'solicitacoes'
  | 'auditoria';

export function useProdutosScreen() {
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const { canManageUsers, canApprovePrice, canViewAuditLog, isFuncionario, isAdmin, isGerente } =
    usePermissions();

  const [mode, setMode] = useState<Mode>('main');
  const [editando, setEditando] = useState<Produto | null>(null);
  const [nivelAtivo, setNivelAtivo] = useState<NivelEstoque | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendentesCount, setPendentesCount] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const carregarPendentes = useCallback(async () => {
    if (!lojaId || !token || isFuncionario) return;
    try {
      const count = await RBACService.contarPendentes(lojaId, token);
      setPendentesCount(count);
    } catch {
      // ignore
    }
  }, [lojaId, token, isFuncionario]);

  useEffect(() => {
    carregarPendentes();
  }, [carregarPendentes]);

  const handleDelete = useCallback(
    (produto: Produto) => {
      const doDelete = async () => {
        try {
          await LojistaService.excluirProduto(produto.id, token!);
          refresh();
        } catch (e) {
          Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao excluir produto.');
        }
      };

      if (Platform.OS === 'web') {
        if (window.confirm(`Excluir "${produto.nome}"? Esta ação não pode ser desfeita.`))
          doDelete();
      } else {
        Alert.alert(
          'Excluir produto',
          `Tem certeza que deseja excluir "${produto.nome}"? Esta ação não pode ser desfeita.`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: doDelete },
          ],
        );
      }
    },
    [token, refresh],
  );

  const showRbacBar = canManageUsers || canApprovePrice || canViewAuditLog || isFuncionario;

  return {
    token,
    mode,
    setMode,
    editando,
    setEditando,
    nivelAtivo,
    setNivelAtivo,
    refreshKey,
    refresh,
    pendentesCount,
    carregarPendentes,
    handleDelete,
    showRbacBar,
    canManageUsers,
    canApprovePrice,
    canViewAuditLog,
    isFuncionario,
    isAdmin,
    isGerente,
  };
}
