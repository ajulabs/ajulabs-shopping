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
import { VariacoesSection, VariacaoEstoque } from '../../../../entities/produto';
import { TipoProdutoValue } from '../model/tipoProdutos';
import { useNovoProdutoEditStage } from '../model/useNovoProdutoEditStage';
import { ProductData } from '../lib/types';
import { TipoProdutoSelector } from './TipoProdutoSelector';
import { TagsInput } from './components/TagsInput';

export type { ProductData } from '../lib/types';

export function EditStage({
  data,
  onChange,
  onPublicar,
  onTrocarFoto,
  saving = false,
  imageUri,
}: {
  data: ProductData;
  onChange: (
    key: keyof ProductData,
    value: string | string[] | TipoProdutoValue | null | VariacaoEstoque[],
  ) => void;
  onPublicar: () => void;
  onTrocarFoto?: () => void;
  saving?: boolean;
  imageUri: string | null;
}) {
  const {
    newTag,
    setNewTag,
    imgLoading,
    setImgLoading,
    errors,
    missingSpecs,
    scrollRef,
    selectorWrapY,
    specPositions,
    hasVariacoes,
    handleChange,
    handlePublicar,
    addTag,
    removeTag,
    recordY,
  } = useNovoProdutoEditStage({ data, onChange, onPublicar });

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

      {/* Variações geradas automaticamente pelo produto cartesiano */}
      {hasVariacoes && (
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Variações do produto</Text>
          <VariacoesSection
            variacoes={data.variacoesEstoque}
            precoBase={data.preco}
            onChange={(v) => handleChange('variacoesEstoque', v)}
          />
        </View>
      )}

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

      <TagsInput
        tags={data.tags}
        newTag={newTag}
        onChangeNewTag={setNewTag}
        onAddTag={addTag}
        onRemoveTag={removeTag}
      />

      {/* Preço sempre visível; estoque global só quando não há variações */}
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

        {!hasVariacoes && (
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
        )}
      </View>

      {hasVariacoes && (
        <View style={styles.estoqueAutoRow}>
          <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
          <Text style={styles.estoqueAutoText}>
            Estoque total calculado pelas variações:{' '}
            <Text style={{ fontWeight: '700' }}>
              {data.variacoesEstoque.reduce((s, v) => s + (v.estoque || 0), 0)} unidades
            </Text>
          </Text>
        </View>
      )}

      {!imageUri && <Text style={styles.imagemRequiredHint}>A foto do produto é obrigatória.</Text>}
      <TouchableOpacity
        style={[styles.publishBtn, (saving || !imageUri) && { opacity: 0.5 }]}
        onPress={handlePublicar}
        activeOpacity={0.85}
        disabled={saving || !imageUri}
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
  estoqueAutoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
  },
  estoqueAutoText: { fontSize: 12, color: '#15803D', flex: 1 },
  publishBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F2760F',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  publishBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  imagemRequiredHint: {
    fontSize: 12.5,
    color: '#9B1C1C',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
});
