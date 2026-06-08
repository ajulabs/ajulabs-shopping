import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { LojistaService } from '@ajulabs/api-client';
import { useAuthLojistaStore } from '../../../../store';
import { Ticket, TicketStatus, STATUS_META, FILTERS, mapTicket } from '../model/data';
import { TicketDetail } from './TicketDetail';
import { useTicketRealtime } from '@ajulabs/realtime';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

function dataCurta(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function TicketsScreen({ onBack }: { onBack?: () => void }) {
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const lojaNome = useAuthLojistaStore((s) => s.lojaNome);
  const { autoTicketId } = useLocalSearchParams<{ autoTicketId?: string }>();
  const autoSelectHandled = useRef<string | undefined>(undefined);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | TicketStatus>('todos');
  const [selected, setSelected] = useState<Ticket | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!lojaId || !token) {
      setLoading(false);
      return;
    }
    try {
      const raw = await LojistaService.listarTickets(lojaId, token);
      setTickets(raw.map(mapTicket));
    } catch (err) {
      console.error('[TicketsScreen] fetch error:', err);
    }
    setLoading(false);
  }, [lojaId, token]);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 60000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  useEffect(() => {
    if (!autoTicketId || autoSelectHandled.current === autoTicketId || tickets.length === 0) return;
    const ticket = tickets.find((t) => t.id === autoTicketId);
    if (ticket) {
      autoSelectHandled.current = autoTicketId;
      setSelected(ticket);
    }
  }, [autoTicketId, tickets]);

  useTicketRealtime({
    apiUrl: API_URL,
    ticketId: null,
    roomId: lojaId ?? null,
    roomType: 'lojista',
    enabled: !!lojaId,
    onNovo: fetchTickets,
    onMensagem: fetchTickets,
    onStatus: fetchTickets,
  });

  const handleTicketUpdate = useCallback((updated: Ticket) => {
    setTickets((ts) => ts.map((t) => (t.id === updated.id ? updated : t)));
    setSelected(updated);
  }, []);

  if (selected) {
    return (
      <TicketDetail
        ticket={selected}
        token={token!}
        onBack={() => setSelected(null)}
        onUpdate={handleTicketUpdate}
      />
    );
  }

  const list = filter === 'todos' ? tickets : tickets.filter((t) => t.status === filter);

  const countFor = (id: 'todos' | TicketStatus) =>
    id === 'todos' ? tickets.length : tickets.filter((t) => t.status === id).length;

  const abertos = tickets.filter((t) => t.status === 'aberto').length;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerSub}>{lojaNome ?? 'Minha Loja'}</Text>
            <View style={s.tituloRow}>
              {onBack && (
                <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
                  <Ionicons name="chevron-back" size={22} color="#000933" />
                </TouchableOpacity>
              )}
              <Text style={s.headerTitle}>Tickets</Text>
            </View>
          </View>
          <TouchableOpacity onPress={fetchTickets} style={s.refreshBtn} activeOpacity={0.7}>
            <Ionicons name="refresh" size={18} color="#9099B3" />
          </TouchableOpacity>
        </View>

        {abertos > 0 && (
          <View style={s.alertBanner}>
            <View style={s.alertIcon}>
              <Ionicons name="alert-circle" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>
                {abertos} ticket{abertos > 1 ? 's' : ''} aberto{abertos > 1 ? 's' : ''}
              </Text>
              <Text style={s.alertSub}>Aguardando análise</Text>
            </View>
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
                <Text style={[s.filterLabel, active && s.filterLabelActive]}>{f.label}</Text>
                <View style={[s.filterCount, active && s.filterCountActive]}>
                  <Text style={[s.filterCountText, active && s.filterCountTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#DE6708" />
        </View>
      ) : (
        <ScrollView style={s.list} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {list.length === 0 && (
            <View style={s.emptyWrap}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#C8CDE0" />
              <Text style={s.empty}>Nenhum ticket nesse filtro</Text>
            </View>
          )}
          {list.map((ticket) => {
            const meta = STATUS_META[ticket.status];
            return (
              <TouchableOpacity
                key={ticket.id}
                onPress={() => setSelected(ticket)}
                activeOpacity={0.85}
              >
                <View style={[s.card, ticket.urgente && s.cardUrgente]}>
                  <View style={s.cardTop}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={s.protocolRow}>
                        <Text style={s.protocolo}>{ticket.protocolo}</Text>
                        {ticket.urgente && (
                          <View style={s.urgenteBadge}>
                            <Ionicons name="flame" size={10} color="#fff" />
                            <Text style={s.urgenteText}>Urgente</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.consumidor} numberOfLines={1}>
                        {ticket.consumidor.nome} · {ticket.consumidor.telefone}
                      </Text>
                    </View>
                    <View style={[s.badge, { backgroundColor: meta.bg }]}>
                      <Text style={[s.badgeText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                  </View>

                  <Text style={s.motivo} numberOfLines={2}>
                    {ticket.motivo}
                  </Text>

                  <View style={s.cardBottom}>
                    {ticket.pedido && (
                      <Text style={s.pedidoInfo}>
                        Pedido ·{' '}
                        {ticket.pedido.itens
                          .slice(0, 2)
                          .map((i) =>
                            i.quantidade > 1
                              ? `${i.nomeSnapshot} x${i.quantidade}`
                              : i.nomeSnapshot,
                          )
                          .join(', ')}
                        {ticket.pedido.itens.length > 2
                          ? ` +${ticket.pedido.itens.length - 2}`
                          : ''}
                      </Text>
                    )}
                    <Text style={s.data}>{dataCurta(ticket.criadoEm)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerSub: {
    fontSize: 11,
    color: '#9099B3',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#000933', marginTop: 2 },
  tituloRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBanner: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: { fontSize: 13, fontWeight: '600', color: '#fff' },
  alertSub: { fontSize: 11, color: '#fff', opacity: 0.9, marginTop: 1 },
  filtersScroll: { marginTop: 14, marginBottom: 14 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: '#F0F1F7',
    marginRight: 8,
  },
  filterBtnActive: { backgroundColor: '#000933' },
  filterLabel: { fontSize: 12.5, fontWeight: '600', color: '#000933' },
  filterLabelActive: { color: '#fff' },
  filterCount: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 99,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterCountText: { fontSize: 10, fontWeight: '700', color: '#9099B3' },
  filterCountTextActive: { color: '#fff' },
  list: { flex: 1 },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  empty: { textAlign: 'center', color: '#9099B3', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  cardUrgente: { borderColor: '#DC2626', borderWidth: 1.5 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  protocolRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  protocolo: { fontSize: 15, fontWeight: '700', color: '#000933' },
  urgenteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
  },
  urgenteText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  consumidor: { fontSize: 12, color: '#9099B3' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  motivo: { fontSize: 13, color: '#000933', lineHeight: 19, marginBottom: 10 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pedidoInfo: { fontSize: 11.5, color: '#9099B3', flex: 1, marginRight: 8 },
  data: { fontSize: 11.5, color: '#C8CDE0', fontWeight: '600' },
});
