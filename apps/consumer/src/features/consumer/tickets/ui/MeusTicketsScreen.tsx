import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import { ConsumerTicketService } from '@ajulabs/api-client';
import { useAuthStore } from '../../../../store';
import { useTheme } from '../../../../hooks';
import { TicketConsumidor, TicketStatus, STATUS_META, tempoRelativo, mapTicketConsumidor } from '../model/data';

const FILTERS: { id: 'todos' | TicketStatus; label: string }[] = [
  { id: 'todos',        label: 'Todos' },
  { id: 'aberto',       label: 'Abertos' },
  { id: 'em_andamento', label: 'Em andamento' },
  { id: 'resolvido',    label: 'Resolvidos' },
];

export function MeusTicketsScreen() {
  const router  = useRouter();
  const token   = useAuthStore(s => s.token);
  const { bg, surf, borderL, text, textSec, textMut } = useTheme();

  const [tickets, setTickets] = useState<TicketConsumidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'todos' | TicketStatus>('todos');

  const fetch = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const raw = await ConsumerTicketService.listar(token);
      setTickets(raw.map(mapTicketConsumidor));
    } catch {}
    setLoading(false);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [fetch])
  );

  const list = filter === 'todos' ? tickets : tickets.filter(t => t.status === filter);
  const countFor = (id: 'todos' | TicketStatus) =>
    id === 'todos' ? tickets.length : tickets.filter(t => t.status === id).length;

  const abertos = tickets.filter(t => t.status === 'aberto').length;

  if (loading) {
    return (
      <View style={[s.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <View style={[s.header, { backgroundColor: surf, borderBottomColor: borderL }]}>
        <Text style={[s.titulo, { color: text }]}>Meus Tickets</Text>
        <Text style={[s.subtitulo, { color: textSec as string }]}>
          {tickets.length === 0 ? 'Nenhum ticket ainda' : `${tickets.length} ${tickets.length === 1 ? 'ticket' : 'tickets'}`}
        </Text>

        {abertos > 0 && (
          <View style={s.alertRow}>
            <Ionicons name="alert-circle" size={14} color="#DC2626" />
            <Text style={s.alertTxt}>
              {abertos} {abertos === 1 ? 'ticket aguardando resposta' : 'tickets aguardando resposta'}
            </Text>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtersScroll}>
          {FILTERS.map(f => {
            const count  = countFor(f.id);
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
          {list.map(ticket => {
            const meta = STATUS_META[ticket.status];
            return (
              <TouchableOpacity
                key={ticket.id}
                style={[s.card, { backgroundColor: surf, borderColor: ticket.status === 'aberto' ? '#DC2626' : borderL }]}
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

                <Text style={[s.motivo, { color: text }]} numberOfLines={2}>{ticket.motivo}</Text>

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
  header:    { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 0, borderBottomWidth: 1 },
  titulo:    { fontSize: 20, fontWeight: '700' },
  subtitulo: { fontSize: 12, marginTop: 2, marginBottom: 10 },
  alertRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  alertTxt:  { fontSize: 12, color: '#DC2626', fontWeight: '600' },
  filtersScroll: { marginBottom: 14 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12,
               paddingVertical: 6, borderRadius: 99, backgroundColor: colors.n100, marginRight: 8 },
  filterBtnActive: { backgroundColor: colors.navy },
  filterLabel: { fontSize: 12, fontWeight: '600', color: colors.navy },
  filterBadge: { minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 99,
                 backgroundColor: colors.n0, alignItems: 'center', justifyContent: 'center' },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterBadgeTxt: { fontSize: 10, fontWeight: '700', color: colors.n500 },
  scroll:    { padding: 16, paddingBottom: 24 },
  vazio:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32 },
  vazioTitulo: { fontSize: 17, fontWeight: '700' },
  vazioTxt:  { fontSize: 13, textAlign: 'center' },
  card:      { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  cardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  protocolo: { fontSize: 14, fontWeight: '700' },
  lojaNome:  { fontSize: 12, marginTop: 1 },
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8,
               paddingVertical: 3, borderRadius: 99 },
  badgeTxt:  { fontSize: 11, fontWeight: '600' },
  motivo:    { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tempo:     { fontSize: 11.5, flex: 1 },
  msgRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  msgCount:  { fontSize: 11.5 },
});
