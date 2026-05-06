import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TRANSPORTES = [
  { id: 'bike', label: 'Bicicleta', icon: 'bicycle', rate: 'R$ 6/corrida', desc: 'Sem placa, leve e econômico' },
  { id: 'moto', label: 'Moto', icon: 'car-sport', rate: 'R$ 10/corrida', desc: 'Rápido e mais alcance' },
  { id: 'carro', label: 'Carro', icon: 'car', rate: 'R$ 14/corrida', desc: 'Para volumes maiores' },
] as const;
type Transporte = typeof TRANSPORTES[number]['id'];

interface StepProps {
  data: Record<string, string>;
  up: (k: string, v: string) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  secureTextEntry,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#9099B3"
      secureTextEntry={secureTextEntry}
      style={s.input}
    />
  );
}

function StepPessoal({ data, up }: StepProps) {
  return (
    <View>
      <TouchableOpacity style={s.photoBtn} activeOpacity={0.8}>
        <Ionicons name="camera" size={26} color="#F2760F" />
        <Text style={s.photoBtnText}>Foto de perfil</Text>
      </TouchableOpacity>
      <Field label="Nome completo">
        <Input value={data.nome || ''} onChange={(v) => up('nome', v)} placeholder="Seu nome completo" />
      </Field>
      <Field label="CPF">
        <Input value={data.cpf || ''} onChange={(v) => up('cpf', v)} placeholder="000.000.000-00" />
      </Field>
      <Field label="Celular">
        <Input value={data.celular || ''} onChange={(v) => up('celular', v)} placeholder="(79) 9 0000-0000" />
      </Field>
    </View>
  );
}

function StepDocs() {
  return (
    <View>
      <Text style={s.stepDesc}>
        Precisamos de uma foto do seu RG ou CNH. Seus dados são criptografados.
      </Text>
      {['Frente do documento', 'Verso do documento'].map((label) => (
        <TouchableOpacity key={label} style={s.docBtn} activeOpacity={0.8}>
          <View style={s.docIcon}>
            <Ionicons name="camera" size={20} color="#F2760F" />
          </View>
          <View>
            <Text style={s.docTitle}>{label}</Text>
            <Text style={s.docSub}>Toque pra tirar a foto</Text>
          </View>
        </TouchableOpacity>
      ))}
      <View style={s.infoBox}>
        <Ionicons name="shield-checkmark" size={16} color="#209CEF" />
        <Text style={s.infoText}>Análise em até 24h. Você será notificado aqui no app.</Text>
      </View>
    </View>
  );
}

