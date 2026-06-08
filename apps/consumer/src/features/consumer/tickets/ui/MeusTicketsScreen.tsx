import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import { ConsumerTicketService } from '@ajulabs/api-client';
import { useAuthStore } from '../../../../store';
import { useTheme } from '../../../../hooks';
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
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const { isDark, bg, surf, borderL, text, textSec, textMut } = useTheme();

  const [tickets, setTickets] = useState<TicketConsumidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | TicketStatus>('todos');

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
          Tickets são abertos quando você relata um problema pelo{' '}
          <Text style={{ color: colors.orange, fontWeight: '600' }}>Chat Aju</Text>
          {'. '}
          Acesse o chat e descreva seu problema para criar um novo ticket.
        </Text>
      </View>

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
});
