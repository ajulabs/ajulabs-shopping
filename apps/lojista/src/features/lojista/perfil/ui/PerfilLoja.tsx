import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Switch, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LojistaService } from '@ajulabs/api-client';
import { colors } from '../../../../theme';
import { useAuthLojistaStore } from '../../auth/model/store';

interface HorarioDia {
  dia: string;
  abreviacao: string;
  ativo: boolean;
  abertura: string;
  fechamento: string;
}

interface LojaData {
  nome: string;
  categoria: string;
  descricao: string;
  telefone: string;
  rua: string;
  bairro: string;
  cep: string;
  cidade: string;
  aceitaAgendamento: boolean;
  antecedenciaMinima: string;
}

interface PerfilLojaProps {
  dark?: boolean;
}

const HORARIOS_INICIAIS: HorarioDia[] = [
  { dia: 'Segunda-feira',  abreviacao: 'Seg', ativo: true,  abertura: '08:00', fechamento: '18:00' },
  { dia: 'Terça-feira',   abreviacao: 'Ter', ativo: true,  abertura: '08:00', fechamento: '18:00' },
  { dia: 'Quarta-feira',  abreviacao: 'Qua', ativo: true,  abertura: '08:00', fechamento: '18:00' },
  { dia: 'Quinta-feira',  abreviacao: 'Qui', ativo: true,  abertura: '08:00', fechamento: '18:00' },
  { dia: 'Sexta-feira',   abreviacao: 'Sex', ativo: true,  abertura: '08:00', fechamento: '18:00' },
  { dia: 'Sábado',        abreviacao: 'Sáb', ativo: true,  abertura: '09:00', fechamento: '14:00' },
  { dia: 'Domingo',       abreviacao: 'Dom', ativo: false, abertura: '--:--', fechamento: '--:--' },
];

function FormField({
  label, value, onChange, placeholder, multiline = false,
  keyboardType = 'default', dark,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
  dark: boolean;
}) {
  const textColor = dark ? colors.n0    : colors.navy;
  const subColor  = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const inputBg   = dark ? 'rgba(255,255,255,0.05)' : colors.n50;
  const border    = dark ? 'rgba(255,255,255,0.08)' : colors.n200;

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: subColor }]}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          { backgroundColor: inputBg, borderColor: border, color: textColor },
          multiline && { minHeight: 70, textAlignVertical: 'top' },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={subColor}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function HorarioRow({
  horario, onChange, dark,
}: {
  horario: HorarioDia;
  onChange: (updated: HorarioDia) => void;
  dark: boolean;
}) {
  const textColor = dark ? colors.n0    : colors.navy;
  const subColor  = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const inputBg   = dark ? 'rgba(255,255,255,0.05)' : colors.n50;
  const border    = dark ? 'rgba(255,255,255,0.08)' : colors.n200;

  return (
    <View style={styles.dayRow}>
      <Text style={[styles.dayName, { color: textColor }]}>{horario.abreviacao}</Text>
      <Switch
        value={horario.ativo}
        onValueChange={v => onChange({ ...horario, ativo: v,
          abertura: v ? '08:00' : '--:--',
          fechamento: v ? '18:00' : '--:--',
        })}
        trackColor={{ false: colors.n200, true: '#046C2E' }}
        thumbColor="#fff"
        style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
      />
      <TextInput
        style={[
          styles.timeInput,
          { backgroundColor: inputBg, borderColor: border, color: textColor },
          !horario.ativo && { opacity: 0.4 },
        ]}
        value={horario.abertura}
        onChangeText={v => onChange({ ...horario, abertura: v })}
        editable={horario.ativo}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />
      <Text style={[styles.timeSep, { color: subColor }]}>–</Text>
      <TextInput
        style={[
          styles.timeInput,
          { backgroundColor: inputBg, borderColor: border, color: textColor },
          !horario.ativo && { opacity: 0.4 },
        ]}
        value={horario.fechamento}
        onChangeText={v => onChange({ ...horario, fechamento: v })}
        editable={horario.ativo}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />
    </View>
  );
}

function StoreAvatar({ nome, size = 56 }: { nome: string; size?: number }) {
  const initials = nome.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.25 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.32 }]}>{initials}</Text>
    </View>
  );
}

