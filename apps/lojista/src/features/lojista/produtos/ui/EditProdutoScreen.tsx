import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LojistaService } from '@ajulabs/api-client';
import { Produto } from '@ajulabs/types';
import { colors } from '../../../../theme';
import { TipoProdutoSelector } from './TipoProdutoSelector';
import { TipoProdutoValue, derivarCategoriaString } from '../model/tipoProdutos';
import {
  VariacoesSection,
  VariacaoEstoque,
  gerarCombinacoes,
  syncVariacoes,
} from './NovoProdutoEditStage';

export interface EditForm {
  nome: string;
  categoria: string;
  descricao: string;
  preco: string;
  estoque: string;
  disponivel: boolean;
  tipoProduto: TipoProdutoValue | null;
  variacoesEstoque: VariacaoEstoque[];
}

type ImageSlot =
  | { type: 'existing'; url: string }
  | { type: 'new'; uri: string }
  | { type: 'empty' };

const SLOT_SIZE = (Dimensions.get('window').width - 16 * 2 - 10 * 3) / 4;

function OrangeToggle({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: true, bounciness: 4 }).start();
  }, [value]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 23] });
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onValueChange(!value)}
      style={[toggleStyles.track, { backgroundColor: value ? colors.orange : colors.n200 }]}
    >
      <Animated.View style={[toggleStyles.thumb, { transform: [{ translateX }] }]} />
    </TouchableOpacity>
  );
}

const toggleStyles = StyleSheet.create({
  track: { width: 50, height: 28, borderRadius: 14, justifyContent: 'center' },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});

export function EditProdutoScreen({
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
    variacoesEstoque: (produto.variacoes ?? []).map((v) => ({
      nome: v.nome,
      estoque: v.estoque,
      preco: v.preco ?? undefined,
    })),
  });
  const [saving, setSaving] = useState(false);

  // Regenera variações quando o lojista seleciona/altera o tipo de produto na edição
  useEffect(() => {
    const nomes = gerarCombinacoes(form.tipoProduto);
    if (nomes.length === 0 && form.variacoesEstoque.length === 0) return;
    const synced = syncVariacoes(nomes, form.variacoesEstoque);
    const mudou =
      synced.length !== form.variacoesEstoque.length ||
      synced.some((v, i) => v.nome !== form.variacoesEstoque[i]?.nome);
    if (mudou) setForm((prev) => ({ ...prev, variacoesEstoque: synced }));
  }, [form.tipoProduto]);

  const [slots, setSlots] = useState<ImageSlot[]>(() => {
    const existingUrls =
      produto.imagens && produto.imagens.length > 0
        ? produto.imagens
        : produto.imagem
          ? [produto.imagem]
          : [];
    const filled: ImageSlot[] = existingUrls.map((url) => ({ type: 'existing', url }));
    while (filled.length < 4) filled.push({ type: 'empty' });
    return filled;
  });

  const set = useCallback(
    (
      key: keyof EditForm,
      value: string | boolean | TipoProdutoValue | null | VariacaoEstoque[],
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

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
      setSlots((prev) => {
        const next = [...prev];
        next[index] = { type: 'new', uri: result.assets[0].uri };
        return next;
      });
    }
  }, []);

  const removeSlot = useCallback((index: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { type: 'empty' };
      const filled = next.filter((s) => s.type !== 'empty');
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
        .map((s) => s.url);
      const newImageUris = slots
        .filter((s): s is { type: 'new'; uri: string } => s.type === 'new')
        .map((s) => s.uri);

      const categoriaFinal = form.tipoProduto
        ? derivarCategoriaString(form.tipoProduto)
        : form.categoria;
      const hasVariacoes = form.variacoesEstoque.length > 0;
      const dados: Parameters<typeof LojistaService.editarProduto>[2] = {
        nome: form.nome,
        categoria: categoriaFinal,
        descricao: form.descricao,
        preco,
        disponivel: form.disponivel,
        existingImageUrls,
        newImageUris,
        variacoes: hasVariacoes ? form.variacoesEstoque : undefined,
      };
      if (!hasVariacoes && form.estoque !== '') {
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
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Fotos do produto <Text style={styles.fieldLabelHint}>(até 4)</Text>
          </Text>
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
          <Text style={styles.photoHint}>
            Toque em um slot vazio para adicionar foto. A primeira é a principal.
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Nome</Text>
          <TextInput
            style={styles.input}
            value={form.nome}
            onChangeText={(v) => set('nome', v)}
            placeholder="Nome do produto"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Tipo de produto</Text>
          <TipoProdutoSelector value={form.tipoProduto} onChange={(v) => set('tipoProduto', v)} />
          {!form.tipoProduto && (
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={form.categoria}
              onChangeText={(v) => set('categoria', v)}
              placeholder="Ou informe a categoria manualmente"
            />
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={form.descricao}
            onChangeText={(v) => set('descricao', v)}
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
              onChangeText={(v) => set('preco', v.replace(/[^0-9.,]/g, ''))}
              placeholder="0,00"
              keyboardType="decimal-pad"
            />
          </View>
          {form.variacoesEstoque.length === 0 && (
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Estoque</Text>
              <TextInput
                style={[styles.input, form.estoque === '0' && styles.inputEsgotado]}
                value={form.estoque}
                onChangeText={(v) => set('estoque', v.replace(/[^0-9]/g, ''))}
                placeholder="0"
                keyboardType="number-pad"
              />
              {form.estoque === '0' && (
                <Text style={styles.estoqueAviso}>Produto ficará fora da vitrine</Text>
              )}
            </View>
          )}
        </View>

        {form.variacoesEstoque.length > 0 && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Variações</Text>
            <VariacoesSection
              variacoes={form.variacoesEstoque}
              precoBase={form.preco}
              onChange={(v) => set('variacoesEstoque', v)}
            />
          </View>
        )}

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.fieldLabel}>Disponível</Text>
            <Text style={styles.switchSub}>Produto aparece na vitrine</Text>
          </View>
          <OrangeToggle value={form.disponivel} onValueChange={(v) => set('disponivel', v)} />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSalvar}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Salvar alterações</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.n50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 18,
    backgroundColor: colors.n0,
    borderBottomWidth: 1,
    borderBottomColor: colors.n200,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.navy, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: colors.n500, marginTop: 2 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.n100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },

  editContent: { padding: 16, gap: 14 },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldLabelHint: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.n500,
    textTransform: 'none',
    letterSpacing: 0,
  },

  photoGrid: { flexDirection: 'row', gap: 10 },
  photoSlotWrap: { flex: 1 },
  photoSlot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  photoSlotImg: { width: '100%', height: '100%' },
  photoSlotEmpty: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.n300,
    borderStyle: 'dashed',
    backgroundColor: colors.n50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,9,51,0.6)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  mainBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  photoHint: { fontSize: 11, color: colors.n500, marginTop: 4 },

  input: {
    backgroundColor: colors.n0,
    borderWidth: 1.5,
    borderColor: colors.n200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.navy,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  inputEsgotado: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  estoqueAviso: { fontSize: 11, color: '#DC2626', marginTop: 3 },
  rowFields: { flexDirection: 'row', gap: 10 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.n0,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.n200,
  },
  switchSub: { fontSize: 12, color: colors.n600, marginTop: 2 },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
