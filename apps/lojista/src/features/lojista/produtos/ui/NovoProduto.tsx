// src/features/lojista/produtos/ui/NovoProduto.tsx
import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../../../theme';

// ─── Tipos ────────────────────────────────────────────────────
type Stage = 'capture' | 'analyzing' | 'edit';

interface ProductData {
  nome: string;
  categoria: string;
  descricao: string;
  tags: string[];
  preco: string;
  estoque: string;
  variacoes: string[];
}

interface NovoProdutoProps {
  dark?: boolean;
  onPublicar?: (data: ProductData) => void;
}

// ─── Stepper ──────────────────────────────────────────────────
const STEPS = ['Foto', 'IA analisa', 'Revisar', 'Publicar'];

function Stepper({ current }: { current: number }) {
  return (
    <View style={styles.stepperRow}>
      {STEPS.map((label, i) => {
        const isDone    = i < current;
        const isActive  = i === current;
        const isPending = i > current;
        return (
          <View key={label} style={styles.stepItem}>
            <View style={styles.stepTop}>
              {i > 0 && (
                <View style={[styles.stepLine, { backgroundColor: isDone || isActive ? colors.orange : colors.n200 }]} />
              )}
              <View style={[
                styles.stepCircle,
                isActive  && { backgroundColor: colors.orange },
                isDone    && { backgroundColor: colors.orange },
                isPending && { backgroundColor: colors.n100 },
              ]}>
                <Text style={[
                  styles.stepNum,
                  (isActive || isDone) && { color: '#fff' },
                  isPending && { color: colors.n600 },
                ]}>
                  {isDone ? '✓' : String(i + 1)}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: isDone ? colors.orange : colors.n200 }]} />
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              (isActive || isDone) ? { color: colors.navy } : { color: colors.n600 },
              isActive && { fontWeight: '600' },
            ]}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Stage 1: Captura ─────────────────────────────────────────
function CaptureStage({ onCapture }: { onCapture: (uri: string) => void }) {
  const handleCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para fotografar o produto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onCapture(result.assets[0].uri);
    }
  }, [onCapture]);

  const handleGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onCapture(result.assets[0].uri);
    }
  }, [onCapture]);

  return (
    <View style={styles.content}>
      {/* Card IA */}
      <View style={styles.iaCard}>
        <View style={styles.iaDecoCircle} />
        <View style={styles.iaDecoCircle2} />
        <View style={styles.iaBadge}>
          <Text style={styles.iaBadgeText}>✨ Cadastro com IA</Text>
        </View>
        <Text style={styles.iaTitle}>{'Tire uma foto.\nA IA faz o resto.'}</Text>
        <Text style={styles.iaDesc}>
          Nome, categoria, descrição e tags — tudo preenchido automaticamente. Você só confirma.
        </Text>
      </View>

      {/* Área de foto */}
      <TouchableOpacity style={styles.photoArea} onPress={handleCamera} activeOpacity={0.85}>
        <View style={styles.photoIcon}>
          <Text style={{ fontSize: 28 }}>📷</Text>
        </View>
        <Text style={styles.photoTitle}>Tirar foto do produto</Text>
        <Text style={styles.photoSub}>ou toque para escolher da galeria</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.galleryBtn} onPress={handleGallery} activeOpacity={0.8}>
        <Text style={styles.galleryBtnText}>Escolher da galeria</Text>
      </TouchableOpacity>

      {/* O que a IA vai fazer */}
      <Text style={styles.sectionLabel}>O que a IA vai preencher</Text>
      <View style={styles.stagesList}>
        {[
          'Nome do produto',
          'Categoria e subcategoria',
          'Descrição otimizada para busca',
          'Tags de busca sugeridas',
          'Sugestão de preço baseada no mercado',
        ].map(item => (
          <View key={item} style={styles.stageRow}>
            <View style={styles.stageDot} />
            <Text style={styles.stageText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Stage 2: Analisando ──────────────────────────────────────
function AnalyzingStage() {
  return (
    <View style={[styles.content, styles.analyzingContainer]}>
      <View style={styles.analyzingCard}>
        <ActivityIndicator size="large" color={colors.orange} />
        <Text style={styles.analyzingTitle}>IA analisando sua foto…</Text>
        <Text style={styles.analyzingDesc}>
          Identificando categoria, cor e sugestões de preço
        </Text>
        <View style={styles.analyzeSteps}>
          {['Identificando produto…', 'Gerando descrição otimizada…', 'Sugerindo tags de busca…'].map((t, i) => (
            <View key={i} style={styles.analyzeStep}>
              <View style={[styles.analyzeStepDot, { backgroundColor: colors.orange }]} />
              <Text style={styles.analyzeStepText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Stage 3: Editar ──────────────────────────────────────────
function EditStage({
  data, onChange, onPublicar,
}: {
  data: ProductData;
  onChange: (key: keyof ProductData, value: string | string[]) => void;
  onPublicar: () => void;
}) {
  const [newTag, setNewTag] = useState('');

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
      {/* Badge IA */}
      <View style={styles.iaBadgeSmall}>
        <Text style={styles.iaBadgeSmallText}>✨ Preenchido pela Aju IA — revise e publique</Text>
      </View>

      {/* Nome */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Nome do produto</Text>
        <TextInput
          style={styles.input}
          value={data.nome}
          onChangeText={v => onChange('nome', v)}
          placeholder="Nome do produto"
        />
      </View>

      {/* Categoria */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Categoria</Text>
        <TextInput
          style={styles.input}
          value={data.categoria}
          onChangeText={v => onChange('categoria', v)}
          placeholder="Ex: Calçados, Roupas, Joias…"
        />
      </View>

      {/* Descrição */}
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

      {/* Tags */}
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

      {/* Preço e Estoque */}
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

      {/* Variações */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Variações (tamanhos)</Text>
        <View style={styles.variacoesWrap}>
          {['PP', 'P', 'M', 'G', 'GG', '38', '39', '40', '41', '42'].map(v => {
            const selected = data.variacoes.includes(v);
            return (
              <TouchableOpacity
                key={v}
                onPress={() => {
                  const next = selected
                    ? data.variacoes.filter(x => x !== v)
                    : [...data.variacoes, v];
                  onChange('variacoes', next);
                }}
                style={[
                  styles.variacaoBtn,
                  selected && { backgroundColor: colors.navy, borderColor: colors.navy },
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.variacaoText, selected && { color: '#fff' }]}>{v}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Botão publicar */}
      <TouchableOpacity style={styles.publishBtn} onPress={onPublicar} activeOpacity={0.85}>
        <Text style={styles.publishBtnText}>Publicar produto</Text>
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

// ─── Tela principal ───────────────────────────────────────────
export function NovoProduto({ dark = false, onPublicar }: NovoProdutoProps) {
  const [stage, setStage] = useState<Stage>('capture');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [productData, setProductData] = useState<ProductData>({
    nome: '',
    categoria: '',
    descricao: '',
    tags: [],
    preco: '',
    estoque: '',
    variacoes: [],
  });

  const textColor = dark ? colors.n0    : colors.navy;
  const subColor  = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const bgMain    = dark ? '#0B0F22'    : colors.n50;
  const surface   = dark ? '#111638'    : colors.n0;
  const border    = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  const stepIndex = stage === 'capture' ? 0 : stage === 'analyzing' ? 1 : 2;

  const handleCapture = useCallback((uri: string) => {
    setImageUri(uri);
    setStage('analyzing');

    // Simula análise da IA (substituir por chamada real à API)
    setTimeout(() => {
      setProductData({
        nome: 'Tênis Casual Branco — Napa',
        categoria: 'Calçados',
        descricao: 'Tênis casual em napa sintética branca com solado emborrachado e detalhes em couro. Confortável para o dia a dia.',
        tags: ['branco', 'casual', 'masculino', 'napa', 'calçados'],
        preco: '149,90',
        estoque: '8',
        variacoes: ['40', '41', '42'],
      });
      setStage('edit');
    }, 2500);
  }, []);

  const handleChange = useCallback((key: keyof ProductData, value: string | string[]) => {
    setProductData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handlePublicar = useCallback(() => {
    // TODO: conectar com store/service para salvar o produto
    onPublicar?.(productData);
    Alert.alert('Produto publicado!', `"${productData.nome}" foi adicionado à sua vitrine.`);
    setStage('capture');
    setImageUri(null);
    setProductData({
      nome: '', categoria: '', descricao: '',
      tags: [], preco: '', estoque: '', variacoes: [],
    });
  }, [productData, onPublicar]);

  return (
    <View style={[styles.container, { backgroundColor: bgMain }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Adicionar produto</Text>
          <Text style={[styles.headerSub, { color: subColor }]}>Foto + IA = cadastro em 20s</Text>
        </View>
      </View>

      {/* Stepper */}
      <View style={[styles.stepperWrapper, { backgroundColor: surface, borderBottomColor: border }]}>
        <Stepper current={stepIndex} />
      </View>

      {/* Conteúdo por stage */}
      {stage === 'capture' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <CaptureStage onCapture={handleCapture} />
        </ScrollView>
      )}
      {stage === 'analyzing' && <AnalyzingStage />}
      {stage === 'edit' && (
        <EditStage
          data={productData}
          onChange={handleChange}
          onPublicar={handlePublicar}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1 },

  // Header
  header:             { padding: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  headerInfo:         { flex: 1 },
  headerTitle:        { fontWeight: '600', fontSize: 17, letterSpacing: -0.3 },
  headerSub:          { fontSize: 12, color: '#6B7390', marginTop: 1 },

  // Stepper
  stepperWrapper:     { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  stepperRow:         { flexDirection: 'row', alignItems: 'flex-start' },
  stepItem:           { flex: 1, alignItems: 'center' },
  stepTop:            { flexDirection: 'row', alignItems: 'center', width: '100%' },
  stepLine:           { flex: 1, height: 2, marginBottom: 0 },
  stepCircle:         { width: 28, height: 28, borderRadius: 14,
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNum:            { fontSize: 12, fontWeight: '700' },
  stepLabel:          { fontSize: 10, marginTop: 4, textAlign: 'center', fontWeight: '500' },

  // Content
  content:            { padding: 16, gap: 14 },

  // IA Card
  iaCard:             { backgroundColor: '#000933', borderRadius: 18, padding: 18,
                        overflow: 'hidden', position: 'relative' },
  iaDecoCircle:       { position: 'absolute', top: -20, right: -20, width: 100, height: 100,
                        borderRadius: 50, backgroundColor: 'rgba(242,118,15,0.1)' },
  iaDecoCircle2:      { position: 'absolute', bottom: -30, right: 20, width: 70, height: 70,
                        borderRadius: 35, backgroundColor: 'rgba(242,118,15,0.06)' },
  iaBadge:            { alignSelf: 'flex-start', backgroundColor: 'rgba(242,118,15,0.25)',
                        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, marginBottom: 10 },
  iaBadgeText:        { color: '#FFA05C', fontSize: 11, fontWeight: '600' },
  iaTitle:            { fontSize: 22, fontWeight: '700', color: '#fff',
                        lineHeight: 28, letterSpacing: -0.4 },
  iaDesc:             { fontSize: 13, color: 'rgba(255,255,255,0.65)',
                        marginTop: 8, lineHeight: 19 },

  // Foto
  photoArea:          { borderWidth: 2, borderColor: '#F2760F', borderStyle: 'dashed',
                        borderRadius: 18, backgroundColor: '#fff',
                        paddingVertical: 36, paddingHorizontal: 20,
                        alignItems: 'center', gap: 10 },
  photoIcon:          { width: 72, height: 72, borderRadius: 36,
                        backgroundColor: '#FFEAD4',
                        alignItems: 'center', justifyContent: 'center' },
  photoTitle:         { fontSize: 17, fontWeight: '600', color: '#000933' },
  photoSub:           { fontSize: 13, color: '#6B7390' },
  galleryBtn:         { height: 44, borderRadius: 12, borderWidth: 1.5,
                        borderColor: '#E4E7F1', alignItems: 'center', justifyContent: 'center' },
  galleryBtnText:     { fontSize: 14, fontWeight: '600', color: '#6B7390' },

  // O que a IA faz
  sectionLabel:       { fontSize: 11, fontWeight: '600', color: '#6B7390',
                        textTransform: 'uppercase', letterSpacing: 0.5 },
  stagesList:         { gap: 8 },
  stageRow:           { flexDirection: 'row', alignItems: 'center', gap: 10,
                        padding: 10, paddingHorizontal: 14,
                        backgroundColor: '#fff', borderRadius: 12,
                        borderWidth: 1, borderColor: '#E4E7F1' },
  stageDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F2760F' },
  stageText:          { fontSize: 13, color: '#6B7390' },

  // Analyzing
  analyzingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  analyzingCard:      { backgroundColor: '#fff', borderRadius: 20, padding: 24,
                        alignItems: 'center', gap: 14, width: '100%',
                        borderWidth: 1, borderColor: '#E4E7F1' },
  analyzingTitle:     { fontSize: 18, fontWeight: '600', color: '#000933', letterSpacing: -0.3 },
  analyzingDesc:      { fontSize: 13, color: '#6B7390', textAlign: 'center' },
  analyzeSteps:       { gap: 8, width: '100%', marginTop: 4 },
  analyzeStep:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  analyzeStepDot:     { width: 6, height: 6, borderRadius: 3 },
  analyzeStepText:    { fontSize: 13, color: '#6B7390' },

  // Edit
  editContent:        { padding: 16, gap: 14 },
  iaBadgeSmall:       { backgroundColor: '#FFEAD4', paddingHorizontal: 12,
                        paddingVertical: 8, borderRadius: 12 },
  iaBadgeSmallText:   { fontSize: 12, color: '#DE6708', fontWeight: '600' },
  fieldGroup:         { gap: 6 },
  fieldLabel:         { fontSize: 12, fontWeight: '600', color: '#6B7390',
                        textTransform: 'uppercase', letterSpacing: 0.4 },
  input:              { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E4E7F1',
                        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                        fontSize: 14, color: '#000933' },
  inputMultiline:     { minHeight: 80, textAlignVertical: 'top' },
  rowFields:          { flexDirection: 'row', gap: 10 },
  tagsWrap:           { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:                { flexDirection: 'row', alignItems: 'center', gap: 4,
                        backgroundColor: '#FFEAD4', paddingHorizontal: 10,
                        paddingVertical: 6, borderRadius: 99 },
  tagText:            { fontSize: 12, fontWeight: '600', color: '#DE6708' },
  tagRemove:          { fontSize: 14, color: '#DE6708', opacity: 0.6 },
  tagInput:           { borderWidth: 1, borderColor: '#E4E7F1', borderStyle: 'dashed',
                        borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  tagInputField:      { fontSize: 12, color: '#000933', minWidth: 50 },
  variacoesWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variacaoBtn:        { width: 44, height: 38, borderRadius: 10,
                        backgroundColor: '#F4F5FA', borderWidth: 1, borderColor: '#E4E7F1',
                        alignItems: 'center', justifyContent: 'center' },
  variacaoText:       { fontSize: 12, fontWeight: '700', color: '#000933' },
  publishBtn:         { height: 50, borderRadius: 14, backgroundColor: '#F2760F',
                        alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  publishBtnText:     { fontSize: 15, fontWeight: '700', color: '#fff' },
});