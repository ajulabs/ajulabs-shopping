import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../model/useOnboarding';
import { StepPessoal } from './components/StepPessoal';
import { StepDocs } from './components/StepDocs';
import { StepTransporte } from './components/StepTransporte';
import { StepVeiculo } from './components/StepVeiculo';
import { StepBancario } from './components/StepBancario';
import { StepRevisao } from './components/StepRevisao';
import { DocPickerModal } from './components/DocPickerModal';
import { useMemo } from 'react';
import { useTheme } from '../../../../shared/hooks';
import type { Theme } from '../../../../shared/hooks/useTheme';

interface OnboardingScreenProps {
  onDone: (result: 'submitted' | 'cancel') => void;
}

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const {
    step,
    data,
    erros,
    submitError,
    loading,
    scrollRef,
    photoUri,
    frenteUri,
    versoUri,
    docModal,
    setDocModal,
    locLoading,
    gpsCoords,
    onBlurCpf,
    onBlurEmail,
    pickDoc,
    launchCamera,
    launchGallery,
    pickPhoto,
    handlePinMoved,
    usarLocalizacao,
    up,
    steps,
    isLast,
    cur,
    next,
    prev,
    onClearGps,
  } = useOnboarding({ onDone });

  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={prev} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={18} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.headerStep}>
              Passo {step + 1} de {steps.length}
            </Text>
            <Text style={s.headerTitle}>{cur.title}</Text>
          </View>
        </View>
        <View style={s.progressBars}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[s.progressBar, { backgroundColor: i <= step ? '#F2760F' : '#E4E7F1' }]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {cur.title === 'Dados pessoais' && (
          <StepPessoal
            data={data}
            up={up}
            erros={erros}
            photoUri={photoUri}
            onPickPhoto={pickPhoto}
            onGps={usarLocalizacao}
            locLoading={locLoading}
            gpsCoords={gpsCoords}
            onPinMoved={handlePinMoved}
            onClearGps={onClearGps}
            onBlurCpf={onBlurCpf}
            onBlurEmail={onBlurEmail}
          />
        )}
        {cur.title === 'Documentos' && (
          <StepDocs
            frenteUri={frenteUri}
            versoUri={versoUri}
            onPickDoc={pickDoc}
            tipoTransporte={data.transporte || 'moto'}
          />
        )}
        {cur.title === 'Transporte' && <StepTransporte data={data} up={up} erros={erros} />}
        {cur.title === 'Veículo' && <StepVeiculo data={data} up={up} erros={erros} />}
        {cur.title === 'Bancário' && <StepBancario data={data} up={up} erros={erros} />}
        {cur.title === 'Revisão' && <StepRevisao data={data} />}
      </ScrollView>

      <View style={s.footer}>
        {submitError ? <Text style={s.submitError}>{submitError}</Text> : null}
        <TouchableOpacity
          style={[s.ctaBtn, loading && { opacity: 0.7 }]}
          onPress={next}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={s.ctaBtnText}>{isLast ? 'Enviar cadastro' : 'Continuar'}</Text>
              {!isLast && <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />}
            </>
          )}
        </TouchableOpacity>
      </View>

      <DocPickerModal
        docModal={docModal}
        onClose={() => setDocModal(null)}
        onCamera={launchCamera}
        onGallery={launchGallery}
      />
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.surf },
    header: {
      padding: 16,
      paddingBottom: 0,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerStep: {
      fontSize: 11,
      color: theme.textMut,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text, letterSpacing: -0.3 },
    progressBars: { flexDirection: 'row', gap: 4, paddingBottom: 14 },
    progressBar: { flex: 1, height: 4, borderRadius: 99 },
    scroll: { flex: 1 },
    content: { padding: 22, paddingBottom: 20 },
    footer: {
      padding: 16,
      paddingBottom: 24,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.surf,
    },
    submitError: {
      fontSize: 12,
      color: '#E24B4A',
      textAlign: 'center',
      marginBottom: 10,
      fontWeight: '500',
    },
    ctaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#F2760F',
      borderRadius: 14,
      paddingVertical: 16,
    },
    ctaBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  });
}
