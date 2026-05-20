import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LojistaService } from '@ajulabs/api-client';
import { colors } from '../../../../theme';
import { useAuthLojistaStore } from '../../auth/model/store';
import { TipoProdutoValue, derivarCategoriaString } from '../model/tipoProdutos';
import { Stepper } from './NovoProdutoStepper';
import { CaptureStage } from './NovoProdutoCaptureStage';
import { AnalyzingStage } from './NovoProdutoAnalyzingStage';
import { EditStage, ProductData } from './NovoProdutoEditStage';

type Stage = 'capture' | 'analyzing' | 'edit';

interface NovoProdutoProps {
  dark?: boolean;
  onPublicar?: (data: ProductData) => void;
  onVoltar?: () => void;
}

const EMPTY_DATA: ProductData = {
  nome: '', categoria: '', descricao: '', tags: [],
  preco: '', estoque: '', variacoes: [], tipoProduto: null,
};

export function NovoProduto({ dark = false, onPublicar, onVoltar }: NovoProdutoProps) {
  const token  = useAuthLojistaStore(s => s.token);
  const lojaId = useAuthLojistaStore(s => s.lojaId);

  const [stage, setStage]               = useState<Stage>('capture');
  const [saving, setSaving]             = useState(false);
  const [imageUri, setImageUri]         = useState<string | null>(null);
  const [showSuccess, setShowSuccess]   = useState(false);
  const [publishedName, setPublishedName] = useState('');
  const [productData, setProductData]   = useState<ProductData>(EMPTY_DATA);

  const textColor = dark ? colors.n0    : colors.navy;
  const subColor  = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const bgMain    = dark ? '#0B0F22'    : colors.n50;
  const surface   = dark ? '#111638'    : colors.n0;
  const border    = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  const stepIndex = stage === 'capture' ? 0 : stage === 'analyzing' ? 1 : 2;

  const handleVoltar = useCallback(() => {
    setStage('capture');
    setImageUri(null);
    setProductData(EMPTY_DATA);
  }, []);

  const handleCapture = useCallback(async (uri: string) => {
    setImageUri(uri);
    setStage('analyzing');
    try {
      const data = await LojistaService.analisarImagem(token!, uri);
      setProductData({
        nome: data.nome ?? '',
        categoria: data.categoria ?? '',
        descricao: data.descricao ?? '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        preco: data.preco ?? '',
        estoque: data.estoque ?? '',
        variacoes: [],
        tipoProduto: null,
      });
    } catch {
      Alert.alert('Aviso', 'Não foi possível analisar a imagem. Preencha os dados manualmente.');
    } finally {
      setStage('edit');
    }
  }, [token]);

  const handleChange = useCallback((
    key: keyof ProductData,
    value: string | string[] | TipoProdutoValue | null,
  ) => {
    setProductData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handlePublicar = useCallback(async () => {
    if (!token || !lojaId) {
      Alert.alert('Erro', 'Sessão inválida. Faça login novamente.');
      return;
    }
    const preco = parseFloat(productData.preco.replace(',', '.'));
    const estoque = parseInt(productData.estoque, 10);
    if (isNaN(preco) || preco <= 0) {
      Alert.alert('Erro', 'Informe um preço válido.');
      return;
    }
    const categoriaFinal = productData.tipoProduto
      ? derivarCategoriaString(productData.tipoProduto)
      : productData.categoria;
    setSaving(true);
    try {
      await LojistaService.criarProduto(token, {
        lojaId,
        nome: productData.nome,
        descricao: productData.descricao,
        preco,
        estoque: isNaN(estoque) ? 0 : estoque,
        categoria: categoriaFinal,
        tags: productData.tags,
        imageUri: imageUri ?? undefined,
      });
      onPublicar?.(productData);
      setPublishedName(productData.nome);
      setShowSuccess(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao publicar produto.';
      Alert.alert('Erro', msg);
    } finally {
      setSaving(false);
    }
  }, [token, lojaId, productData, imageUri, onPublicar]);

  const handleSuccessOk = useCallback(() => {
    setShowSuccess(false);
    if (onVoltar) {
      onVoltar();
    } else {
      setStage('capture');
      setImageUri(null);
      setProductData(EMPTY_DATA);
    }
  }, [onVoltar]);

  const isEdit = stage === 'edit';

  return (
    <View style={[styles.container, { backgroundColor: bgMain }]}>
      <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}>
        {(isEdit || onVoltar) && (
          <TouchableOpacity style={styles.backBtn} onPress={isEdit ? handleVoltar : onVoltar} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={textColor} />
          </TouchableOpacity>
        )}
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {isEdit ? 'Revisar e publicar' : 'Adicionar produto'}
          </Text>
          <Text style={[styles.headerSub, { color: subColor }]}>
            {isEdit ? 'IA preencheu pra você — só ajustar' : 'Foto + IA = cadastro em 20s'}
          </Text>
        </View>
      </View>

      <View style={[styles.stepperWrapper, { backgroundColor: surface, borderBottomColor: border }]}>
        <Stepper current={stepIndex} />
      </View>

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
          saving={saving}
          imageUri={imageUri}
        />
      )}

      <Modal visible={showSuccess} transparent animationType="fade" onRequestClose={handleSuccessOk}>
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={56} color="#F2760F" />
            </View>
            <Text style={styles.successTitle}>Produto publicado!</Text>
            <Text style={styles.successMsg}>
              <Text style={{ fontWeight: '700' }}>"{publishedName}"</Text>
              {' foi adicionado à sua vitrine com sucesso.'}
            </Text>
            <TouchableOpacity style={styles.successBtn} onPress={handleSuccessOk} activeOpacity={0.8}>
              <Text style={styles.successBtnText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 10,
                     paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn:         { width: 34, height: 34, borderRadius: 17,
                     backgroundColor: 'rgba(0,0,0,0.06)',
                     alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerInfo:      { flex: 1 },
  headerTitle:     { fontWeight: '600', fontSize: 17, letterSpacing: -0.3 },
  headerSub:       { fontSize: 12, color: '#6B7390', marginTop: 1 },
  stepperWrapper:  { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  successOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
                     justifyContent: 'center', alignItems: 'center', padding: 24 },
  successBox:      { backgroundColor: '#fff', borderRadius: 24, padding: 28,
                     width: '100%', alignItems: 'center', gap: 10 },
  successIconWrap: { width: 88, height: 88, borderRadius: 44,
                     backgroundColor: '#FFF3E8',
                     alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  successTitle:    { fontSize: 22, fontWeight: '800', color: '#000933', letterSpacing: -0.4 },
  successMsg:      { fontSize: 14, color: '#6B7390', textAlign: 'center', lineHeight: 20 },
  successBtn:      { marginTop: 8, width: '100%', height: 50, borderRadius: 14,
                     backgroundColor: '#F2760F', alignItems: 'center', justifyContent: 'center' },
  successBtnText:  { fontSize: 15, fontWeight: '700', color: '#fff' },
});
