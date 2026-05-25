import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { TipoProdutoSelector } from './TipoProdutoSelector';
import { TIPOS_PRODUTO, TipoProdutoValue } from '../model/tipoProdutos';

export interface ProductData {
  nome: string;
  categoria: string;
  descricao: string;
  tags: string[];
  preco: string;
  estoque: string;
  variacoes: string[];
  tipoProduto: TipoProdutoValue | null;
}

type FieldKey = 'nome' | 'tipoProduto' | 'descricao' | 'preco' | 'estoque';

const FIELD_ORDER: FieldKey[] = ['nome', 'tipoProduto', 'descricao', 'preco', 'estoque'];

function getMissingSpecs(tipoProduto: TipoProdutoValue | null): string[] {
  if (!tipoProduto?.catId || !tipoProduto?.subcatId) return [];
  const cat = TIPOS_PRODUTO.find((c) => c.id === tipoProduto.catId);
  const subcat = cat?.subcats.find((s) => s.id === tipoProduto.subcatId);
  return (subcat?.specs ?? [])
    .filter((spec) => (tipoProduto.specs[spec.id] ?? []).length === 0)
    .map((spec) => spec.id);
}

function validate(data: ProductData): {
  errors: Partial<Record<FieldKey, string>>;
  missingSpecs: string[];
} {
  const errors: Partial<Record<FieldKey, string>> = {};
  if (!data.nome.trim()) errors.nome = 'Informe o nome do produto';
  if (!data.tipoProduto?.catId || !data.tipoProduto?.subcatId)
    errors.tipoProduto = 'Selecione o tipo do produto';
  if (!data.descricao.trim()) errors.descricao = 'Informe uma descrição';
  const preco = parseFloat(data.preco.replace(',', '.'));
  if (!data.preco.trim() || isNaN(preco) || preco <= 0) errors.preco = 'Informe um preço válido';
  const estoque = parseInt(data.estoque, 10);
  if (!data.estoque.trim() || isNaN(estoque) || estoque < 0)
    errors.estoque = 'Informe a quantidade em estoque';
  const missingSpecs = getMissingSpecs(data.tipoProduto);
  if (missingSpecs.length > 0 && !errors.tipoProduto)
    errors.tipoProduto = 'Preencha todas as variações do produto';
  return { errors, missingSpecs };
}

