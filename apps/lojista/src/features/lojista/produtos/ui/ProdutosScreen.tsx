import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Image,
  StyleSheet, ActivityIndicator, Alert, ScrollView, TextInput, Switch, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LojistaService } from '@ajulabs/api-client';
import { Produto } from '@ajulabs/types';
import { colors } from '../../../../theme';
import { useAuthLojistaStore } from '../../auth/model/store';
import { NovoProduto } from './NovoProduto';

type Mode = 'list' | 'add' | 'edit';

interface EditForm {
  nome: string;
  categoria: string;
  descricao: string;
  preco: string;
  estoque: string;
  disponivel: boolean;
}

function ProdutoThumb({ uri, nome }: { uri: string; nome: string }) {
  const [error, setError] = useState(false);
  if (error || !uri) {
    return (
      <View style={styles.thumbFallback}>
        <Text style={styles.thumbFallbackText}>{nome.charAt(0)}</Text>
      </View>
    );
  }
  return (
    <Image source={{ uri }} style={styles.thumb} resizeMode="cover" onError={() => setError(true)} />
  );
}

function ProdutoRow({
  produto,
  onEdit,
  onDelete,
}: {
  produto: Produto;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.row}>
      <ProdutoThumb uri={produto.imagem} nome={produto.nome} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowNome} numberOfLines={1}>{produto.nome}</Text>
        <Text style={styles.rowCategoria}>{produto.categoria}</Text>
        <Text style={styles.rowPreco}>R$ {produto.preco.toFixed(2).replace('.', ',')}</Text>
      </View>
      <View style={styles.rowBadges}>
        <View style={[styles.badge, produto.disponivel ? styles.badgeOn : styles.badgeOff]}>
          <Text style={[styles.badgeText, produto.disponivel ? styles.badgeTextOn : styles.badgeTextOff]}>
            {produto.disponivel ? 'Ativo' : 'Inativo'}
          </Text>
        </View>
        {produto.estoque != null && (
          <View style={[styles.badge, produto.estoque === 0 ? styles.badgeEsgotado : styles.badgeEstoque]}>
            <Text style={[styles.badgeText, produto.estoque === 0 ? styles.badgeTextEsgotado : styles.badgeTextEstoque]}>
              {produto.estoque === 0 ? 'Esgotado' : `${produto.estoque} un.`}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onEdit} activeOpacity={0.7}>
          <Ionicons name="pencil-outline" size={16} color={colors.n600} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDelete]} onPress={onDelete} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={16} color="#C0392B" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EditProdutoScreen({
  produto,
  token,
  onVoltar,
  onSalvo,
}: {
  produto: Produto;
  token: string;
  onVoltar: () => void;
  onSalvo: () => void;
}) {
  const [form, setForm] = useState<EditForm>({
    nome: produto.nome,
    categoria: produto.categoria,
    descricao: produto.descricao,
    preco: produto.preco.toFixed(2).replace('.', ','),
    estoque: produto.estoque != null ? String(produto.estoque) : '',
    disponivel: produto.disponivel,
  });
  const [saving, setSaving] = useState(false);

  const set = useCallback((key: keyof EditForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSalvar = useCallback(async () => {
    const preco = parseFloat(form.preco.replace(',', '.'));
    if (isNaN(preco) || preco <= 0) {
      Alert.alert('Erro', 'Informe um preço válido.');
      return;
    }
    setSaving(true);
    try {
      const dados: Parameters<typeof LojistaService.editarProduto>[2] = {
        nome: form.nome,
        categoria: form.categoria,
        descricao: form.descricao,
        preco,
        disponivel: form.disponivel,
      };
      if (form.estoque !== '') {
        const est = parseInt(form.estoque, 10);
        if (!isNaN(est)) dados.estoque = est;
      }
      await LojistaService.editarProduto(produto.id, token, dados);
      onSalvo();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }, [form, produto.id, token, onSalvo]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onVoltar} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={colors.navy} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Editar produto</Text>
          <Text style={styles.headerSub}>Altere os dados e salve</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.editContent}>
        <ProdutoThumb uri={produto.imagem} nome={produto.nome} />

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Nome</Text>
          <TextInput style={styles.input} value={form.nome} onChangeText={v => set('nome', v)} placeholder="Nome do produto" />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Categoria</Text>
          <TextInput style={styles.input} value={form.categoria} onChangeText={v => set('categoria', v)} placeholder="Categoria" />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={form.descricao}
            onChangeText={v => set('descricao', v)}
            placeholder="Descrição do produto"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.rowFields}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Preço (R$)</Text>
            <TextInput
              style={styles.input}
              value={form.preco}
              onChangeText={v => set('preco', v)}
              placeholder="0,00"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Estoque</Text>
            <TextInput
              style={[styles.input, form.estoque === '0' && styles.inputEsgotado]}
              value={form.estoque}
              onChangeText={v => set('estoque', v)}
              placeholder="0"
              keyboardType="number-pad"
            />
            {form.estoque === '0' && (
              <Text style={styles.estoqueAviso}>Produto ficará fora da vitrine</Text>
            )}
          </View>
        </View>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.fieldLabel}>Disponível</Text>
            <Text style={styles.switchSub}>Produto aparece na vitrine</Text>
          </View>
          <Switch
            value={form.disponivel}
            onValueChange={v => set('disponivel', v)}
            trackColor={{ false: colors.n200, true: colors.orange }}
            thumbColor={colors.n0}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSalvar}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Salvar alterações</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

