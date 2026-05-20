import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { colors } from '../../../../theme';
import { TipoProdutoSelector } from './TipoProdutoSelector';
import { TipoProdutoValue } from '../model/tipoProdutos';

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

export function EditStage({
  data, onChange, onPublicar, saving = false, imageUri,
}: {
  data: ProductData;
  onChange: (key: keyof ProductData, value: string | string[] | TipoProdutoValue | null) => void;
  onPublicar: () => void;
  saving?: boolean;
  imageUri: string | null;
}) {
  const [newTag, setNewTag] = useState('');
  const [imgLoading, setImgLoading] = useState(true);

  const addTag = useCallback(() => {
    if (!newTag.trim()) return;
    onChange('tags', [...data.tags, newTag.trim().toLowerCase()]);
    setNewTag('');
  }, [newTag, data.tags, onChange]);

  const removeTag = useCallback((tag: string) => {
    onChange('tags', data.tags.filter(t => t !== tag));
  }, [data.tags, onChange]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.editContent}>
      {imageUri && (
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
      )}

      <View style={styles.iaBadgeSmall}>
        <Text style={styles.iaBadgeSmallText}>✦ Preenchido pela Aju IA</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Nome do produto</Text>
        <TextInput
          style={styles.input}
          value={data.nome}
          onChangeText={v => onChange('nome', v)}
          placeholder="Nome do produto"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Tipo de produto</Text>
        <TipoProdutoSelector
          value={data.tipoProduto}
          onChange={v => onChange('tipoProduto', v)}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={data.descricao}
          onChangeText={v => onChange('descricao', v)}
          placeholder="Descrição do produto…"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Tags sugeridas</Text>
        <View style={styles.tagsWrap}>
          {data.tags.map(tag => (
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

      <View style={styles.rowFields}>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={styles.fieldLabel}>Preço (R$)</Text>
          <TextInput
            style={styles.input}
            value={data.preco}
            onChangeText={v => onChange('preco', v)}
            placeholder="0,00"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={styles.fieldLabel}>Estoque</Text>
          <TextInput
            style={styles.input}
            value={data.estoque}
            onChangeText={v => onChange('estoque', v)}
            placeholder="0"
            keyboardType="number-pad"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.publishBtn, saving && { opacity: 0.7 }]}
        onPress={onPublicar}
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
  productImageWrap:    { width: '100%', height: 200, borderRadius: 14, marginBottom: 4,
                         backgroundColor: '#F0F1F5', overflow: 'hidden' },
  productImage:        { width: '100%', height: '100%' },
  productImageOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center',
                         justifyContent: 'center', backgroundColor: 'rgba(240,241,245,0.7)' },
  editContent:         { padding: 16, gap: 14 },
  iaBadgeSmall:        { backgroundColor: '#FFEAD4', paddingHorizontal: 12,
                         paddingVertical: 8, borderRadius: 12 },
  iaBadgeSmallText:    { fontSize: 12, color: '#DE6708', fontWeight: '600' },
  fieldGroup:          { gap: 6 },
  fieldLabel:          { fontSize: 12, fontWeight: '600', color: '#6B7390',
                         textTransform: 'uppercase', letterSpacing: 0.4 },
  input:               { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E4E7F1',
                         borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                         fontSize: 14, color: '#000933' },
  inputMultiline:      { minHeight: 80, textAlignVertical: 'top' },
  rowFields:           { flexDirection: 'row', gap: 10 },
  tagsWrap:            { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:                 { flexDirection: 'row', alignItems: 'center', gap: 4,
                         backgroundColor: '#FFEAD4', paddingHorizontal: 10,
                         paddingVertical: 6, borderRadius: 99 },
  tagText:             { fontSize: 12, fontWeight: '600', color: '#DE6708' },
  tagRemove:           { fontSize: 14, color: '#DE6708', opacity: 0.6 },
  tagInput:            { borderWidth: 1, borderColor: '#E4E7F1', borderStyle: 'dashed',
                         borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  tagInputField:       { fontSize: 12, color: '#000933', minWidth: 50 },
  publishBtn:          { height: 50, borderRadius: 14, backgroundColor: '#F2760F',
                         alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  publishBtnText:      { fontSize: 15, fontWeight: '700', color: '#fff' },
});
