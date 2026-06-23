import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { EntregadorService } from '../../../../shared/lib/authServices';
import { useAuthEntregadorStore } from '../../../../store';

const API =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1/';
import { brl } from '../../../../shared/lib/format';
export { brl };

export const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  solicitado: { label: 'Solicitado', color: '#F2760F' },
  processando: { label: 'Processando', color: '#209CEF' },
  pago: { label: 'Pago', color: '#039855' },
  falhou: { label: 'Falhou', color: '#E14B3C' },
};

export type PixTipo = 'cpf' | 'email' | 'celular' | 'aleatoria';

export const PIX_TIPOS: { id: PixTipo; label: string; placeholder: string; keyboard: any }[] = [
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

export function useDadosBancarios() {
  const token = useAuthEntregadorStore((s) => s.token);
  const [ganhos, setGanhos] = useState<any>(null);
  const [saques, setSaques] = useState<any[]>([]);
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sacando, setSacando] = useState(false);

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

  return {
    loading,
    sacando,
    saldoDisp,
    emAndamento,
    totalGanho,
    totalSacado,
    chavePix,
    saques,
    editVisible,
    setEditVisible,
    pixTipo,
    setPixTipo,
    pixValor,
    setPixValor,
    pixFocused,
    setPixFocused,
    saving,
    tipoSel,
    openEdit,
    handlePixChange,
    handleSalvarPix,
    handleSacar,
  };
}