export function ProdutosScreen() {
  const lojaId = useAuthLojistaStore(s => s.lojaId);
  const token = useAuthLojistaStore(s => s.token);
  const [mode, setMode] = useState<Mode>('list');
  const [editando, setEditando] = useState<Produto | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

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
    return (
      <NovoProduto
        onVoltar={() => { setMode('list'); carregar(); }}
      />
    );
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Produtos</Text>
          <Text style={styles.headerSub}>{produtos.length} cadastrado{produtos.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setMode('add')} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : produtos.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="bag-outline" size={48} color={colors.n200} />
          <Text style={styles.emptyTitle}>Nenhum produto ainda</Text>
          <Text style={styles.emptySub}>Adicione seu primeiro produto e ele aparecerá aqui.</Text>
          <TouchableOpacity style={styles.addBtnLarge} onPress={() => setMode('add')} activeOpacity={0.85}>
            <Text style={styles.addBtnLargeText}>Adicionar produto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={produtos}
          keyExtractor={p => p.id}
          renderItem={({ item }) => (
            <ProdutoRow
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
  container:         { flex: 1, backgroundColor: colors.n50 },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                       paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
                       backgroundColor: colors.n0, borderBottomWidth: 1, borderBottomColor: colors.n200 },
  headerTitle:       { fontSize: 22, fontWeight: '700', color: colors.navy, letterSpacing: -0.4 },
  headerSub:         { fontSize: 12, color: colors.n600, marginTop: 2 },
  backBtn:           { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.06)',
                       alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0 },
  addBtn:            { flexDirection: 'row', alignItems: 'center', gap: 6,
                       backgroundColor: colors.orange, paddingHorizontal: 14,
                       paddingVertical: 9, borderRadius: 12 },
  addBtnText:        { color: '#fff', fontWeight: '600', fontSize: 14 },
  list:              { padding: 16, gap: 0 },
  separator:         { height: 1, backgroundColor: colors.n200, marginHorizontal: 16 },
  row:               { flexDirection: 'row', alignItems: 'center', gap: 12,
                       backgroundColor: colors.n0, paddingHorizontal: 16, paddingVertical: 12 },
  thumb:             { width: 56, height: 56, borderRadius: 10 },
  thumbFallback:     { width: 56, height: 56, borderRadius: 10,
                       backgroundColor: colors.orange100,
                       alignItems: 'center', justifyContent: 'center' },
  thumbFallbackText: { fontSize: 20, fontWeight: '700', color: colors.orange600 },
  rowInfo:           { flex: 1 },
  rowNome:           { fontSize: 14, fontWeight: '600', color: colors.navy },
  rowCategoria:      { fontSize: 12, color: colors.n600, marginTop: 1 },
  rowPreco:          { fontSize: 14, fontWeight: '700', color: colors.navy, marginTop: 2 },
  rowActions:        { flexDirection: 'row', gap: 6 },
  actionBtn:         { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.n100,
                       alignItems: 'center', justifyContent: 'center' },
  actionBtnDelete:   { backgroundColor: '#FDECEA' },
  badge:             { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  rowBadges:         { alignItems: 'flex-end', gap: 4 },
  badgeOn:           { backgroundColor: 'rgba(57,255,137,0.15)' },
  badgeOff:          { backgroundColor: colors.n100 },
  badgeEsgotado:     { backgroundColor: 'rgba(226,75,74,0.12)' },
  badgeEstoque:      { backgroundColor: 'rgba(0,9,51,0.07)' },
  badgeText:         { fontSize: 11, fontWeight: '600' },
  badgeTextOn:       { color: '#046C2E' },
  badgeTextOff:      { color: colors.n600 },
  badgeTextEsgotado: { color: '#C0392B' },
  badgeTextEstoque:  { color: colors.navy },
  inputEsgotado:     { borderColor: '#E24B4A' },
  estoqueAviso:      { fontSize: 11, color: '#E24B4A', fontWeight: '500', marginTop: 3 },
  center:            { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle:        { fontSize: 17, fontWeight: '600', color: colors.navy, marginTop: 16 },
  emptySub:          { fontSize: 13, color: colors.n600, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  addBtnLarge:       { marginTop: 24, backgroundColor: colors.orange,
                       paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  addBtnLargeText:   { color: '#fff', fontWeight: '600', fontSize: 15 },
  editContent:       { padding: 16, gap: 14 },
  fieldGroup:        { gap: 6 },
  fieldLabel:        { fontSize: 12, fontWeight: '600', color: colors.n600,
                       textTransform: 'uppercase', letterSpacing: 0.4 },
  input:             { backgroundColor: colors.n0, borderWidth: 1.5, borderColor: colors.n200,
                       borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                       fontSize: 14, color: colors.navy },
  inputMultiline:    { minHeight: 80, textAlignVertical: 'top' },
  rowFields:         { flexDirection: 'row', gap: 10 },
  switchRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                       backgroundColor: colors.n0, borderRadius: 12, padding: 14,
                       borderWidth: 1.5, borderColor: colors.n200 },
  switchSub:         { fontSize: 12, color: colors.n600, marginTop: 2 },
  saveBtn:           { height: 50, borderRadius: 14, backgroundColor: colors.orange,
                       alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveBtnText:       { fontSize: 15, fontWeight: '700', color: '#fff' },
});
