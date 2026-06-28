import { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { useProdutosScreen } from '../model/useProdutosScreen';
import { useHardwareBack, useTheme } from '../../../../shared/hooks';
import { GerenciarColaboradoresScreen } from '../../rbac/ui/GerenciarColaboradoresScreen';
import { SolicitacoesPrecoScreen } from '../../rbac/ui/SolicitacoesPrecoScreen';
import { AuditLogScreen } from '../../rbac/ui/AuditLogScreen';
import { NovoProduto } from './NovoProduto';
import { EditProdutoScreen } from './EditProdutoScreen';
import { EstoqueDashboard } from './EstoqueDashboard';
import { EstoqueNivelScreen } from './EstoqueNivelScreen';
import { MovimentacoesScreen } from './MovimentacoesScreen';

export function ProdutosScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const {
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
  } = useProdutosScreen();

  // Volta para a lista principal limpando o sub-modo e o produto em edição.
  const voltarParaMain = useCallback(() => {
    setMode('main');
    setEditando(null);
    setNivelAtivo(null);
  }, [setMode, setEditando, setNivelAtivo]);

  // Botão físico de voltar: se está num sub-modo, volta pra lista (não sai da tab).
  useHardwareBack(() => {
    if (mode !== 'main') {
      voltarParaMain();
      return true;
    }
    return false;
  });

  // Ao reentrar na aba Produtos, sempre começa na lista — evita reabrir o
  // último produto/sub-modo que ficou no estado.
  useFocusEffect(
    useCallback(() => {
      return () => voltarParaMain();
    }, [voltarParaMain]),
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

  return (
    <View style={{ flex: 1 }}>
      {showRbacBar && (
        <View
          style={[
            styles.rbacBar,
            {
              backgroundColor: theme.surf,
              borderBottomColor: theme.border,
              paddingTop: insets.top + 8,
            },
          ]}
        >
          {(canApprovePrice || isFuncionario) && (
            <TouchableOpacity
              style={[styles.rbacBtn, { backgroundColor: theme.surf2, borderColor: theme.border }]}
              onPress={() => setMode('solicitacoes')}
            >
              <View style={styles.rbacBtnContent}>
                <Ionicons name="pricetag-outline" size={16} color={colors.orange} />
                <Text style={[styles.rbacBtnText, { color: theme.text }]}>Preços</Text>
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
            <TouchableOpacity
              style={[styles.rbacBtn, { backgroundColor: theme.surf2, borderColor: theme.border }]}
              onPress={() => setMode('colaboradores')}
            >
              <View style={styles.rbacBtnContent}>
                <Ionicons name="people-outline" size={16} color={theme.text} />
                <Text style={[styles.rbacBtnText, { color: theme.text }]}>Equipe</Text>
              </View>
            </TouchableOpacity>
          )}
          {canViewAuditLog && (
            <TouchableOpacity
              style={[styles.rbacBtn, { backgroundColor: theme.surf2, borderColor: theme.border }]}
              onPress={() => setMode('auditoria')}
            >
              <View style={styles.rbacBtnContent}>
                <Ionicons name="document-text-outline" size={16} color={theme.text} />
                <Text style={[styles.rbacBtnText, { color: theme.text }]}>Auditoria</Text>
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
