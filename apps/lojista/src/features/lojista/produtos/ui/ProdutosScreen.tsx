import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { LojistaService } from '@ajulabs/api-client';
import { Produto, NivelEstoque } from '@ajulabs/types';
import { useAuthLojistaStore } from '../../auth/model/store';
import { NovoProduto } from './NovoProduto';
import { EditProdutoScreen } from './EditProdutoScreen';
import { EstoqueDashboard } from './EstoqueDashboard';
import { EstoqueNivelScreen } from './EstoqueNivelScreen';
import { MovimentacoesScreen } from './MovimentacoesScreen';

type Mode = 'main' | 'add' | 'edit' | 'movimentacoes' | 'nivel';

export function ProdutosScreen() {
  const token = useAuthLojistaStore((s) => s.token);
  const [mode, setMode] = useState<Mode>('main');
  const [editando, setEditando] = useState<Produto | null>(null);
  const [nivelAtivo, setNivelAtivo] = useState<NivelEstoque | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

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

  return (
    <EstoqueDashboard
      key={refreshKey}
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
  );
}
