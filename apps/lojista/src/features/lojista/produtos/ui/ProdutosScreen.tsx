import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LojistaService, RBACService } from '@ajulabs/api-client';
import { Produto, NivelEstoque } from '@ajulabs/types';
import { colors } from '../../../../theme';
import { useAuthLojistaStore } from '../../auth/model/store';
import { usePermissions } from '../../rbac/hooks/usePermissions';
import { GerenciarColaboradoresScreen } from '../../rbac/ui/GerenciarColaboradoresScreen';
import { SolicitacoesPrecoScreen } from '../../rbac/ui/SolicitacoesPrecoScreen';
import { AuditLogScreen } from '../../rbac/ui/AuditLogScreen';
import { NovoProduto } from './NovoProduto';
import { EditProdutoScreen } from './EditProdutoScreen';
import { EstoqueDashboard } from './EstoqueDashboard';
import { EstoqueNivelScreen } from './EstoqueNivelScreen';
import { MovimentacoesScreen } from './MovimentacoesScreen';

type Mode =
  | 'main'
  | 'add'
  | 'edit'
  | 'movimentacoes'
  | 'nivel'
  | 'colaboradores'
  | 'solicitacoes'
  | 'auditoria';

export function ProdutosScreen() {
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const { canManageUsers, canApprovePrice, canViewAuditLog, isFuncionario, isAdmin, isGerente } =
    usePermissions();
  const insets = useSafeAreaInsets();

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

  if (mode === 'add') {
    return (
      <NovoProduto
        onVoltar={() => {
          setMode('main');
          refresh();
        }}
      />
    );
  }

  if (mode === 'edit' && editando) {
    return (
      <EditProdutoScreen
        produto={editando}
        token={token!}
        onVoltar={() => {
          setMode('main');
          setEditando(null);
        }}
        onSalvo={() => {
          setMode('main');
          setEditando(null);
          refresh();
        }}
      />
    );
  }

  if (mode === 'movimentacoes') {
    return <MovimentacoesScreen onVoltar={() => setMode('main')} />;
  }

  if (mode === 'nivel' && nivelAtivo) {
    return (
      <EstoqueNivelScreen
        nivel={nivelAtivo}
        onVoltar={() => {
          setNivelAtivo(null);
          setMode('main');
        }}
        onEditarProduto={(produto) => {
          setEditando(produto);
          setMode('edit');
        }}
      />
    );
  }

  if (mode === 'colaboradores') {
    return <GerenciarColaboradoresScreen onVoltar={() => setMode('main')} />;
  }

  if (mode === 'solicitacoes') {
    return (
      <SolicitacoesPrecoScreen
        onVoltar={() => {
          setMode('main');
          carregarPendentes();
        }}
      />
    );
  }

  if (mode === 'auditoria') {
    return <AuditLogScreen onVoltar={() => setMode('main')} />;
  }

  const showRbacBar = canManageUsers || canApprovePrice || canViewAuditLog || isFuncionario;

  return (
    <View style={{ flex: 1 }}>
      {showRbacBar && (
        <View style={[styles.rbacBar, { paddingTop: insets.top + 8 }]}>
          {(canApprovePrice || isFuncionario) && (
            <TouchableOpacity style={styles.rbacBtn} onPress={() => setMode('solicitacoes')}>
              <View style={styles.rbacBtnContent}>
                <Ionicons name="pricetag-outline" size={16} color={colors.orange} />
                <Text style={styles.rbacBtnText}>Preços</Text>
                {pendentesCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {pendentesCount > 99 ? '99+' : pendentesCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          {canManageUsers && (
            <TouchableOpacity style={styles.rbacBtn} onPress={() => setMode('colaboradores')}>
              <View style={styles.rbacBtnContent}>
                <Ionicons name="people-outline" size={16} color={colors.navy} />
                <Text style={styles.rbacBtnText}>Equipe</Text>
              </View>
            </TouchableOpacity>
          )}
          {canViewAuditLog && (
            <TouchableOpacity style={styles.rbacBtn} onPress={() => setMode('auditoria')}>
              <View style={styles.rbacBtnContent}>
                <Ionicons name="document-text-outline" size={16} color={colors.navy} />
                <Text style={styles.rbacBtnText}>Auditoria</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
      <EstoqueDashboard
        key={refreshKey}
        skipTopInset={showRbacBar}
        onVerMovimentacoes={() => setMode('movimentacoes')}
        onVerNivel={(nivel) => {
          setNivelAtivo(nivel);
          setMode('nivel');
        }}
        onAdicionarProduto={() => setMode('add')}
        onEditarProduto={(produto) => {
          setEditando(produto);
          setMode('edit');
        }}
        onDeleteProduto={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rbacBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  rbacBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  rbacBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rbacBtnText: { fontSize: 13, fontWeight: '600', color: colors.navy },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
});
