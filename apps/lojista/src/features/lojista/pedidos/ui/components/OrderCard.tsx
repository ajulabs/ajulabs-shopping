import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATUS_META, brl, type Order } from '../../lib';

interface Props {
  order: Order;
  borderColor: string;
  onPress: () => void;
  onAdvance: () => void;
  onCancel: () => void;
}

export function OrderCard({ order: o, borderColor, onPress, onAdvance, onCancel }: Props) {
  const meta = STATUS_META[o.status];
  const isNew = o.status === 'novo';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Animated.View style={[s.card, isNew && { borderColor, borderWidth: 2 }]}>
        <View style={s.cardTop}>
          <View>
            <Text style={s.orderId}>{o.id}</Text>
            <Text style={s.orderMeta}>
              {o.hora} · {o.cliente} · {o.distancia}
            </Text>
          </View>
          <View
            style={[
              s.badge,
              {
                backgroundColor: o.status === 'pronto' && o.entregadorId ? '#E0F2FE' : meta.bg,
              },
            ]}
          >
            <Text
              style={[
                s.badgeText,
                {
                  color: o.status === 'pronto' && o.entregadorId ? '#0369A1' : meta.color,
                },
              ]}
            >
              {o.status === 'pronto' && o.entregadorId ? 'A caminho' : meta.label}
            </Text>
          </View>
        </View>
        {o.itens.map((it, i) => (
          <View key={i} style={s.itemRow}>
            <Text style={s.itemName}>
              <Text style={s.itemQty}>{it.qtd}×</Text> {it.nome}
            </Text>
            <Text style={s.itemPrice}>{brl(it.preco * it.qtd)}</Text>
          </View>
        ))}
        {o.obs && (
          <View style={s.obs}>
            <Text style={s.obsText}>
              <Text style={{ fontWeight: '700' }}>Obs:</Text> {o.obs}
            </Text>
          </View>
        )}
        <View style={s.cardBottom}>
          <Text style={s.total}>{brl(o.total)}</Text>
          {meta.next && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: isNew ? '#DE6708' : '#000933' }]}
              onPress={onAdvance}
              activeOpacity={0.8}
            >
              <Text style={s.actionBtnText}>{meta.next}</Text>
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </TouchableOpacity>
          )}
          {!meta.next && o.status === 'pronto' && !o.entregadorId && (
            <View style={s.dispatched}>
              <Ionicons name="time-outline" size={14} color="#7C3AED" />
              <Text style={[s.dispatchedText, { color: '#7C3AED' }]}>Aguardando motoboy</Text>
            </View>
          )}
          {!meta.next && o.status === 'pronto' && o.entregadorId && (
            <View style={s.dispatched}>
              <Ionicons name="bicycle" size={14} color="#0369A1" />
              <Text style={[s.dispatchedText, { color: '#0369A1' }]}>
                Entregador a caminho{o.entregadorNome ? ` · ${o.entregadorNome}` : ''}
              </Text>
            </View>
          )}
          {!meta.next && o.status === 'despachado' && (
            <View style={s.dispatched}>
              <Ionicons name="bicycle" size={14} color="#0369A1" />
              <Text style={[s.dispatchedText, { color: '#0369A1' }]}>
                {(o as any).motoboy ?? 'Despachado'}
              </Text>
            </View>
          )}
          {!meta.next && o.status === 'entregue' && (
            <View style={s.dispatched}>
              <Ionicons name="checkmark-circle" size={14} color="#046C2E" />
              <Text style={[s.dispatchedText, { color: '#046C2E' }]}>Entrega concluída</Text>
            </View>
          )}
        </View>
        {['novo', 'preparando', 'pronto'].includes(o.status) && (
          <TouchableOpacity style={s.cancelLink} onPress={onCancel} activeOpacity={0.7}>
            <Ionicons name="close-circle-outline" size={13} color="#9B2727" />
            <Text style={s.cancelLinkTxt}>
              {o.status === 'novo' ? 'Recusar pedido' : 'Cancelar pedido'}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderId: { fontSize: 16, fontWeight: '700', color: '#000933' },
  orderMeta: { fontSize: 12, color: '#9099B3', marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  itemName: { fontSize: 13, color: '#000933' },
  itemQty: { fontWeight: '700' },
  itemPrice: { fontSize: 13, color: '#9099B3' },
  obs: { marginTop: 8, padding: 8, borderRadius: 8, backgroundColor: '#FFF0E6' },
  obsText: { fontSize: 11.5, color: '#B34D00', lineHeight: 18 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  total: { fontSize: 18, fontWeight: '700', color: '#000933' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  dispatched: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dispatchedText: { fontSize: 12, fontWeight: '600', color: '#046C2E' },
  cancelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F7',
  },
  cancelLinkTxt: { fontSize: 12, fontWeight: '600', color: '#9B2727' },
});
