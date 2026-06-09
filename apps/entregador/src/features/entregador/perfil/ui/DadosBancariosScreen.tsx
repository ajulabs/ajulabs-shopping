import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EntregadorService } from '../../../../lib/authServices';
import { useAuthEntregadorStore } from '../../auth/model/store';

const API =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1/';
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  solicitado: { label: 'Solicitado', color: '#F2760F' },
  processando: { label: 'Processando', color: '#209CEF' },
  pago: { label: 'Pago', color: '#039855' },
  falhou: { label: 'Falhou', color: '#E14B3C' },
};

type PixTipo = 'cpf' | 'email' | 'celular' | 'aleatoria';

const PIX_TIPOS: { id: PixTipo; label: string; placeholder: string; keyboard: any }[] = [
  { id: 'cpf', label: 'CPF', placeholder: '000.000.000-00', keyboard: 'numeric' },
  { id: 'email', label: 'Email', placeholder: 'seu@email.com', keyboard: 'email-address' },
  { id: 'celular', label: 'Celular', placeholder: '(79) 9 0000-0000', keyboard: 'phone-pad' },
  { id: 'aleatoria', label: 'Aleatória', placeholder: 'Chave aleatória', keyboard: 'default' },
];

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatTel(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d[2]} ${d.slice(3, 7)}-${d.slice(7)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

interface Props {
  onBack: () => void;
}

export function DadosBancariosScreen({ onBack }: Props) {
  const token = useAuthEntregadorStore((s) => s.token);
  const [ganhos, setGanhos] = useState<any>(null);
  const [saques, setSaques] = useState<any[]>([]);
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sacando, setSacando] = useState(false);

  // Edit Pix modal state
  const [editVisible, setEditVisible] = useState(false);
  const [pixTipo, setPixTipo] = useState<PixTipo>('cpf');
  const [pixValor, setPixValor] = useState('');
  const [pixFocused, setPixFocused] = useState(false);
  const [saving, setSaving] = useState(false);

  const tipoSel = PIX_TIPOS.find((t) => t.id === pixTipo)!;

  const fetchData = async () => {
    if (!token) return;
    const [g, p, s] = await Promise.all([
      EntregadorService.buscarGanhos(token).catch(() => null),
      EntregadorService.buscarPerfil(token).catch(() => null),
      fetch(`${API}entregador/saques`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => d.saques ?? [])
        .catch(() => []),
    ]);
    setGanhos(g);
    setPerfil(p);
    setSaques(s);
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [token]);

  const totalGanho = Number(ganhos?.allTime?.total ?? 0);
  const totalSacado = saques
    .filter((s) => s.status !== 'falhou')
    .reduce((a, s) => a + Number(s.valor), 0);
  const saldoDisp = Math.max(totalGanho - totalSacado, 0);
  const emAndamento = Number(ganhos?.emAndamento ?? 0);
  const chavePix = perfil?.entregador?.dadosBancarios?.chavePix ?? null;

  const openEdit = () => {
    setPixTipo('cpf');
    setPixValor(chavePix ?? '');
    setEditVisible(true);
  };

  const handlePixChange = (v: string) => {
    if (pixTipo === 'cpf') setPixValor(formatCPF(v));
    else if (pixTipo === 'celular') setPixValor(formatTel(v));
    else setPixValor(v);
  };

  const handleSalvarPix = async () => {
    if (!pixValor.trim()) {
      Alert.alert('Erro', 'Informe a chave Pix.');
      return;
    }
    if (!token) return;
    setSaving(true);
    try {
      await EntregadorService.atualizarDadosBancarios(token, {
        tipo: 'pix',
        chavePix: pixValor.trim(),
      });
      setEditVisible(false);
      await fetchData();
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível salvar a chave Pix.');
    } finally {
      setSaving(false);
    }
  };

  const handleSacar = () => {
    if (!chavePix) {
      Alert.alert('Chave Pix não cadastrada', 'Cadastre uma chave Pix antes de solicitar o saque.');
      return;
    }
    if (saldoDisp < 10) {
      Alert.alert('Saldo insuficiente', 'O valor mínimo para saque é R$ 10,00.');
      return;
    }
    Alert.alert('Confirmar saque', `Sacar ${brl(saldoDisp)} para:\n${chavePix}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          if (!token) return;
          setSacando(true);
          try {
            const r = await fetch(`${API}entregador/saque`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ valor: saldoDisp }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error ?? 'Erro ao solicitar saque');
            Alert.alert('Saque solicitado!', 'Será creditado em até 1 dia útil na sua chave Pix.');
            await fetchData();
          } catch (e: any) {
            Alert.alert('Erro', e?.message ?? 'Não foi possível solicitar o saque.');
          } finally {
            setSacando(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#000933" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Dados bancários</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#F2760F" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Saldo */}
          <View style={s.saldoCard}>
            <Text style={s.saldoLabel}>Disponível para saque</Text>
            <Text style={s.saldoValue}>{brl(saldoDisp)}</Text>
            {emAndamento > 0 && (
              <View style={s.andamentoBadge}>
                <Ionicons name="time-outline" size={13} color="#F2760F" />
                <Text style={s.andamentoText}>
                  {emAndamento} entrega{emAndamento !== 1 ? 's' : ''} em andamento
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[s.sacarBtn, (saldoDisp < 10 || sacando) && { opacity: 0.6 }]}
              onPress={handleSacar}
              activeOpacity={0.85}
              disabled={sacando}
            >
              {sacando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="flash" size={16} color="#FFFFFF" />
                  <Text style={s.sacarBtnText}>Sacar via Pix</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Resumo */}
          <View style={s.resumoRow}>
            <View style={s.resumoBox}>
              <Text style={s.resumoLabel}>Total ganho</Text>
              <Text style={s.resumoValue}>{brl(totalGanho)}</Text>
            </View>
            <View style={[s.resumoBox, { borderLeftWidth: 1, borderLeftColor: '#E4E7F1' }]}>
              <Text style={s.resumoLabel}>Total sacado</Text>
              <Text style={s.resumoValue}>{brl(totalSacado)}</Text>
            </View>
          </View>

          {/* Chave Pix card com botão editar */}
          <TouchableOpacity style={s.pixCard} onPress={openEdit} activeOpacity={0.8}>
            <View style={s.pixIcon}>
              <Ionicons name="flash" size={18} color="#046C2E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.pixLabel}>Chave Pix cadastrada</Text>
              <Text style={[s.pixValue, !chavePix && { color: '#9099B3' }]}>
                {chavePix ?? 'Toque para cadastrar'}
              </Text>
            </View>
            <View style={s.editBtn}>
              <Ionicons name={chavePix ? 'pencil' : 'add'} size={15} color="#F2760F" />
              <Text style={s.editBtnText}>{chavePix ? 'Editar' : 'Cadastrar'}</Text>
            </View>
          </TouchableOpacity>

          {/* Histórico */}
          <Text style={s.sectionTitle}>Histórico de saques</Text>
          {saques.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>Nenhum saque solicitado ainda</Text>
            </View>
          ) : (
            saques.map((saque) => {
              const st = STATUS_LABEL[saque.status] ?? { label: saque.status, color: '#9099B3' };
              const data = new Date(saque.criadoEm).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
              });
              return (
                <View key={saque.id} style={s.saqueRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.saqueValor}>{brl(Number(saque.valor))}</Text>
                    <Text style={s.saqueData}>
                      {data} · {saque.chavePix}
                    </Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: `${st.color}18` }]}>
                    <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Modal editar chave Pix */}
      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <TouchableOpacity
          style={s.modalBackdrop}
          activeOpacity={1}
          onPress={() => setEditVisible(false)}
        >
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />

            {/* Hint verde */}
            <View style={s.pixHint}>
              <Ionicons name="flash" size={18} color="#046C2E" />
              <View>
                <Text style={s.pixHintTitle}>Chave Pix</Text>
                <Text style={s.pixHintSub}>Saque instantâneo, sem taxa</Text>
              </View>
            </View>

            {/* Tipo de chave */}
            <Text style={s.modalFieldLabel}>Tipo de chave</Text>
            <View style={s.tipoRow}>
              {PIX_TIPOS.map((t) => {
                const ativo = pixTipo === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[s.tipoBtn, ativo && s.tipoBtnActive]}
                    onPress={() => {
                      setPixTipo(t.id);
                      setPixValor('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.tipoBtnText, ativo && s.tipoBtnTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Input chave */}
            <Text style={[s.modalFieldLabel, { marginTop: 14 }]}>Chave Pix</Text>
            <View style={[s.pixInput, pixFocused && s.pixInputFocused]}>
              <TextInput
                value={pixValor}
                onChangeText={handlePixChange}
                placeholder={tipoSel.placeholder}
                placeholderTextColor="#9099B3"
                keyboardType={tipoSel.keyboard}
                autoCapitalize="none"
                autoFocus
                style={s.pixInputInner}
                onFocus={() => setPixFocused(true)}
                onBlur={() => setPixFocused(false)}
              />
              {pixValor.length > 0 && (
                <TouchableOpacity onPress={() => setPixValor('')} hitSlop={10}>
                  <Ionicons name="close-circle" size={18} color="#9099B3" />
                </TouchableOpacity>
              )}
            </View>

            {/* Botões */}
            <TouchableOpacity
              style={[s.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSalvarPix}
              activeOpacity={0.85}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="flash" size={15} color="#FFFFFF" />
                  <Text style={s.saveBtnText}>Salvar chave Pix</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => setEditVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={s.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000933' },
  content: { padding: 16, paddingBottom: 40 },

  saldoCard: { backgroundColor: '#000933', borderRadius: 18, padding: 20, marginBottom: 12 },
  saldoLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  saldoValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 16,
  },
  andamentoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
    marginTop: -10,
  },
  andamentoText: { fontSize: 11, color: '#F2760F', fontWeight: '600' },
  sacarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F2760F',
    borderRadius: 12,
    paddingVertical: 14,
  },
  sacarBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  resumoRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    marginBottom: 12,
    overflow: 'hidden',
  },
  resumoBox: { flex: 1, padding: 16, alignItems: 'center' },
  resumoLabel: { fontSize: 11, color: '#9099B3', fontWeight: '600', marginBottom: 4 },
  resumoValue: { fontSize: 18, fontWeight: '700', color: '#000933' },

  pixCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    padding: 14,
    marginBottom: 20,
  },
  pixIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(57,255,137,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pixLabel: { fontSize: 11, color: '#9099B3', fontWeight: '600', marginBottom: 2 },
  pixValue: { fontSize: 14, fontWeight: '600', color: '#000933' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: 'rgba(242,118,15,0.3)',
    backgroundColor: '#FEF0E3',
  },
  editBtnText: { fontSize: 12, fontWeight: '700', color: '#F2760F' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#000933', marginBottom: 10 },
  emptyBox: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { fontSize: 13, color: '#9099B3' },
  saqueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    padding: 14,
    marginBottom: 8,
  },
  saqueValor: { fontSize: 15, fontWeight: '700', color: '#000933' },
  saqueData: { fontSize: 11, color: '#9099B3', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#E4E7F1',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalFieldLabel: { fontSize: 12, fontWeight: '600', color: '#2A3156', marginBottom: 8 },

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

  tipoRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tipoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#F6F7FB',
  },
  tipoBtnActive: { borderColor: '#F2760F', backgroundColor: 'rgba(242,118,15,0.08)' },
  tipoBtnText: { fontSize: 13, fontWeight: '600', color: '#9099B3' },
  tipoBtnTextActive: { color: '#F2760F' },

  pixInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#F6F7FB',
  },
  pixInputFocused: { borderColor: '#F2760F' },
  pixInputInner: { flex: 1, fontSize: 15, color: '#000933' },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F2760F',
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 18,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  cancelBtn: {
    marginTop: 10,
    padding: 14,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#9099B3' },
});
