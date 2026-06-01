import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LojistaService } from '@ajulabs/api-client';
import { colors } from '../../../../theme';
import { useAuthLojistaStore } from '../../auth/model/store';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface HorarioDia {
  dia: string;
  abreviacao: string;
  ativo: boolean;
  abertura: string;
  fechamento: string;
}

interface CategoriaItem {
  label: string;
  icone: string;
}

// ── Dados estáticos ───────────────────────────────────────────────────────────

const CATEGORIAS: CategoriaItem[] = [
  { label: 'Alimentação', icone: 'restaurant-outline' },
  { label: 'Padaria e Confeitaria', icone: 'cafe-outline' },
  { label: 'Açougue e Peixaria', icone: 'fish-outline' },
  { label: 'Hortifrúti', icone: 'leaf-outline' },
  { label: 'Bebidas', icone: 'wine-outline' },
  { label: 'Calçados', icone: 'footsteps-outline' },
  { label: 'Roupas e Acessórios', icone: 'shirt-outline' },
  { label: 'Moda Infantil', icone: 'happy-outline' },
  { label: 'Moda Praia e Esporte', icone: 'water-outline' },
  { label: 'Bijuterias e Joias', icone: 'diamond-outline' },
  { label: 'Cosméticos e Beleza', icone: 'color-palette-outline' },
  { label: 'Farmácia', icone: 'medkit-outline' },
  { label: 'Eletrônicos', icone: 'phone-portrait-outline' },
  { label: 'Móveis e Decoração', icone: 'bed-outline' },
  { label: 'Papelaria e Livraria', icone: 'book-outline' },
  { label: 'Pet Shop', icone: 'paw-outline' },
  { label: 'Esportes e Lazer', icone: 'football-outline' },
  { label: 'Serviços', icone: 'build-outline' },
  { label: 'Outros', icone: 'storefront-outline' },
];

const HORARIOS_INICIAIS: HorarioDia[] = [
  { dia: 'Segunda-feira', abreviacao: 'Seg', ativo: true, abertura: '08:00', fechamento: '18:00' },
  { dia: 'Terça-feira', abreviacao: 'Ter', ativo: true, abertura: '08:00', fechamento: '18:00' },
  { dia: 'Quarta-feira', abreviacao: 'Qua', ativo: true, abertura: '08:00', fechamento: '18:00' },
  { dia: 'Quinta-feira', abreviacao: 'Qui', ativo: true, abertura: '08:00', fechamento: '18:00' },
  { dia: 'Sexta-feira', abreviacao: 'Sex', ativo: true, abertura: '08:00', fechamento: '18:00' },
  { dia: 'Sábado', abreviacao: 'Sáb', ativo: true, abertura: '09:00', fechamento: '14:00' },
  { dia: 'Domingo', abreviacao: 'Dom', ativo: false, abertura: '--:--', fechamento: '--:--' },
];

function formatarHora(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

function Toggle({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      activeOpacity={0.85}
      style={[s.toggleTrack, { backgroundColor: value ? colors.orange : colors.n300 }]}
    >
      <View style={[s.toggleThumb, { transform: [{ translateX: value ? 22 : 2 }] }]} />
    </TouchableOpacity>
  );
}

function StoreAvatar({ nome, size = 64 }: { nome: string; size?: number }) {
  const initials = nome
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size * 0.25 }]}>
      <Text style={[s.avatarText, { fontSize: size * 0.32 }]}>{initials || '?'}</Text>
    </View>
  );
}

