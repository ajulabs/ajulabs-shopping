import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { useNovoProduto } from '../model/useNovoProduto';
import { ProductData } from '../lib/types';
import { Stepper } from './NovoProdutoStepper';
import { CaptureStage } from './NovoProdutoCaptureStage';
import { AnalyzingStage } from './NovoProdutoAnalyzingStage';
import { EditStage } from './NovoProdutoEditStage';

interface NovoProdutoProps {
  dark?: boolean;
  onPublicar?: (data: ProductData) => void;
  onVoltar?: () => void;
}

export function NovoProduto({ dark = false, onPublicar, onVoltar }: NovoProdutoProps) {
  const {
    stage,
    stepIndex,
    saving,
    imageUri,
    showSuccess,
    publishedName,
    productData,
    analisarErro,
    limparAnalisarErro,
    handleVoltarStage,
    handleCapture,
    handleTrocarFoto,
    handleChange,
    handlePublicar,
    handleSuccessOk,
  } = useNovoProduto({ onPublicar, onVoltar });

  const textColor = dark ? colors.n0 : colors.navy;
  const subColor = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const bgMain = dark ? '#0B0F22' : colors.n50;
  const surface = dark ? '#111638' : colors.n0;
  const border = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  const isEdit = stage === 'edit';

  return (
    <View style={[styles.container, { backgroundColor: bgMain }]}>
      <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}>
        {(isEdit || onVoltar) && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={isEdit ? handleVoltarStage : onVoltar}
            activeOpacity={0.7}
          >
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

      <View
        style={[styles.stepperWrapper, { backgroundColor: surface, borderBottomColor: border }]}
      >
        <Stepper current={stepIndex} />
      </View>

      {stage === 'edit' && analisarErro && (
        <View style={styles.errorBanner}>
          <View style={styles.errorBannerIcon}>
            <Ionicons name="alert-circle" size={20} color="#9B1C1C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.errorBannerTitle}>{analisarErro.titulo}</Text>
            <Text style={styles.errorBannerDesc}>{analisarErro.descricao}</Text>
          </View>
          <TouchableOpacity onPress={limparAnalisarErro} hitSlop={8} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color="#9B1C1C" />
          </TouchableOpacity>
        </View>
      )}

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
          onTrocarFoto={handleTrocarFoto}
          saving={saving}
          imageUri={imageUri}
        />
      )}

      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessOk}
      >
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
            <TouchableOpacity
              style={styles.successBtn}
              onPress={handleSuccessOk}
              activeOpacity={0.8}
            >
              <Text style={styles.successBtnText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontWeight: '600', fontSize: 17, letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: '#6B7390', marginTop: 1 },
  stepperWrapper: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
  },
  errorBannerIcon: { marginTop: 1 },
  errorBannerTitle: { fontSize: 13.5, fontWeight: '700', color: '#9B1C1C' },
  errorBannerDesc: { fontSize: 12.5, color: '#7F1D1D', marginTop: 2, lineHeight: 17 },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  successIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#000933', letterSpacing: -0.4 },
  successMsg: { fontSize: 14, color: '#6B7390', textAlign: 'center', lineHeight: 20 },
  successBtn: {
    marginTop: 8,
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F2760F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
