import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Image,
  StyleSheet, ActivityIndicator, Alert, ScrollView, TextInput, Switch, Platform, Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LojistaService } from '@ajulabs/api-client';
import { Produto } from '@ajulabs/types';
import { colors } from '../../../../theme';
import { useAuthLojistaStore } from '../../auth/model/store';
import { NovoProduto } from './NovoProduto';
import { TipoProdutoSelector } from './TipoProdutoSelector';
import { TipoProdutoValue, derivarCategoriaString } from '../data/tipoProdutos';

type Mode = 'list' | 'add' | 'edit';

interface EditForm {
  nome: string;
  categoria: string;
  descricao: string;
  preco: string;
  estoque: string;
  disponivel: boolean;
  tipoProduto: TipoProdutoValue | null;
}

function ProdutoThumb({ uri, nome, size = 88 }: { uri: string; nome: string; size?: number }) {
  const [error, setError] = useState(false);
  const s = { width: size, height: size, borderRadius: 12 };

  if (error || !uri) {
    return (
      <View style={[s, styles.thumbFallback]}>
        <Text style={[styles.thumbFallbackText, { fontSize: size * 0.38 }]}>
          {nome.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={[s, { overflow: 'hidden' }]}
      resizeMode="cover"
      onError={() => setError(true)}
    />
  );
}

function ProdutoCard({
  produto,
  onEdit,
  onDelete,
}: {
  produto: Produto;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const preco = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;

  return (
    <View style={styles.card}>
      <ProdutoThumb uri={produto.imagem} nome={produto.nome} />

      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardNome} numberOfLines={2}>{produto.nome}</Text>
          <View style={[styles.badge, produto.disponivel ? styles.badgeOn : styles.badgeOff]}>
            <View style={[styles.badgeDot, produto.disponivel ? styles.badgeDotOn : styles.badgeDotOff]} />
            <Text style={[styles.badgeLabel, produto.disponivel ? styles.badgeLabelOn : styles.badgeLabelOff]}>
              {produto.disponivel ? 'Ativo' : 'Inativo'}
            </Text>
          </View>
        </View>

        <View style={styles.cardMidRow}>
          <Text style={styles.cardCategoria}>{produto.categoria}</Text>
          {produto.estoque != null && (
            <View style={[styles.estoqueBadge, produto.estoque === 0 && styles.estoqueBadgeZero]}>
              <Text style={[styles.estoqueBadgeText, produto.estoque === 0 && styles.estoqueBadgeTextZero]}>
                {produto.estoque === 0 ? 'Esgotado' : `${produto.estoque} un.`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardBottomRow}>
          <Text style={styles.cardPreco}>{preco}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnEdit} onPress={onEdit} activeOpacity={0.75}>
              <Ionicons name="pencil-outline" size={14} color={colors.n800} />
              <Text style={styles.btnEditText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnDelete} onPress={onDelete} activeOpacity={0.75}>
              <Ionicons name="trash-outline" size={15} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

type ImageSlot =
  | { type: 'existing'; url: string }
  | { type: 'new'; uri: string }
  | { type: 'empty' };

const SLOT_SIZE = (Dimensions.get('window').width - 16 * 2 - 10 * 3) / 4;

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
    tipoProduto: null,
  });
  const [saving, setSaving] = useState(false);

  const [slots, setSlots] = useState<ImageSlot[]>(() => {
    const existingUrls =
      produto.imagens && produto.imagens.length > 0
        ? produto.imagens
        : produto.imagem
        ? [produto.imagem]
        : [];
    const filled: ImageSlot[] = existingUrls.map(url => ({ type: 'existing', url }));
    while (filled.length < 4) filled.push({ type: 'empty' });
    return filled;
  });

  const set = useCallback((key: keyof EditForm, value: string | boolean | TipoProdutoValue | null) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const pickImage = useCallback(async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setSlots(prev => {
        const next = [...prev];
        next[index] = { type: 'new', uri: result.assets[0].uri };
        return next;
      });
    }
  }, []);

  const removeSlot = useCallback((index: number) => {
    setSlots(prev => {
      const next = [...prev];
      next[index] = { type: 'empty' };
      // Compacta os slots — move os vazios para o final
      const filled = next.filter(s => s.type !== 'empty');
      while (filled.length < 4) filled.push({ type: 'empty' });
      return filled;
    });
  }, []);

  const handleSalvar = useCallback(async () => {
    const preco = parseFloat(form.preco.replace(',', '.'));
    if (isNaN(preco) || preco <= 0) {
      Alert.alert('Erro', 'Informe um preço válido.');
      return;
    }
    setSaving(true);
    try {
      const existingImageUrls = slots
        .filter((s): s is { type: 'existing'; url: string } => s.type === 'existing')
        .map(s => s.url);
      const newImageUris = slots
        .filter((s): s is { type: 'new'; uri: string } => s.type === 'new')
        .map(s => s.uri);

      const categoriaFinal = form.tipoProduto
        ? derivarCategoriaString(form.tipoProduto)
        : form.categoria;
      const dados: Parameters<typeof LojistaService.editarProduto>[2] = {
        nome: form.nome,
        categoria: categoriaFinal,
        descricao: form.descricao,
        preco,
        disponivel: form.disponivel,
        existingImageUrls,
        newImageUris,
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
  }, [form, slots, produto.id, token, onSalvo]);

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

        {/* ── Grade de fotos ─────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Fotos do produto <Text style={styles.fieldLabelHint}>(até 4)</Text></Text>
          <View style={styles.photoGrid}>
            {slots.map((slot, i) => (
              <View key={i} style={styles.photoSlotWrap}>
                {slot.type !== 'empty' ? (
                  <View style={styles.photoSlot}>
                    <Image
                      source={{ uri: slot.type === 'existing' ? slot.url : slot.uri }}
                      style={styles.photoSlotImg}
                      resizeMode="cover"
                    />
                    {i === 0 && (
                      <View style={styles.mainBadge}>
                        <Text style={styles.mainBadgeText}>Principal</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.photoRemoveBtn}
                      onPress={() => removeSlot(i)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.photoSlotEmpty}
                    onPress={() => pickImage(i)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={22} color={colors.n500} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
          <Text style={styles.photoHint}>Toque em um slot vazio para adicionar foto. A primeira é a principal.</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Nome</Text>
          <TextInput style={styles.input} value={form.nome} onChangeText={v => set('nome', v)} placeholder="Nome do produto" />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Tipo de produto</Text>
          <TipoProdutoSelector
            value={form.tipoProduto}
            onChange={v => set('tipoProduto', v)}
          />
          {!form.tipoProduto && (
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={form.categoria}
              onChangeText={v => set('categoria', v)}
              placeholder="Ou informe a categoria manualmente"
            />
          )}
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
  container: { flex: 1, backgroundColor: colors.n50 },

  // ── Header ──────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 18,
    backgroundColor: colors.n0,
    borderBottomWidth: 1, borderBottomColor: colors.n200,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.navy, letterSpacing: -0.5 },
  headerSub:   { fontSize: 13, color: colors.n500, marginTop: 2 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.n100,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, flexShrink: 0,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.orange,
    paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12,
    shadowColor: colors.orange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── List ────────────────────────────────────
  list:      { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  separator: { height: 10 },

  listHeader:       { paddingVertical: 12 },
  listHeaderText:   { fontSize: 13, color: colors.n500, fontWeight: '500' },
  listHeaderAtivos: { color: '#16A34A', fontWeight: '700' },

  // ── Card ────────────────────────────────────
  card: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.n0,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.n200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  thumbFallback:     { backgroundColor: colors.orange100, alignItems: 'center', justifyContent: 'center' },
  thumbFallbackText: { fontWeight: '800', color: colors.orange600 },

  cardContent:  { flex: 1, justifyContent: 'space-between', gap: 4 },
  cardTopRow:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  cardNome:     { flex: 1, fontSize: 15, fontWeight: '700', color: colors.navy, lineHeight: 21 },
  cardCategoria:{ fontSize: 12, color: colors.n500, fontWeight: '500' },
  cardMidRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  cardBottomRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cardPreco:    { fontSize: 18, fontWeight: '800', color: colors.orange },

  // ── Estoque badge (card) ─────────────────────
  estoqueBadge:         { backgroundColor: colors.n100, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  estoqueBadgeZero:     { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 },
  estoqueBadgeText:     { fontSize: 10, fontWeight: '700', color: colors.n600 },
  estoqueBadgeTextZero: { color: '#DC2626' },

  // ── Actions ─────────────────────────────────
  actions:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnEdit:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7,
                 borderRadius: 8, borderWidth: 1, borderColor: colors.n200, backgroundColor: colors.n0 },
  btnEditText: { fontSize: 12, fontWeight: '600', color: colors.n800 },
  btnDelete:   { width: 34, height: 34, borderRadius: 8, backgroundColor: '#FEF2F2',
                 borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', justifyContent: 'center' },

  // ── Badge (status) ───────────────────────────
  badge:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5,
                  borderRadius: 99, flexShrink: 0 },
  badgeDot:     { width: 6, height: 6, borderRadius: 3 },
  badgeDotOn:   { backgroundColor: '#16A34A' },
  badgeDotOff:  { backgroundColor: colors.n300 },
  badgeOn:      { backgroundColor: '#DCFCE7' },
  badgeOff:     { backgroundColor: colors.n100 },
  badgeLabel:    { fontSize: 11, fontWeight: '700' },
  badgeLabelOn:  { color: '#15803D' },
  badgeLabelOff: { color: colors.n500 },

  // ── Empty state ─────────────────────────────
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon:       { width: 72, height: 72, borderRadius: 20, backgroundColor: colors.orange100,
                     alignItems: 'center', justifyContent: 'center' },
  emptyTitle:      { fontSize: 18, fontWeight: '800', color: colors.navy, marginTop: 20 },
  emptySub:        { fontSize: 13, color: colors.n500, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  addBtnLarge:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 28,
                     backgroundColor: colors.orange, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  addBtnLargeText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // ── Edit form ────────────────────────────────
  editContent:       { padding: 16, gap: 14 },
  fieldGroup:        { gap: 6 },
  fieldLabel:        { fontSize: 12, fontWeight: '600', color: colors.n600, textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldLabelHint:    { fontSize: 11, fontWeight: '400', color: colors.n500, textTransform: 'none', letterSpacing: 0 },

  // Photo grid
  photoGrid:         { flexDirection: 'row', gap: 10 },
  photoSlotWrap:     { flex: 1 },
  photoSlot:         { width: SLOT_SIZE, height: SLOT_SIZE, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  photoSlotImg:      { width: '100%', height: '100%' },
  photoSlotEmpty:    { width: SLOT_SIZE, height: SLOT_SIZE, borderRadius: 10,
                       borderWidth: 1.5, borderColor: colors.n300, borderStyle: 'dashed',
                       backgroundColor: colors.n50,
                       alignItems: 'center', justifyContent: 'center' },
  photoRemoveBtn:    { position: 'absolute', top: 4, right: 4,
                       width: 20, height: 20, borderRadius: 10,
                       backgroundColor: 'rgba(0,0,0,0.55)',
                       alignItems: 'center', justifyContent: 'center' },
  mainBadge:         { position: 'absolute', bottom: 0, left: 0, right: 0,
                       backgroundColor: 'rgba(0,9,51,0.6)',
                       paddingVertical: 2, alignItems: 'center' },
  mainBadgeText:     { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  photoHint:         { fontSize: 11, color: colors.n500, marginTop: 4 },
  input:          { backgroundColor: colors.n0, borderWidth: 1.5, borderColor: colors.n200, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.navy },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  rowFields:      { flexDirection: 'row', gap: 10 },
  switchRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.n0, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: colors.n200 },
  switchSub:      { fontSize: 12, color: colors.n600, marginTop: 2 },
  saveBtn:        { height: 52, borderRadius: 14, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveBtnText:    { fontSize: 15, fontWeight: '700', color: '#fff' },
});