function StepTransporte({ data, up }: StepProps) {
  return (
    <View>
      <Text style={s.stepDesc}>Qual meio de transporte você vai usar?</Text>
      {TRANSPORTES.map((t) => {
        const sel = data.transporte === t.id;
        return (
          <TouchableOpacity
            key={t.id}
            style={[s.transporteBtn, sel && s.transporteBtnActive]}
            onPress={() => up('transporte', t.id)}
            activeOpacity={0.85}
          >
            <View style={[s.transporteIcon, sel && { backgroundColor: '#F2760F' }]}>
              <Ionicons name={t.icon as any} size={24} color={sel ? '#FFFFFF' : '#2A3156'} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[s.transporteLabel, sel && { color: '#F2760F' }]}>{t.label}</Text>
              <Text style={s.transporteDesc}>{t.rate} · {t.desc}</Text>
            </View>
            {sel && <Ionicons name="checkmark-circle" size={20} color="#F2760F" />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function StepVeiculo({ data, up }: StepProps) {
  return (
    <View>
      <Field label="Placa">
        <Input value={data.placa || ''} onChange={(v) => up('placa', v)} placeholder="ABC-1D23" />
      </Field>
      <Field label="Modelo">
        <Input value={data.modelo || ''} onChange={(v) => up('modelo', v)} placeholder="Ex: Honda CG 160" />
      </Field>
      <Field label="Cor">
        <Input value={data.cor || ''} onChange={(v) => up('cor', v)} placeholder="Ex: Preta" />
      </Field>
      <Field label="Ano">
        <Input value={data.ano || ''} onChange={(v) => up('ano', v)} placeholder="2022" />
      </Field>
    </View>
  );
}

function StepBancario({ data, up }: StepProps) {
  return (
    <View>
      <View style={s.pixHint}>
        <Ionicons name="flash" size={18} color="#046C2E" />
        <View>
          <Text style={s.pixHintTitle}>Prefira Pix</Text>
          <Text style={s.pixHintSub}>Saque instantâneo, sem taxa</Text>
        </View>
      </View>
      <Field label="Chave Pix">
        <Input value={data.pix || ''} onChange={(v) => up('pix', v)} placeholder="CPF, email ou celular" />
      </Field>
      <Text style={s.orLabel}>Ou conta bancária</Text>
      <Field label="Banco">
        <Input value={data.banco || 'Banco do Brasil'} onChange={(v) => up('banco', v)} placeholder="Banco do Brasil" />
      </Field>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="Agência">
            <Input value={data.agencia || ''} onChange={(v) => up('agencia', v)} placeholder="0000" />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Conta">
            <Input value={data.conta || ''} onChange={(v) => up('conta', v)} placeholder="000000-0" />
          </Field>
        </View>
      </View>
    </View>
  );
}

function StepRevisao({ data }: { data: Record<string, string> }) {
  const t = TRANSPORTES.find((t) => t.id === data.transporte);
  const rows = [
    { label: 'Nome', value: data.nome || '—' },
    { label: 'CPF', value: data.cpf || '—' },
    { label: 'Transporte', value: t?.label || '—' },
    { label: 'Placa', value: data.placa || '—' },
    { label: 'Chave Pix', value: data.pix || '—' },
  ];
  return (
    <View>
      <View style={s.reviewHero}>
        <Text style={s.reviewTitle}>Tudo pronto! 🎉</Text>
        <Text style={s.reviewSub}>Vamos revisar seu cadastro. A análise sai em até 24h.</Text>
      </View>
      {rows.map((r) => (
        <View key={r.label} style={s.reviewRow}>
          <Text style={s.reviewLabel}>{r.label}</Text>
          <Text style={s.reviewValue}>{r.value}</Text>
        </View>
      ))}
      <View style={s.tipBox}>
        <Ionicons name="flash" size={16} color="#F2760F" />
        <Text style={s.tipText}>
          <Text style={{ fontWeight: '700' }}>Dica:</Text> entregadores que começam já na primeira semana ganham bônus de R$ 100.
        </Text>
      </View>
    </View>
  );
}

interface OnboardingScreenProps {
  onDone: (result: 'submitted' | 'cancel') => void;
}

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({ nome: 'Carlos Mendes' });
  const up = (k: string, v: string) => setData((d) => ({ ...d, [k]: v }));

  const needsVehicle = data.transporte !== 'bike';

  const steps = [
    { title: 'Dados pessoais' },
    { title: 'Documentos' },
    { title: 'Transporte' },
    ...(needsVehicle ? [{ title: 'Veículo' }] : []),
    { title: 'Bancário' },
    { title: 'Revisão' },
  ];

  const isLast = step === steps.length - 1;
  const cur = steps[step];

  const next = () => {
    if (isLast) onDone('submitted');
    else setStep((s) => s + 1);
  };
  const prev = () => {
    if (step === 0) onDone('cancel');
    else setStep((s) => s - 1);
  };

  return (
    <SafeAreaView style={s.safeArea}>
      {/* Header com progresso */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={prev} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={18} color="#000933" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.headerStep}>Passo {step + 1} de {steps.length}</Text>
            <Text style={s.headerTitle}>{cur.title}</Text>
          </View>
        </View>
        <View style={s.progressBars}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                s.progressBar,
                { backgroundColor: i <= step ? '#F2760F' : '#E4E7F1' },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {cur.title === 'Dados pessoais' && <StepPessoal data={data} up={up} />}
        {cur.title === 'Documentos' && <StepDocs />}
        {cur.title === 'Transporte' && <StepTransporte data={data} up={up} />}
        {cur.title === 'Veículo' && <StepVeiculo data={data} up={up} />}
        {cur.title === 'Bancário' && <StepBancario data={data} up={up} />}
        {cur.title === 'Revisão' && <StepRevisao data={data} />}
      </ScrollView>

      {/* CTA */}
      <View style={s.footer}>
        <TouchableOpacity style={s.ctaBtn} onPress={next} activeOpacity={0.85}>
          <Text style={s.ctaBtnText}>
            {isLast ? 'Enviar cadastro' : 'Continuar'}
          </Text>
          {!isLast && <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    padding: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStep: { fontSize: 11, color: '#9099B3', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000933', letterSpacing: -0.3 },
  progressBars: { flexDirection: 'row', gap: 4, paddingBottom: 14 },
  progressBar: { flex: 1, height: 4, borderRadius: 99 },
  scroll: { flex: 1 },
  content: { padding: 22, paddingBottom: 20 },
  footer: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E4E7F1',
    backgroundColor: '#FFFFFF',
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
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#2A3156', marginBottom: 6 },
  input: {
    padding: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#F6F7FB',
    fontSize: 15,
    color: '#000933',
  },
  photoBtn: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#F2760F',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#FEF0E3',
    marginBottom: 20,
    gap: 4,
  },
  photoBtnText: { fontSize: 11, color: '#F2760F', fontWeight: '600' },
  stepDesc: { fontSize: 13, color: '#9099B3', lineHeight: 19, marginBottom: 18 },
  docBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E4E7F1',
    borderStyle: 'dashed',
    backgroundColor: '#F6F7FB',
    marginBottom: 10,
  },
  docIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FEF0E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: { fontSize: 14, fontWeight: '600', color: '#000933' },
  docSub: { fontSize: 11, color: '#9099B3', marginTop: 2 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(32,156,239,0.08)',
    borderRadius: 10,
    marginTop: 8,
  },
  infoText: { flex: 1, fontSize: 12, color: '#000933', lineHeight: 18 },
  transporteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  transporteBtnActive: { borderColor: '#F2760F', backgroundColor: 'rgba(242,118,15,0.05)' },
  transporteIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transporteLabel: { fontSize: 15, fontWeight: '600', color: '#000933', marginBottom: 2 },
  transporteDesc: { fontSize: 11.5, color: '#9099B3' },
  pixHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(57,255,137,0.15)',
    borderRadius: 12,
    marginBottom: 18,
  },
  pixHintTitle: { fontSize: 13, fontWeight: '700', color: '#046C2E' },
  pixHintSub: { fontSize: 11, color: '#046C2E', opacity: 0.85 },
  orLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9099B3',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
    marginTop: 6,
  },
  reviewHero: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#000933',
    marginBottom: 14,
  },
  reviewTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.4 },
  reviewSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, lineHeight: 18 },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  reviewLabel: { fontSize: 13, color: '#9099B3' },
  reviewValue: { fontSize: 13, fontWeight: '600', color: '#000933', textAlign: 'right' },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: '#FEF0E3',
    borderRadius: 12,
    marginTop: 14,
  },
  tipText: { flex: 1, fontSize: 12, color: '#F2760F', lineHeight: 18 },
});