function StepVisual({
  lojaNome,
  logoUri,
  bannerUri,
  uploading,
  onPickLogo,
  onPickBanner,
}: {
  lojaNome: string;
  logoUri: string | null;
  bannerUri: string | null;
  uploading: 'logo' | 'banner' | null;
  onPickLogo: () => void;
  onPickBanner: () => void;
}) {
  return (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>Identidade visual</Text>
      <Text style={s.stepSub}>
        Adicione o logo e uma foto de capa para sua loja aparecer com destaque no app.
      </Text>

      <Text style={s.fieldLabel}>FOTO DE CAPA (BANNER)</Text>
      <TouchableOpacity
        style={s.bannerPicker}
        onPress={onPickBanner}
        disabled={uploading !== null}
        activeOpacity={0.8}
      >
        {bannerUri ? (
          <Image source={{ uri: bannerUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
        <View
          style={[s.bannerOverlay, bannerUri ? { backgroundColor: 'rgba(0,0,0,0.35)' } : undefined]}
        >
          {uploading === 'banner' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="image-outline" size={28} color="#fff" />
              <Text style={s.bannerOverlayText}>
                {bannerUri ? 'Alterar capa' : 'Adicionar capa'}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      <Text style={[s.fieldLabel, { marginTop: 20 }]}>LOGO DA LOJA</Text>
      <View style={s.logoRow}>
        <TouchableOpacity
          style={s.logoBtn}
          onPress={onPickLogo}
          disabled={uploading !== null}
          activeOpacity={0.8}
        >
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={s.logoImg} />
          ) : (
            <StoreAvatar nome={lojaNome} size={72} />
          )}
          <View style={s.logoCamBtn}>
            {uploading === 'logo' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera-outline" size={14} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
        <View style={s.logoHint}>
          <Text style={s.logoHintTitle}>Adicione o logo da sua loja</Text>
          <Text style={s.logoHintSub}>Recomendado: imagem quadrada,{'\n'}mínimo 200×200px</Text>
        </View>
      </View>
    </View>
  );
}

function StepInfo({
  categoria,
  descricao,
  onCategoria,
  onDescricao,
}: {
  categoria: string;
  descricao: string;
  onCategoria: (v: string) => void;
  onDescricao: (v: string) => void;
}) {
  const [catOpen, setCatOpen] = useState(false);
  const selected = CATEGORIAS.find((c) => c.label === categoria);

  return (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>Sobre sua loja</Text>
      <Text style={s.stepSub}>
        Escolha a categoria e descreva o que sua loja vende para os clientes encontrarem você.
      </Text>

      <Text style={s.fieldLabel}>CATEGORIA</Text>
      <TouchableOpacity style={s.catSelector} onPress={() => setCatOpen(true)} activeOpacity={0.8}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
          {selected ? (
            <>
              <Ionicons name={selected.icone as any} size={18} color={colors.navy} />
              <Text style={s.catSelectorText}>{selected.label}</Text>
            </>
          ) : (
            <Text style={[s.catSelectorText, { color: colors.n600 }]}>Selecione uma categoria</Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={16} color={colors.n600} />
      </TouchableOpacity>

      <Text style={[s.fieldLabel, { marginTop: 18 }]}>DESCRIÇÃO</Text>
      <TextInput
        style={s.textarea}
        value={descricao}
        onChangeText={onDescricao}
        placeholder="Ex: Loja de calçados com as melhores marcas nacionais e importadas. Atendemos Aracaju e região."
        placeholderTextColor={colors.n600}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Modal
        visible={catOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCatOpen(false)}
      >
        <View style={s.catModal}>
          <View style={s.catModalHeader}>
            <Text style={s.catModalTitle}>Categoria da loja</Text>
            <TouchableOpacity onPress={() => setCatOpen(false)}>
              <Ionicons name="close" size={22} color={colors.navy} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={CATEGORIAS}
            keyExtractor={(item) => item.label}
            contentContainerStyle={{ paddingBottom: 32 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.catItem, item.label === categoria && s.catItemSelected]}
                onPress={() => {
                  onCategoria(item.label);
                  setCatOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icone as any}
                  size={20}
                  color={item.label === categoria ? colors.orange : colors.n600}
                  style={s.catItemIcone}
                />
                <Text
                  style={[
                    s.catItemLabel,
                    item.label === categoria && { color: colors.orange, fontWeight: '700' },
                  ]}
                >
                  {item.label}
                </Text>
                {item.label === categoria && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.orange} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

function StepHorarios({
  horarios,
  onChange,
}: {
  horarios: HorarioDia[];
  onChange: (i: number, h: HorarioDia) => void;
}) {
  const [sel, setSel] = useState(0);
  const h = horarios[sel];

  return (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>Horário de funcionamento</Text>
      <Text style={s.stepSub}>
        Configure quando sua loja estará aberta. Você pode alterar isso a qualquer momento em
        Perfil.
      </Text>

      <View style={s.weekStrip}>
        {horarios.map((day, i) => (
          <TouchableOpacity
            key={day.dia}
            style={[
              s.dayPill,
              day.ativo && sel !== i && s.dayPillActive,
              sel === i && s.dayPillSelected,
            ]}
            onPress={() => setSel(i)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                s.dayPillText,
                day.ativo && sel !== i && s.dayPillTextActive,
                sel === i && s.dayPillTextSelected,
              ]}
            >
              {day.abreviacao}
            </Text>
            <View
              style={[
                s.dayPillDot,
                {
                  backgroundColor:
                    sel === i ? 'rgba(255,255,255,0.55)' : day.ativo ? colors.orange : colors.n300,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.dayPanel}>
        <View style={s.dayPanelHead}>
          <View>
            <Text style={s.dayPanelName}>{h.dia}</Text>
            <Text style={[s.dayPanelStatus, { color: h.ativo ? colors.orange : colors.n500 }]}>
              {h.ativo ? 'Aberto neste dia' : 'Fechado neste dia'}
            </Text>
          </View>
          <Toggle
            value={h.ativo}
            onValueChange={(v) =>
              onChange(sel, {
                ...h,
                ativo: v,
                abertura: v ? '08:00' : '--:--',
                fechamento: v ? '18:00' : '--:--',
              })
            }
          />
        </View>

        {h.ativo ? (
          <View style={s.dayTimes}>
            <View style={s.dayTimeSlot}>
              <Text style={s.dayTimeLabel}>ABERTURA</Text>
              <TextInput
                style={s.dayTimeInput}
                value={h.abertura}
                onChangeText={(v) => onChange(sel, { ...h, abertura: formatarHora(v) })}
                keyboardType="numeric"
                maxLength={5}
                placeholder="00:00"
                placeholderTextColor={colors.n500}
              />
            </View>
            <Ionicons
              name="arrow-forward-outline"
              size={18}
              color={colors.n400}
              style={{ marginTop: 24 }}
            />
            <View style={s.dayTimeSlot}>
              <Text style={s.dayTimeLabel}>FECHAMENTO</Text>
              <TextInput
                style={s.dayTimeInput}
                value={h.fechamento}
                onChangeText={(v) => onChange(sel, { ...h, fechamento: formatarHora(v) })}
                keyboardType="numeric"
                maxLength={5}
                placeholder="00:00"
                placeholderTextColor={colors.n500}
              />
            </View>
          </View>
        ) : (
          <View style={s.dayClosed}>
            <Ionicons name="moon-outline" size={20} color={colors.n500} />
            <Text style={s.dayClosedText}>Sem horário configurado para este dia</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const TOTAL_STEPS = 3;

export function OnboardingLoja() {
  const router = useRouter();
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const lojaNome = useAuthLojistaStore((s) => s.lojaNome) ?? '';

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [horarios, setHorarios] = useState<HorarioDia[]>(HORARIOS_INICIAIS);

  const updateHorario = useCallback((index: number, updated: HorarioDia) => {
    setHorarios((prev) => prev.map((h, i) => (i === index ? updated : h)));
  }, []);

  const pickImage = useCallback(
    async (tipo: 'logo' | 'banner') => {
      if (!token || !lojaId) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: tipo === 'logo' ? [1, 1] : [3, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const uri = result.assets[0].uri;
      if (tipo === 'logo') setLogoUri(uri);
      else setBannerUri(uri);
      setUploading(tipo);
      try {
        await LojistaService.atualizarImagemLoja(lojaId, token, tipo, uri);
      } catch {
        Alert.alert('Erro', 'Não foi possível enviar a imagem. Tente novamente.');
        if (tipo === 'logo') setLogoUri(null);
        else setBannerUri(null);
      } finally {
        setUploading(null);
      }
    },
    [token, lojaId],
  );

  const salvarEAvancar = useCallback(async () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    if (!token || !lojaId) {
      router.replace('/(lojista)/pedidos');
      return;
    }
    setSaving(true);
    try {
      await LojistaService.atualizarLoja(lojaId, token, {
        categoria,
        descricao,
        horarios: horarios.map((h, i) => ({
          diaSemana: i,
          ativo: h.ativo,
          abertura: h.abertura,
          fechamento: h.fechamento,
        })),
      });
    } catch {
      /* ajusta depois em Perfil */
    } finally {
      setSaving(false);
      router.replace('/(lojista)/pedidos');
    }
  }, [step, token, lojaId, categoria, descricao, horarios, router]);

  const pular = useCallback(() => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else router.replace('/(lojista)/pedidos');
  }, [step, router]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.header}>
        <View style={s.headerTop}>
          {step > 1 ? (
            <TouchableOpacity
              onPress={() => setStep((s) => s - 1)}
              style={s.backBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={22} color={colors.navy} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
          <Text style={s.headerStep}>
            {step} de {TOTAL_STEPS}
          </Text>
          <TouchableOpacity onPress={pular} activeOpacity={0.7}>
            <Text style={s.skipText}>Pular</Text>
          </TouchableOpacity>
        </View>

        <View style={s.progressBar}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                s.progressSegment,
                { backgroundColor: i < step ? colors.orange : colors.n200 },
              ]}
            />
          ))}
        </View>

        <Text style={s.headerWelcome}>Bem-vindo, {lojaNome || 'lojista'}! 🎉</Text>
        <Text style={s.headerSub}>Configure sua loja em 3 passos rápidos</Text>
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

      <View style={s.footer}>
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
    paddingTop: 56,
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
  stepContent: { padding: 20 },
  stepTitle: { fontSize: 18, fontWeight: '800', color: colors.navy, marginBottom: 6 },
  stepSub: { fontSize: 13, color: colors.n600, lineHeight: 19, marginBottom: 20 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  bannerPicker: { height: 140, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.navy },
  bannerOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  bannerOverlayText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  logoBtn: { position: 'relative' },
  logoImg: { width: 72, height: 72, borderRadius: 18, borderWidth: 2, borderColor: colors.n200 },
  logoCamBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  logoHint: { flex: 1 },
  logoHintTitle: { fontSize: 14, fontWeight: '600', color: colors.navy },
  logoHintSub: { fontSize: 12, color: colors.n600, marginTop: 4, lineHeight: 17 },
  avatar: {
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.n200,
  },
  avatarText: { color: '#fff', fontWeight: '700' },
  catSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n50,
    paddingHorizontal: 14,
  },
  catSelectorText: { fontSize: 14, color: colors.navy, flex: 1 },
  textarea: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n50,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: colors.navy,
    minHeight: 100,
  },
  catModal: { flex: 1, backgroundColor: '#fff' },
  catModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.n200,
  },
  catModalTitle: { fontSize: 17, fontWeight: '700', color: colors.navy },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  catItemSelected: { backgroundColor: 'rgba(242,118,15,0.07)' },
  catItemIcone: { width: 28, textAlign: 'center' },
  catItemLabel: { flex: 1, fontSize: 15, color: colors.navy },
  weekStrip: { flexDirection: 'row', gap: 5, marginBottom: 4 },
  dayPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.n100,
  },
  dayPillActive: { backgroundColor: colors.orange100 },
  dayPillSelected: { backgroundColor: colors.navy },
  dayPillText: { fontSize: 11, fontWeight: '800', color: colors.n500 },
  dayPillTextActive: { color: colors.orange600 },
  dayPillTextSelected: { color: '#fff' },
  dayPillDot: { width: 5, height: 5, borderRadius: 2.5 },
  dayPanel: { marginTop: 12, backgroundColor: colors.n50, borderRadius: 14, padding: 16, gap: 16 },
  dayPanelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayPanelName: { fontSize: 16, fontWeight: '800', color: colors.navy },
  dayPanelStatus: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  dayTimes: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dayTimeSlot: { flex: 1, gap: 8 },
  dayTimeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dayTimeInput: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.navy,
  },
  dayClosed: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  dayClosedText: { fontSize: 13, color: colors.n500, flex: 1 },
  toggleTrack: { width: 48, height: 28, borderRadius: 14, justifyContent: 'center' },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
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