export function PerfilLoja({ dark = false }: PerfilLojaProps) {
  const token = useAuthLojistaStore(s => s.token);
  const lojaId = useAuthLojistaStore(s => s.lojaId);
  const logout = useAuthLojistaStore(s => s.logout);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [horarios, setHorarios] = useState<HorarioDia[]>(HORARIOS_INICIAIS);
  const [loja, setLoja] = useState<LojaData>({
    nome: '',
    categoria: '',
    descricao: '',
    telefone: '',
    rua: '',
    bairro: '',
    cep: '',
    cidade: '',
    aceitaAgendamento: false,
    antecedenciaMinima: '120',
  });

  useEffect(() => {
    if (!token || !lojaId) { setLoading(false); return; }
    LojistaService.buscarLojaDetalhes(lojaId, token).then(raw => {
      if (!raw) return;
      setLoja({
        nome: raw.nome ?? '',
        categoria: raw.categoria ?? '',
        descricao: raw.descricao ?? '',
        telefone: raw.telefone ?? '',
        rua: raw.endereco ? `${raw.endereco.rua}${raw.endereco.numero ? ', ' + raw.endereco.numero : ''}` : '',
        bairro: raw.endereco?.bairro ?? '',
        cep: raw.endereco?.cep ?? '',
        cidade: raw.endereco?.cidade ?? '',
        aceitaAgendamento: raw.aceitaAgendamento ?? false,
        antecedenciaMinima: String(raw.antecedenciaMinima ?? 120),
      });
      if (raw.horarios && raw.horarios.length > 0) {
        setHorarios(prev => prev.map((h, i) => {
          const backHorario = raw.horarios.find((bh: any) => bh.diaSemana === i);
          if (!backHorario) return h;
          return { ...h, ativo: backHorario.ativo, abertura: backHorario.abertura, fechamento: backHorario.fechamento };
        }));
      }
    }).finally(() => setLoading(false));
  }, [token, lojaId]);

  const textColor = dark ? colors.n0    : colors.navy;
  const subColor  = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const bgMain    = dark ? '#0B0F22'    : colors.n50;
  const surface   = dark ? '#111638'    : colors.n0;
  const border    = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  const updateLoja = useCallback((key: keyof LojaData, value: string | boolean) => {
    setLoja(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateHorario = useCallback((index: number, updated: HorarioDia) => {
    setHorarios(prev => prev.map((h, i) => i === index ? updated : h));
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }, [logout]);

  const handlePickBanner = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      aspect: [3, 1],
    });
    if (!result.canceled) {
      Alert.alert('Em breve', 'Upload de banner será implementado em breve.');
    }
  }, []);

  const handlePickAvatar = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      Alert.alert('Em breve', 'Upload de logo será implementado em breve.');
    }
  }, []);

  const handleSalvar = useCallback(async () => {
    if (!token || !lojaId) {
      Alert.alert('Erro', 'Sessão inválida.');
      return;
    }
    setSaving(true);
    try {
      const ruaPartes = loja.rua.split(',').map(s => s.trim());
      const rua = ruaPartes[0] ?? loja.rua;
      const numero = ruaPartes[1] ?? '';

      await LojistaService.atualizarLoja(lojaId, token, {
        nome: loja.nome,
        descricao: loja.descricao,
        categoria: loja.categoria,
        telefone: loja.telefone,
        aceitaAgendamento: loja.aceitaAgendamento,
        antecedenciaMinima: parseInt(loja.antecedenciaMinima, 10) || 120,
        ...(loja.bairro || loja.cep || loja.cidade ? {
          endereco: { rua, numero, bairro: loja.bairro, cep: loja.cep, cidade: loja.cidade },
        } : {}),
      });
      Alert.alert('Salvo!', 'As informações da loja foram atualizadas.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar.';
      Alert.alert('Erro', msg);
    } finally {
      setSaving(false);
    }
  }, [token, lojaId, loja]);

  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const mapDia = [6, 0, 1, 2, 3, 4, 5];
  const horarioHoje = horarios[mapDia[diaSemana]];
  const agoraMin = hoje.getHours() * 60 + hoje.getMinutes();
  const [aH, aM] = (horarioHoje?.abertura || '00:00').split(':').map(Number);
  const [fH, fM] = (horarioHoje?.fechamento || '00:00').split(':').map(Number);
  const abertaAgora = horarioHoje?.ativo && agoraMin >= aH * 60 + aM && agoraMin < fH * 60 + fM;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgMain, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgMain }]}>
      <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Perfil da loja</Text>
        <Text style={[styles.headerSub, { color: subColor }]}>Informações visíveis para os clientes</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <Text style={[styles.sectionLabel, { color: subColor }]}>IDENTIDADE VISUAL</Text>
        <View style={[styles.card, { borderColor: border }]}>
          <View style={[styles.banner, { backgroundColor: colors.navy }]}>
            <TouchableOpacity style={styles.bannerEditBtn} onPress={handlePickBanner} activeOpacity={0.8}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </TouchableOpacity>
            <View style={styles.avatarWrap}>
              <StoreAvatar nome={loja.nome || 'Loja'} size={58} />
              <TouchableOpacity style={styles.avatarEditBtn} onPress={handlePickAvatar} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={10} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.storeInfo}>
            <Text style={[styles.storeName, { color: textColor }]}>{loja.nome}</Text>
            <Text style={[styles.storeCat, { color: subColor }]}>{loja.categoria} · {loja.bairro}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: abertaAgora ? '#046C2E' : colors.n600 }]} />
              <Text style={[styles.statusText, { color: abertaAgora ? '#046C2E' : colors.n600 }]}>
                {abertaAgora ? 'Aberta agora' : 'Fechada agora'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: subColor }]}>INFORMAÇÕES DA LOJA</Text>
        <View style={[styles.card, { borderColor: border, backgroundColor: surface }]}>
          <View style={styles.fieldGroup}>
            <FormField label="NOME DA LOJA" value={loja.nome} onChange={v => updateLoja('nome', v)} dark={dark} />
            <FormField label="CATEGORIA" value={loja.categoria} onChange={v => updateLoja('categoria', v)} placeholder="Ex: Calçados, Roupas…" dark={dark} />
            <FormField label="DESCRIÇÃO" value={loja.descricao} onChange={v => updateLoja('descricao', v)} multiline dark={dark} />
            <FormField label="TELEFONE / WHATSAPP" value={loja.telefone} onChange={v => updateLoja('telefone', v)} keyboardType="phone-pad" dark={dark} />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: subColor }]}>ENDEREÇO</Text>
        <View style={[styles.card, { borderColor: border, backgroundColor: surface }]}>
          <View style={styles.fieldGroup}>
            <FormField label="RUA / NÚMERO" value={loja.rua} onChange={v => updateLoja('rua', v)} dark={dark} />
            <View style={styles.fieldRow}>
              <View style={{ flex: 1 }}>
                <FormField label="BAIRRO" value={loja.bairro} onChange={v => updateLoja('bairro', v)} dark={dark} />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="CEP" value={loja.cep} onChange={v => updateLoja('cep', v)} keyboardType="numeric" dark={dark} />
              </View>
            </View>
            <FormField label="CIDADE" value={loja.cidade} onChange={v => updateLoja('cidade', v)} dark={dark} />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: subColor }]}>HORÁRIO DE FUNCIONAMENTO</Text>
        <View style={[styles.card, { borderColor: border, backgroundColor: surface }]}>
          {horarios.map((horario, index) => (
            <View key={horario.dia} style={index < horarios.length - 1 && { borderBottomWidth: 1, borderBottomColor: border }}>
              <HorarioRow
                horario={horario}
                onChange={updated => updateHorario(index, updated)}
                dark={dark}
              />
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: subColor }]}>AGENDAMENTO</Text>
        <View style={[styles.card, { borderColor: border, backgroundColor: surface }]}>
          <View style={styles.agendRow}>
            <View style={styles.agendInfo}>
              <Text style={[styles.agendTitle, { color: textColor }]}>Aceitar pedidos agendados</Text>
              <Text style={[styles.agendSub, { color: subColor }]}>Cliente escolhe data e hora fora do horário</Text>
            </View>
            <Switch
              value={loja.aceitaAgendamento}
              onValueChange={v => updateLoja('aceitaAgendamento', v)}
              trackColor={{ false: colors.n200, true: '#046C2E' }}
              thumbColor="#fff"
            />
          </View>
          {loja.aceitaAgendamento && (
            <View style={[styles.agendRow, { borderTopWidth: 1, borderTopColor: border }]}>
              <View style={styles.agendInfo}>
                <Text style={[styles.agendTitle, { color: textColor }]}>Antecedência mínima (minutos)</Text>
                <Text style={[styles.agendSub, { color: subColor }]}>Ex: 60 = 1 hora, 120 = 2 horas</Text>
              </View>
              <TextInput
                style={[styles.antecedenciaInput, { borderColor: border, color: textColor, backgroundColor: colors.n50 }]}
                value={loja.antecedenciaMinima}
                onChangeText={v => updateLoja('antecedenciaMinima', v)}
                keyboardType="numeric"
                placeholder="120"
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSalvar}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Salvar alterações</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color="#E24B4A" />
          <Text style={styles.logoutBtnText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1 },
  header:           { padding: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle:      { fontWeight: '700', fontSize: 18, letterSpacing: -0.3 },
  headerSub:        { fontSize: 12, marginTop: 2 },
  content:          { padding: 14, gap: 8 },
  sectionLabel:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.5,
                      marginTop: 6, marginBottom: 4, paddingHorizontal: 2 },
  card:             { borderRadius: 16, borderWidth: 1, overflow: 'hidden',
                      backgroundColor: '#fff' },
  banner:           { height: 90, position: 'relative' },
  bannerEditBtn:    { position: 'absolute', top: 8, right: 8, width: 28, height: 28,
                      borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.4)',
                      alignItems: 'center', justifyContent: 'center' },
  avatarWrap:       { position: 'absolute', bottom: -22, left: 14 },
  avatar:           { backgroundColor: colors.orange, alignItems: 'center',
                      justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarText:       { color: '#fff', fontWeight: '700' },
  avatarEditBtn:    { position: 'absolute', bottom: -2, right: -2,
                      width: 20, height: 20, borderRadius: 10,
                      backgroundColor: colors.orange, alignItems: 'center',
                      justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  storeInfo:        { paddingTop: 28, padding: 14 },
  storeName:        { fontSize: 16, fontWeight: '700' },
  storeCat:         { fontSize: 12, marginTop: 2 },
  statusRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  statusDot:        { width: 8, height: 8, borderRadius: 4 },
  statusText:       { fontSize: 12, fontWeight: '600' },
  fieldGroup:       { padding: 14, gap: 12 },
  fieldRow:         { flexDirection: 'row', gap: 10 },
  field:            { gap: 5 },
  fieldLabel:       { fontSize: 11, fontWeight: '700',
                      textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldInput:       { borderRadius: 10, borderWidth: 1,
                      paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  dayRow:           { flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  dayName:          { fontSize: 13, fontWeight: '600', width: 32 },
  timeInput:        { flex: 1, borderRadius: 8, borderWidth: 1,
                      paddingVertical: 6, paddingHorizontal: 8,
                      fontSize: 12, fontWeight: '600', textAlign: 'center' },
  timeSep:          { fontSize: 12 },
  agendRow:         { flexDirection: 'row', alignItems: 'center',
                      justifyContent: 'space-between', padding: 14, gap: 12 },
  agendInfo:        { flex: 1 },
  agendTitle:       { fontSize: 14, fontWeight: '600' },
  agendSub:         { fontSize: 11, marginTop: 2 },
  antecedenciaInput:{ width: 80, borderRadius: 8, borderWidth: 1,
                      paddingVertical: 6, paddingHorizontal: 8,
                      fontSize: 13, fontWeight: '600', textAlign: 'center' },
  saveBtn:          { height: 50, borderRadius: 14, backgroundColor: colors.orange,
                      alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  saveBtnText:      { fontSize: 15, fontWeight: '700', color: '#fff' },
  logoutBtn:        { height: 50, borderRadius: 14, borderWidth: 1, borderColor: '#E24B4A',
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      gap: 8, marginTop: 10 },
  logoutBtnText:    { fontSize: 15, fontWeight: '700', color: '#E24B4A' },
});