export function EditStage({
  data,
  onChange,
  onPublicar,
  onTrocarFoto,
  saving = false,
  imageUri,
}: {
  data: ProductData;
  onChange: (key: keyof ProductData, value: string | string[] | TipoProdutoValue | null) => void;
  onPublicar: () => void;
  onTrocarFoto?: () => void;
  saving?: boolean;
  imageUri: string | null;
}) {
  const [newTag, setNewTag] = useState('');
  const [imgLoading, setImgLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [missingSpecs, setMissingSpecs] = useState<string[]>([]);

  const scrollRef = useRef<ScrollView>(null);
  const fieldPositions = useRef<Partial<Record<FieldKey, number>>>({});
  const selectorWrapY = useRef(0);
  const specPositions = useRef<Record<string, number>>({});

  const handleChange = useCallback(
    <K extends keyof ProductData>(key: K, value: ProductData[K]) => {
      onChange(key, value as string | string[] | TipoProdutoValue | null);
      if (key in errors)
        setErrors((prev) => {
          const next = { ...prev };
          delete next[key as FieldKey];
          return next;
        });
      if (key === 'tipoProduto') {
        const next = value as TipoProdutoValue | null;
        setMissingSpecs((prev) => prev.filter((id) => (next?.specs[id] ?? []).length === 0));
      }
    },
    [onChange, errors],
  );

  const handlePublicar = useCallback(() => {
    const { errors: errs, missingSpecs: missing } = validate(data);
    setErrors(errs);
    setMissingSpecs(missing);
    if (Object.keys(errs).length > 0 || missing.length > 0) {
      const tipoProdutoIdx = FIELD_ORDER.indexOf('tipoProduto');
      const firstFieldKey = FIELD_ORDER.find((k) => errs[k]);
      const firstFieldIdx = firstFieldKey ? FIELD_ORDER.indexOf(firstFieldKey) : Infinity;
      // se o primeiro erro é 'nome' (antes do selector), vai pra ele
      // em todos os outros casos com specs faltando, vai pro spec exato
      if (missing.length > 0 && firstFieldIdx >= tipoProdutoIdx) {
        const specY =
          (fieldPositions.current['tipoProduto'] ?? 0) +
          selectorWrapY.current +
          (specPositions.current[missing[0]] ?? 0);
        scrollRef.current?.scrollTo({ y: specY - 16, animated: true });
      } else if (firstFieldKey) {
        scrollRef.current?.scrollTo({
          y: (fieldPositions.current[firstFieldKey] ?? 0) - 16,
          animated: true,
        });
      }
      return;
    }
    onPublicar();
  }, [data, onPublicar]);

  const addTag = useCallback(() => {
    if (!newTag.trim()) return;
    handleChange('tags', [...data.tags, newTag.trim().toLowerCase()]);
    setNewTag('');
  }, [newTag, data.tags, handleChange]);

  const removeTag = useCallback(
    (tag: string) => {
      handleChange(
        'tags',
        data.tags.filter((t) => t !== tag),
      );
    },
    [data.tags, handleChange],
  );

  const recordY = (key: FieldKey) => (e: { nativeEvent: { layout: { y: number } } }) => {
    fieldPositions.current[key] = e.nativeEvent.layout.y;
  };

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.editContent}
    >
      {imageUri && (
        <View style={styles.productImageContainer}>
          <View style={styles.productImageWrap}>
            <Image
              source={{ uri: imageUri }}
              style={styles.productImage}
              resizeMode="cover"
              onLoadEnd={() => setImgLoading(false)}
              onError={() => setImgLoading(false)}
            />
            {imgLoading && (
              <View style={styles.productImageOverlay}>
                <ActivityIndicator color={colors.orange} size="large" />
              </View>
            )}
          </View>
          {onTrocarFoto && (
            <TouchableOpacity
              style={styles.trocarFotoBtn}
              onPress={onTrocarFoto}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={14} color="#fff" />
              <Text style={styles.trocarFotoText}>Trocar foto</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.iaBadgeSmall}>
        <Text style={styles.iaBadgeSmallText}>✦ Preenchido pela Aju IA</Text>
      </View>

      <View style={styles.fieldGroup} onLayout={recordY('nome')}>
        <Text style={[styles.fieldLabel, errors.nome && styles.labelError]}>Nome do produto</Text>
        <TextInput
          style={[styles.input, errors.nome && styles.inputError]}
          value={data.nome}
          onChangeText={(v) => handleChange('nome', v)}
          placeholder="Nome do produto"
        />
        {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}
      </View>

      <View style={styles.fieldGroup} onLayout={recordY('tipoProduto')}>
        <Text
          style={[
            styles.fieldLabel,
            errors.tipoProduto && !data.tipoProduto?.catId && styles.labelError,
          ]}
        >
          Tipo de produto
        </Text>
        <View
          style={styles.selectorWrap}
          onLayout={(e) => {
            selectorWrapY.current = e.nativeEvent.layout.y;
          }}
        >
          <TipoProdutoSelector
            value={data.tipoProduto}
            onChange={(v) => handleChange('tipoProduto', v)}
            missingSpecs={missingSpecs}
            onSpecLayout={(positions) => {
              specPositions.current = positions;
            }}
          />
        </View>
        {errors.tipoProduto && <Text style={styles.errorText}>{errors.tipoProduto}</Text>}
      </View>

      <View style={styles.fieldGroup} onLayout={recordY('descricao')}>
        <Text style={[styles.fieldLabel, errors.descricao && styles.labelError]}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline, errors.descricao && styles.inputError]}
          value={data.descricao}
          onChangeText={(v) => handleChange('descricao', v)}
          placeholder="Descrição do produto…"
          multiline
          numberOfLines={3}
        />
        {errors.descricao && <Text style={styles.errorText}>{errors.descricao}</Text>}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Tags sugeridas</Text>
        <View style={styles.tagsWrap}>
          {data.tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.tag}
              onPress={() => removeTag(tag)}
              activeOpacity={0.7}
            >
              <Text style={styles.tagText}>#{tag}</Text>
              <Text style={styles.tagRemove}>×</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.tagInput}>
            <TextInput
              style={styles.tagInputField}
              value={newTag}
              onChangeText={setNewTag}
              onSubmitEditing={addTag}
              placeholder="+ tag"
              placeholderTextColor={colors.n600}
              returnKeyType="done"
            />
          </View>
        </View>
      </View>

      <View style={styles.rowFields} onLayout={recordY('preco')}>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={[styles.fieldLabel, errors.preco && styles.labelError]}>Preço (R$)</Text>
          <TextInput
            style={[styles.input, errors.preco && styles.inputError]}
            value={data.preco}
            onChangeText={(v) => handleChange('preco', v.replace(/[^0-9.,]/g, ''))}
            placeholder="0,00"
            keyboardType="decimal-pad"
          />
          {errors.preco && <Text style={styles.errorText}>{errors.preco}</Text>}
        </View>
        <View style={[styles.fieldGroup, { flex: 1 }]} onLayout={recordY('estoque')}>
          <Text style={[styles.fieldLabel, errors.estoque && styles.labelError]}>Estoque</Text>
          <TextInput
            style={[styles.input, errors.estoque && styles.inputError]}
            value={data.estoque}
            onChangeText={(v) => handleChange('estoque', v.replace(/[^0-9]/g, ''))}
            placeholder="0"
            keyboardType="number-pad"
          />
          {errors.estoque && <Text style={styles.errorText}>{errors.estoque}</Text>}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.publishBtn, saving && { opacity: 0.7 }]}
        onPress={handlePublicar}
        activeOpacity={0.85}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.publishBtnText}>Publicar produto</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  productImageContainer: { width: '100%', marginBottom: 4 },
  productImageWrap: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    backgroundColor: '#F0F1F5',
    overflow: 'hidden',
  },
  productImage: { width: '100%', height: '100%' },
  productImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240,241,245,0.7)',
  },
  editContent: { padding: 16, gap: 14 },
  iaBadgeSmall: {
    backgroundColor: '#FFEAD4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  iaBadgeSmallText: { fontSize: 12, color: '#DE6708', fontWeight: '600' },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7390',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  labelError: { color: '#DC2626' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000933',
  },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  selectorWrap: { padding: 2 },
  errorText: { fontSize: 11, color: '#DC2626', fontWeight: '500' },
  rowFields: { flexDirection: 'row', gap: 10 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEAD4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
  },
  tagText: { fontSize: 12, fontWeight: '600', color: '#DE6708' },
  tagRemove: { fontSize: 14, color: '#DE6708', opacity: 0.6 },
  tagInput: {
    borderWidth: 1,
    borderColor: '#E4E7F1',
    borderStyle: 'dashed',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagInputField: { fontSize: 12, color: '#000933', minWidth: 50 },
  trocarFotoBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
  },
  trocarFotoText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  publishBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F2760F',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  publishBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
