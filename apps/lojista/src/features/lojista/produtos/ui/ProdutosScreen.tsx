import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LojistaService } from '@ajulabs/api-client';
import { Produto } from '@ajulabs/types';
import { colors } from '../../../../theme';
import { useAuthLojistaStore } from '../../auth/model/store';
import { NovoProduto } from './NovoProduto';
import { ProdutoCard } from './ProdutoCard';
import { EditProdutoScreen } from './EditProdutoScreen';

type Mode = 'list' | 'add' | 'edit';

export function ProdutosScreen() {
  const lojaId = useAuthLojistaStore(s => s.lojaId);
  const token  = useAuthLojistaStore(s => s.token);
  const [mode, setMode]         = useState<Mode>('list');
  const [editando, setEditando] = useState<Produto | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading]   = useState(true);

  const carregar = useCallback(async () => {
    if (!lojaId || !token) return;
    setLoading(true);
    try {
      const lista = await LojistaService.listarProdutos(lojaId, token);
      setProdutos(lista);
    } finally {
      setLoading(false);
    }
  }, [lojaId, token]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleDelete = useCallback((produto: Produto) => {
    const doDelete = async () => {
      try {
        await LojistaService.excluirProduto(produto.id, token!);
        carregar();
      } catch (e) {
        Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao excluir produto.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Excluir "${produto.nome}"? Esta ação não pode ser desfeita.`)) {
        doDelete();
      }
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
  }, [token, carregar]);

  if (mode === 'add') {
    return <NovoProduto onVoltar={() => { setMode('list'); carregar(); }} />;
  }

  if (mode === 'edit' && editando) {
    return (
      <EditProdutoScreen
        produto={editando}
        token={token!}
        onVoltar={() => { setMode('list'); setEditando(null); }}
        onSalvo={() => { setMode('list'); setEditando(null); carregar(); }}
      />
    );
  }

  const ativos = produtos.filter(p => p.disponivel).length;

  const ListHeader = produtos.length > 0 ? (
    <View style={styles.listHeader}>
      <Text style={styles.listHeaderText}>
        {produtos.length} produto{produtos.length !== 1 ? 's' : ''}
        {'  ·  '}
        <Text style={styles.listHeaderAtivos}>{ativos} ativo{ativos !== 1 ? 's' : ''}</Text>
      </Text>
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Produtos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setMode('add')} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : produtos.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bag-outline" size={32} color={colors.orange} />
          </View>
          <Text style={styles.emptyTitle}>Nenhum produto ainda</Text>
          <Text style={styles.emptySub}>Adicione seu primeiro produto e ele aparecerá aqui.</Text>
          <TouchableOpacity style={styles.addBtnLarge} onPress={() => setMode('add')} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnLargeText}>Adicionar produto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={produtos}
          keyExtractor={p => p.id}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }) => (
            <ProdutoCard
              produto={item}
              onEdit={() => { setEditando(item); setMode('edit'); }}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.n50 },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingHorizontal: 20, paddingTop: 56, paddingBottom: 18,
                      backgroundColor: colors.n0,
                      borderBottomWidth: 1, borderBottomColor: colors.n200 },
  headerTitle:      { fontSize: 26, fontWeight: '800', color: colors.navy, letterSpacing: -0.5 },
  addBtn:           { flexDirection: 'row', alignItems: 'center', gap: 6,
                      backgroundColor: colors.orange,
                      paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12,
                      shadowColor: colors.orange, shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  addBtnText:       { color: '#fff', fontWeight: '700', fontSize: 14 },
  list:             { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  separator:        { height: 10 },
  listHeader:       { paddingVertical: 12 },
  listHeaderText:   { fontSize: 13, color: colors.n500, fontWeight: '500' },
  listHeaderAtivos: { color: '#16A34A', fontWeight: '700' },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon:        { width: 72, height: 72, borderRadius: 20, backgroundColor: colors.orange100,
                      alignItems: 'center', justifyContent: 'center' },
  emptyTitle:       { fontSize: 18, fontWeight: '800', color: colors.navy, marginTop: 20 },
  emptySub:         { fontSize: 13, color: colors.n500, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  addBtnLarge:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 28,
                      backgroundColor: colors.orange,
                      paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  addBtnLargeText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
});
