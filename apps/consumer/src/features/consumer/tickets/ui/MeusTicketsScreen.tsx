import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import { ConsumerTicketService, PedidoService } from '@ajulabs/api-client';
import { Pedido } from '@ajulabs/types';
import { useAuthStore } from '../../../../store';
import { useTheme, useHardwareBack } from '../../../../hooks';
import {
  TicketConsumidor,
  TicketStatus,
  STATUS_META,
  tempoRelativo,
  mapTicketConsumidor,
} from '../model/data';
import { useTicketRealtime } from '@ajulabs/realtime';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const FILTERS: { id: 'todos' | TicketStatus; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'aberto', label: 'Abertos' },
  { id: 'em_andamento', label: 'Em andamento' },
  { id: 'resolvido', label: 'Resolvidos' },
];

export function MeusTicketsScreen({ onBack }: { onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const canGoBack = router.canGoBack();
  const handleBack = onBack ?? (canGoBack ? () => router.back() : undefined);
  useHardwareBack(() => {
    if (handleBack) {
      handleBack();
      return true;
    }
    return false;
  });
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const { isDark, bg, surf, borderL, text, textSec, textMut } = useTheme();

  const [tickets, setTickets] = useState<TicketConsumidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | TicketStatus>('todos');

  const [showCriar, setShowCriar] = useState(false);
  const [motivoForm, setMotivoForm] = useState('');
  const [pedidoSelecionado, setPedidoSelecionado] = useState<string | null>(null);
  const [pedidosRecentes, setPedidosRecentes] = useState<Pedido[]>([]);
  const [criando, setCriando] = useState(false);
  const [erroCriar, setErroCriar] = useState('');

  const fetch = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const raw = await ConsumerTicketService.listar(token);
      setTickets(raw.map(mapTicketConsumidor));
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (onBack) {
      fetch();
    }
  }, [onBack, fetch]);

  useFocusEffect(
    useCallback(() => {
      if (!onBack) {
        fetch();
      }
    }, [onBack, fetch]),
  );

  const abrirCriar = useCallback(async () => {
    setMotivoForm('');
    setPedidoSelecionado(null);
    setErroCriar('');
    setShowCriar(true);
    if (token) {
      const lista = await PedidoService.listar(token).catch(() => [] as Pedido[]);
      setPedidosRecentes(lista.slice(0, 6));
    }
  }, [token]);

  const fecharCriar = useCallback(() => {
    setShowCriar(false);
    setMotivoForm('');
    setPedidoSelecionado(null);
    setErroCriar('');
  }, []);

  const handleCriar = useCallback(async () => {
    if (!token) return;
    if (!motivoForm.trim()) {
      setErroCriar('Descreva o problema para abrir o ticket.');
      return;
    }
    if (!pedidoSelecionado) {
      setErroCriar('Selecione o pedido relacionado ao problema.');
      return;
    }
    if (pedidoSelecionado) {
      const duplicado = tickets.find(
        (t) =>
          t.pedido?.id === pedidoSelecionado &&
          (t.status === 'aberto' || t.status === 'em_andamento'),
      );
      if (duplicado) {
        setErroCriar(
          `Já existe um ticket ativo (${duplicado.protocolo}) para este pedido. Acesse-o para continuar o atendimento.`,
        );
        return;
      }
    }
    setCriando(true);
    setErroCriar('');
    try {
      const novo = await ConsumerTicketService.criar(
        token,
        motivoForm.trim(),
        pedidoSelecionado ?? undefined,
      );
      fecharCriar();
      router.push(`/(consumer)/tickets/${novo.id}` as any);
    } catch (e: any) {
      setErroCriar(e?.message ?? 'Erro ao criar ticket. Tente novamente.');
    } finally {
      setCriando(false);
    }
  }, [token, motivoForm, pedidoSelecionado, fecharCriar, router]);

  useTicketRealtime({
    apiUrl: API_URL,
    ticketId: null,
    roomId: userId ?? null,
    roomType: 'usuario',
    enabled: !!userId,
    onNovo: () => {
      fetch();
    },
    onStatus: ({ ticketId, status }) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: status as TicketStatus } : t)),
      );
    },
    onMensagem: (msg) => {
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== msg.ticketId) return t;
          if (t.mensagens.some((m) => m.id === msg.id)) return t;
          return {
            ...t,
            mensagens: [
              ...t.mensagens,
              {
                id: msg.id,
                remetente: msg.remetente as 'consumidor' | 'lojista',
                texto: msg.texto,
                criadoEm: msg.criadoEm,
              },
            ],
          };
        }),
      );
    },
  });

  const list = filter === 'todos' ? tickets : tickets.filter((t) => t.status === filter);
  const countFor = (id: 'todos' | TicketStatus) =>
    id === 'todos' ? tickets.length : tickets.filter((t) => t.status === id).length;

  const abertos = tickets.filter((t) => t.status === 'aberto').length;

  if (loading) {
    return (
      <View
        style={[
          s.container,
          { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <View
        style={[
          s.header,
          { backgroundColor: surf, borderBottomColor: borderL, paddingTop: insets.top + 12 },
        ]}
      >
        <View style={s.tituloRow}>
          {handleBack && (
            <TouchableOpacity onPress={handleBack} style={s.backBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={22} color={text} />
            </TouchableOpacity>
          )}
          <Text style={[s.titulo, { color: text }]}>Meus Tickets</Text>
        </View>
        <Text style={[s.subtitulo, { color: textSec as string }]}>
          {tickets.length === 0
            ? 'Nenhum ticket ainda'
            : `${tickets.length} ${tickets.length === 1 ? 'ticket' : 'tickets'}`}
        </Text>

        {abertos > 0 && (
          <View style={s.alertRow}>
            <Ionicons name="alert-circle" size={14} color="#DC2626" />
            <Text style={s.alertTxt}>
              {abertos}{' '}
              {abertos === 1 ? 'ticket aguardando resposta' : 'tickets aguardando resposta'}
            </Text>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtersScroll}>
          {FILTERS.map((f) => {
            const count = countFor(f.id);
            const active = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={[s.filterBtn, active && s.filterBtnActive]}
              >
                <Text style={[s.filterLabel, active && { color: colors.n0 }]}>{f.label}</Text>
                <View style={[s.filterBadge, active && s.filterBadgeActive]}>
                  <Text style={[s.filterBadgeTxt, active && { color: colors.n0 }]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View
        style={[
          s.tooltip,
          {
            backgroundColor: isDark ? 'rgba(255,126,0,0.1)' : '#FFF8F2',
            borderColor: isDark ? 'rgba(255,126,0,0.25)' : '#FFD9B3',
          },
        ]}
      >
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={colors.orange}
          style={{ marginTop: 1 }}
        />
        <Text style={[s.tooltipTxt, { color: textSec as string }]}>
          Abra um ticket pelo{' '}
          <Text style={{ color: colors.orange, fontWeight: '600' }}>Chat Aju</Text>
          {' ou toque em '}
          <Text style={{ color: colors.orange, fontWeight: '600' }}>+</Text>
          {' para criar manualmente.'}
        </Text>
      </View>

      {/* FAB: novo ticket */}
      <TouchableOpacity style={s.fab} onPress={abrirCriar} activeOpacity={0.85}>
        <Ionicons name="add" size={26} color={colors.n0} />
      </TouchableOpacity>

      {list.length === 0 ? (
        <View style={s.vazio}>
          <Ionicons name="ticket-outline" size={52} color={colors.n300} />
          <Text style={[s.vazioTitulo, { color: text }]}>
            {filter === 'todos' ? 'Nenhuma reclamação ainda' : 'Nenhum ticket nesse filtro'}
          </Text>
          <Text style={[s.vazioTxt, { color: textMut as string }]}>
            {filter === 'todos' ? 'Problemas com pedidos? Fale com a Aju no chat.' : ''}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {list.map((ticket) => {
            const meta = STATUS_META[ticket.status];
            return (
              <TouchableOpacity
                key={ticket.id}
                style={[
                  s.card,
                  {
                    backgroundColor: surf,
                    borderColor: ticket.status === 'aberto' ? '#DC2626' : borderL,
                  },
                ]}
                onPress={() => router.push(`/(consumer)/tickets/${ticket.id}` as any)}
                activeOpacity={0.8}
              >
                <View style={s.cardTop}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[s.protocolo, { color: text }]}>{ticket.protocolo}</Text>
                    <Text style={[s.lojaNome, { color: textSec as string }]} numberOfLines={1}>
                      {ticket.loja?.nome ?? '—'}
                    </Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon as any} size={11} color={meta.color} />
                    <Text style={[s.badgeTxt, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>

                <Text style={[s.motivo, { color: text }]} numberOfLines={2}>
                  {ticket.motivo}
                </Text>

                <View style={s.cardBottom}>
                  <Text style={[s.tempo, { color: textMut as string }]}>
                    {tempoRelativo(ticket.criadoEm)} atrás
                  </Text>
                  {ticket.mensagens.length > 0 && (
                    <View style={s.msgRow}>
                      <Ionicons name="chatbubble-outline" size={12} color={textSec as string} />
                      <Text style={[s.msgCount, { color: textSec as string }]}>
                        {ticket.mensagens.length}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={colors.n300} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
      {/* Modal: criar ticket manualmente */}
      <Modal visible={showCriar} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[s.modal, { backgroundColor: bg }]}>
            <View style={[s.modalHeader, { backgroundColor: surf, borderBottomColor: borderL }]}>
              <Text style={[s.modalTitulo, { color: text }]}>Novo Ticket</Text>
              <TouchableOpacity
                onPress={fecharCriar}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color={text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={s.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[s.modalLabel, { color: textSec as string }]}>
                Descreva o problema *
              </Text>
              <TextInput
                style={[
                  s.modalTextarea,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.n100,
                    borderColor: erroCriar && !motivoForm.trim() ? '#DC2626' : borderL,
                    color: text,
                  },
                ]}
                value={motivoForm}
                onChangeText={(v) => {
                  setMotivoForm(v);
                  if (v.trim()) setErroCriar('');
                }}
                placeholder="Ex: Recebi o produto errado, pedido atrasou mais de 2h..."
                placeholderTextColor={textSec as string}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              {!!erroCriar && <Text style={s.modalErro}>{erroCriar}</Text>}

              <Text style={[s.modalLabel, { color: textSec as string, marginTop: 20 }]}>
                Pedido relacionado *
              </Text>

              {pedidosRecentes.map((p) => {
                const selecionado = pedidoSelecionado === p.id;
                const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
                const data = new Date(p.criadoEm).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                });
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      s.pedidoOpcao,
                      {
                        borderColor: selecionado ? colors.orange : borderL,
                        backgroundColor: selecionado
                          ? isDark
                            ? 'rgba(242,118,15,0.12)'
                            : '#FFF8F2'
                          : surf,
                      },
                    ]}
                    onPress={() => setPedidoSelecionado(p.id)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={selecionado ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={colors.orange}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.pedidoOpcaoTxt, { color: text }]}>
                        #{p.id.slice(-6).toUpperCase()}
                        {'  '}
                        <Text style={{ color: textSec as string, fontWeight: '400' }}>{data}</Text>
                      </Text>
                      <Text style={[s.pedidoOpcaoSub, { color: textSec as string }]}>
                        {fmt(p.total)} · {p.lojaNome}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[s.btnSubmit, criando && { opacity: 0.6 }]}
                onPress={handleCriar}
                disabled={criando}
                activeOpacity={0.85}
              >
                {criando ? (
                  <ActivityIndicator color={colors.n0} />
                ) : (
                  <Text style={s.btnSubmitTxt}>Abrir ticket</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 0, borderBottomWidth: 1 },
  tituloRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.n100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: 20, fontWeight: '700' },
  subtitulo: { fontSize: 12, marginTop: 2, marginBottom: 10 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  alertTxt: { fontSize: 12, color: '#DC2626', fontWeight: '600' },
  filtersScroll: { marginBottom: 14 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: colors.n100,
    marginRight: 8,
  },
  filterBtnActive: { backgroundColor: colors.navy },
  filterLabel: { fontSize: 12, fontWeight: '600', color: colors.navy },
  filterBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 99,
    backgroundColor: colors.n0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterBadgeTxt: { fontSize: 10, fontWeight: '700', color: colors.n500 },
  tooltip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  tooltipTxt: { flex: 1, fontSize: 12, lineHeight: 17 },
  scroll: { padding: 16, paddingBottom: 24 },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32 },
  vazioTitulo: { fontSize: 17, fontWeight: '700' },
  vazioTxt: { fontSize: 13, textAlign: 'center' },
  card: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  protocolo: { fontSize: 14, fontWeight: '700' },
  lojaNome: { fontSize: 12, marginTop: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeTxt: { fontSize: 11, fontWeight: '600' },
  motivo: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tempo: { fontSize: 11.5, flex: 1 },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  msgCount: { fontSize: 11.5 },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
    zIndex: 10,
  },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitulo: { fontSize: 18, fontWeight: '700' },
  modalScroll: { padding: 20, paddingBottom: 40 },
  modalLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  modalTextarea: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 110,
  },
  modalErro: { fontSize: 11.5, color: '#DC2626', marginTop: 6, fontWeight: '500' },
  pedidoOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  pedidoOpcaoTxt: { fontSize: 13, fontWeight: '600' },
  pedidoOpcaoSub: { fontSize: 12, marginTop: 2 },
  btnSubmit: {
    backgroundColor: colors.orange,
    height: 52,
    borderRadius: 14,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  btnSubmitTxt: { color: colors.n0, fontSize: 15, fontWeight: '700' },
});
