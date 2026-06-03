import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  Animated,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LojistaService, RBACService } from '@ajulabs/api-client';
import { Produto } from '@ajulabs/types';
import { colors } from '../../../../theme';
import { usePermissions } from '../../rbac/hooks/usePermissions';
import { useAuthLojistaStore } from '../../auth/model/store';
import { TipoProdutoSelector } from './TipoProdutoSelector';
import {
  TipoProdutoValue,
  derivarCategoriaString,
  inferirTipoProduto,
  TIPOS_PRODUTO,
} from '../model/tipoProdutos';
import {
  VariacoesSection,
  VariacaoEstoque,
  gerarCombinacoes,
  syncVariacoes,
} from './NovoProdutoEditStage';

/**
 * Infers the product type and reconstructs the selected spec values
 * (sizes, colors, etc.) by parsing the existing variation names.
 * Variation names use ' · ' as separator between spec axes, e.g. "P · Preto".
 */
function reconstruirTipoProduto(produto: Produto): TipoProdutoValue | null {
  const base = inferirTipoProduto({ categoria: produto.categoria });
  if (!base) return null;

  const variacoes = produto.variacoes ?? [];
  if (!variacoes.length) return base;

  const cat = TIPOS_PRODUTO.find((c) => c.id === base.catId);
  const subcat = cat?.subcats.find((s) => s.id === base.subcatId);
  const multiSpecs = (subcat?.specs ?? []).filter((s) => s.multiplo);
  if (!multiSpecs.length) return base;

  const specsMap: Record<string, Set<string>> = {};
  for (const v of variacoes) {
    v.nome.split(' · ').forEach((parte, idx) => {
      const spec = multiSpecs[idx];
      if (!spec) return;
      if (!specsMap[spec.id]) specsMap[spec.id] = new Set();
      specsMap[spec.id].add(parte);
    });
  }

  const specs: Record<string, string[]> = { ...base.specs };
  for (const [id, vals] of Object.entries(specsMap)) {
    if (vals.size > 0) specs[id] = Array.from(vals);
  }

  return { ...base, specs };
}

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
  const insets = useSafeAreaInsets();
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const isLojistaDono = useAuthLojistaStore((s) => s.isLojistaDono);
  const { canEditPrices, isGerente, isFuncionario } = usePermissions();

  // State for price change request (funcionario only)
  const [solicitacaoModal, setSolicitacaoModal] = useState(false);
  const [precoSolicitado, setPrecoSolicitado] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false);

  const [form, setForm] = useState<EditForm>({
    nome: produto.nome,
    categoria: produto.categoria,
    descricao: produto.descricao,
    preco: produto.preco.toFixed(2).replace('.', ','),
    estoque: produto.estoque != null ? String(produto.estoque) : '',
    disponivel: produto.disponivel,
    tipoProduto: reconstruirTipoProduto(produto),
    variacoesEstoque: (produto.variacoes ?? []).map((v) => ({
      nome: v.nome,
      estoque: v.estoque,
      preco: v.preco ?? undefined,
    })),
  });
  const [saving, setSaving] = useState(false);
  const [discardAlertVisible, setDiscardAlertVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const initialFormRef = useRef(form);

  const isMounted = useRef(false);

  // Regenera variações quando o lojista seleciona/altera o tipo de produto na edição.
  // Skips the initial mount so pre-loaded variations are not cleared or reordered.
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
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

  const initialSlotsRef = useRef(slots);

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

  const showSuccessToast = useCallback(
    (cb: () => void) => {
      Animated.sequence([
        Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(toastAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start(() => cb());
    },
    [toastAnim],
  );

  const handleSalvar = useCallback(async () => {
    if (discardAlertVisible) return;
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

    setSaving(true);
    try {
      if (isLojistaDono) {
        const preco = parseFloat(form.preco.replace(',', '.'));
        if (isNaN(preco) || preco <= 0) {
          Alert.alert('Erro', 'Informe um preço válido.');
          return;
        }
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
      } else {
        // colaborador — use RBAC route (price change for funcionario is handled server-side)
        const dados: Parameters<typeof RBACService.editarProduto>[2] = {
          lojaId: lojaId!,
          nome: form.nome,
          categoria: categoriaFinal,
          descricao: form.descricao,
          disponivel: form.disponivel,
          existingImageUrls,
          newImageUris,
          variacoes: hasVariacoes ? form.variacoesEstoque : undefined,
        };
        if (canEditPrices) {
          const preco = parseFloat(form.preco.replace(',', '.'));
          if (!isNaN(preco) && preco > 0) dados.preco = preco;
        }
        if (!hasVariacoes && form.estoque !== '') {
          const est = parseInt(form.estoque, 10);
          if (!isNaN(est)) dados.estoque = est;
        }
        await RBACService.editarProduto(produto.id, token, dados);
      }
      showSuccessToast(onSalvo);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }, [
    form,
    slots,
    produto.id,
    token,
    onSalvo,
    isLojistaDono,
    lojaId,
    canEditPrices,
    showSuccessToast,
    discardAlertVisible,
  ]);

  const handleSubmeterSolicitacao = useCallback(async () => {
    if (!precoSolicitado.trim() || !justificativa.trim()) {
      Alert.alert('Erro', 'Informe o novo preço e a justificativa.');
      return;
    }
    const preco = parseFloat(precoSolicitado.replace(',', '.'));
    if (isNaN(preco) || preco <= 0) {
      Alert.alert('Erro', 'Preço inválido.');
      return;
    }
    setEnviandoSolicitacao(true);
    try {
      await RBACService.submeterSolicitacaoPreco(token, {
        produtoId: produto.id,
        lojaId: lojaId!,
        precoSolicitado: preco,
        justificativa,
      });
      setSolicitacaoModal(false);
      setPrecoSolicitado('');
      setJustificativa('');
      Alert.alert(
        'Solicitação enviada',
        'Sua solicitação de mudança de preço foi enviada para aprovação.',
      );
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao enviar solicitação.');
    } finally {
      setEnviandoSolicitacao(false);
    }
  }, [precoSolicitado, justificativa, token, produto.id, lojaId]);

  const hasChanges = useMemo(() => {
    const init = initialFormRef.current;
    return (
      form.nome !== init.nome ||
      form.descricao !== init.descricao ||
      form.preco !== init.preco ||
      form.estoque !== init.estoque ||
      form.disponivel !== init.disponivel ||
      form.categoria !== init.categoria ||
      JSON.stringify(form.variacoesEstoque) !== JSON.stringify(init.variacoesEstoque) ||
      JSON.stringify(slots) !== JSON.stringify(initialSlotsRef.current)
    );
  }, [form, slots]);

  const handleDescartar = useCallback(() => {
    const executar = () => {
      setForm(initialFormRef.current);
      setSlots(initialSlotsRef.current);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Todas as alterações feitas serão perdidas. Deseja continuar?'))
        executar();
      return;
    }

    Alert.alert(
      'Descartar alterações',
      'Todas as alterações feitas serão perdidas. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: executar },
      ],
    );
  }, []);

  const handleVoltar = useCallback(() => {
    if (!hasChanges) {
      onVoltar();
      return;
    }

    if (Platform.OS === 'web') {
      if (window.confirm('Você tem alterações não salvas. Deseja descartar e sair?')) onVoltar();
      return;
    }

    setDiscardAlertVisible(true);
    Alert.alert(
      'Alterações não salvas',
      'Você tem alterações que ainda não foram salvas. Deseja descartar e sair?',
      [
        {
          text: 'Continuar editando',
          style: 'cancel',
          onPress: () => setDiscardAlertVisible(false),
        },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            setDiscardAlertVisible(false);
            onVoltar();
          },
        },
      ],
      { onDismiss: () => setDiscardAlertVisible(false) },
    );
  }, [hasChanges, onVoltar]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={handleVoltar} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={colors.navy} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Editar produto</Text>
          <Text style={[styles.headerSub, hasChanges && { color: colors.orange }]}>
            {hasChanges ? '● Alterações não salvas' : 'Altere os dados e salve'}
          </Text>
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
          {/* Price field: editable for admin/owner, hidden for gerente, read-only for funcionario */}
          {!isGerente && (
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Preço (R$)</Text>
              {canEditPrices ? (
                <TextInput
                  style={styles.input}
                  value={form.preco}
                  onChangeText={(v) => set('preco', v.replace(/[^0-9.,]/g, ''))}
                  placeholder="0,00"
                  keyboardType="decimal-pad"
                />
              ) : (
                <View style={styles.precoReadonly}>
                  <Text style={styles.precoReadonlyText}>{form.preco}</Text>
                  <TouchableOpacity
                    onPress={() => setSolicitacaoModal(true)}
                    style={styles.solicitarBtn}
                  >
                    <Text style={styles.solicitarBtnText}>Solicitar mudança</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
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
          style={[styles.saveBtn, (saving || discardAlertVisible) && { opacity: 0.7 }]}
          onPress={handleSalvar}
          activeOpacity={0.85}
          disabled={saving || discardAlertVisible}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Salvar alterações</Text>
          )}
        </TouchableOpacity>

        {hasChanges && (
          <TouchableOpacity
            style={styles.discardBtn}
            onPress={handleDescartar}
            activeOpacity={0.75}
            disabled={saving}
          >
            <Text style={styles.discardBtnText}>Descartar alterações</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal: solicitar mudança de preço (funcionario only) */}
      <Modal
        visible={solicitacaoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setSolicitacaoModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSolicitacaoModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Solicitar mudança de preço</Text>
            <Text style={styles.modalSub}>
              Informe o novo preço e a justificativa. Um admin/gerente irá revisar sua solicitação.
            </Text>
            <Text style={styles.solModalLabel}>NOVO PREÇO (R$)</Text>
            <TextInput
              style={styles.solModalInput}
              value={precoSolicitado}
              onChangeText={setPrecoSolicitado}
              placeholder="0,00"
              keyboardType="decimal-pad"
            />
            <Text style={[styles.solModalLabel, { marginTop: 12 }]}>JUSTIFICATIVA</Text>
            <TextInput
              style={[styles.solModalInput, { minHeight: 70, textAlignVertical: 'top' }]}
              value={justificativa}
              onChangeText={setJustificativa}
              placeholder="Explique o motivo da mudança de preço..."
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={[styles.saveBtn, { marginTop: 16 }, enviandoSolicitacao && { opacity: 0.7 }]}
              onPress={handleSubmeterSolicitacao}
              disabled={enviandoSolicitacao}
            >
              {enviandoSolicitacao ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Enviar solicitação</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  backgroundColor: 'transparent',
                  borderWidth: 1.5,
                  borderColor: colors.n200,
                  marginTop: 8,
                },
              ]}
              onPress={() => setSolicitacaoModal(false)}
            >
              <Text style={[styles.saveBtnText, { color: colors.n600 }]}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 60,
          left: 24,
          right: 24,
          backgroundColor: '#16a34a',
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          opacity: toastAnim,
          transform: [
            { translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) },
          ],
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        }}
      >
        <Ionicons name="checkmark-circle" size={22} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Alterações salvas!</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.n50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  discardBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.n300,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  discardBtnText: { fontSize: 14, fontWeight: '600', color: colors.n600 },

  precoReadonly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.n50,
    borderWidth: 1.5,
    borderColor: colors.n200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  precoReadonlyText: { flex: 1, fontSize: 14, color: colors.n600 },
  solicitarBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.orange + '18',
    borderWidth: 1,
    borderColor: colors.orange,
  },
  solicitarBtnText: { fontSize: 11, fontWeight: '700', color: colors.orange },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,9,51,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.n0,
    borderRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.n200,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.navy, marginBottom: 6 },
  modalSub: { fontSize: 13, color: colors.n600, lineHeight: 19, marginBottom: 16 },
  solModalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  solModalInput: {
    backgroundColor: colors.n50,
    borderWidth: 1.5,
    borderColor: colors.n200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.navy,
  },
});
