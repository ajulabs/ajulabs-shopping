import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ticket, STATUS_META } from '../../model/data';
import { dataCurta } from '../../lib/format';

interface Props {
  ticket: Ticket;
  onPress: (ticket: Ticket) => void;
}

export function TicketCard({ ticket, onPress }: Props) {
  const meta = STATUS_META[ticket.status];
  return (
    <TouchableOpacity onPress={() => onPress(ticket)} activeOpacity={0.85}>
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
                  i.quantidade > 1 ? `${i.nomeSnapshot} x${i.quantidade}` : i.nomeSnapshot,
                )
                .join(', ')}
              {ticket.pedido.itens.length > 2 ? ` +${ticket.pedido.itens.length - 2}` : ''}
            </Text>
          )}
          <Text style={s.data}>{dataCurta(ticket.criadoEm)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
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
