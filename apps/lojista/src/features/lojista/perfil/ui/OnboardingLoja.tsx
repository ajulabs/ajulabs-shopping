import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { useTheme } from '../../../../shared/hooks';
import { useOnboarding, TOTAL_STEPS } from '../model/useOnboarding';
import { StepVisual } from './components/StepVisual';
import { StepInfo } from './components/StepInfo';
import { StepHorarios } from './components/StepHorarios';

export function OnboardingLoja() {
  const insets = useSafeAreaInsets();
  const {
    step,
    setStep,
    saving,
    logoUri,
    bannerUri,
    uploading,
    categoria,
    setCategoria,
    descricao,
    setDescricao,
    horarios,
    lojaNome,
    updateHorario,
    pickImage,
    salvarEAvancar,
    pular,
  } = useOnboarding();
  const theme = useTheme();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          s.header,
          {
            backgroundColor: theme.surf,
            borderBottomColor: theme.border,
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <View style={s.headerTop}>
          {step > 1 ? (
            <TouchableOpacity
              onPress={() => setStep((v) => v - 1)}
              style={s.backBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={22} color={theme.text} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
          <Text style={[s.headerStep, { color: theme.textMut }]}>
            {step} de {TOTAL_STEPS}
          </Text>
          <TouchableOpacity onPress={pular} activeOpacity={0.7}>
            <Text style={[s.skipText, { color: theme.textSec }]}>Pular</Text>
          </TouchableOpacity>
        </View>

        <View style={s.progressBar}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                s.progressSegment,
                { backgroundColor: i < step ? colors.orange : theme.border },
              ]}
            />
          ))}
        </View>

        <Text style={[s.headerWelcome, { color: theme.text }]}>
          Bem-vindo, {lojaNome || 'lojista'}! 🎉
        </Text>
        <Text style={[s.headerSub, { color: theme.textSec }]}>
          Configure sua loja em 3 passos rápidos
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {step === 1 && (
          <StepVisual
            lojaNome={lojaNome}
            logoUri={logoUri}
            bannerUri={bannerUri}
            uploading={uploading}
            onPickLogo={() => pickImage('logo')}
            onPickBanner={() => pickImage('banner')}
          />
        )}
        {step === 2 && (
          <StepInfo
            categoria={categoria}
            descricao={descricao}
            onCategoria={setCategoria}
            onDescricao={setDescricao}
          />
        )}
        {step === 3 && <StepHorarios horarios={horarios} onChange={updateHorario} />}
      </ScrollView>

      <View style={[s.footer, { backgroundColor: theme.surf, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[s.nextBtn, (saving || uploading !== null) && { opacity: 0.7 }]}
          onPress={salvarEAvancar}
          disabled={saving || uploading !== null}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={s.nextBtnText}>{step === TOTAL_STEPS ? 'Finalizar' : 'Próximo'}</Text>
              <Ionicons
                name={step === TOTAL_STEPS ? 'checkmark' : 'arrow-forward'}
                size={18}
                color="#fff"
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.n100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStep: { fontSize: 13, fontWeight: '600', color: colors.n600 },
  skipText: { fontSize: 13, fontWeight: '600', color: colors.n600 },
  progressBar: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  headerWelcome: { fontSize: 20, fontWeight: '800', color: colors.navy },
  headerSub: { fontSize: 13, color: colors.n600, marginTop: 4 },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.n100,
    backgroundColor: '#fff',
  },
  nextBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
