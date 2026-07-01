import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { statusMeta, caminhoMeta, brl, type Order } from '../../lib';
import { useTheme } from '../../../../../shared/hooks';

interface Props {
  order: Order;
  borderColor: string;
  onPress: () => void;
  onAdvance: () => void;
  onCancel: () => void;
}

export function OrderCard({ order: o, borderColor, onPress, onAdvance, onCancel }: Props) {
  const theme = useTheme();
  const meta = statusMeta(o.status, theme.isDark);
  const caminho = caminhoMeta(theme.isDark);
  const isNew = o.status === 'novo';
  const aCaminho = o.status === 'pronto' && !!o.entregadorId;
  const cancelCor = theme.isDark ? '#FCA5A5' : '#9B2727';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Animated.View
        style={[
          s.card,
          { backgroundColor: theme.surf, borderColor: theme.border },
          isNew && { borderColor, borderWidth: 2 },
        ]}
      >
        <View style={s.cardTop}>
          <View>
            <Text style={[s.orderId, { color: theme.text }]}>{o.id}</Text>
            <Text style={[s.orderMeta, { color: theme.textMut }]}>
              {o.hora} · {o.cliente} · {o.distancia}
            </Text>
          </View>
          <View
            style={[
              s.badge,
              {
                backgroundColor: aCaminho ? caminho.bg : meta.bg,
              },
            ]}
          >
            <Text
              style={[
                s.badgeText,
                {
                  color: aCaminho ? caminho.color : meta.color,
                },
              ]}
            >
              {aCaminho ? 'A caminho' : meta.label}
            </Text>
          </View>
        </View>
        {o.itens.map((it, i) => (
          <View key={i} style={s.itemRow}>
            <Text style={[s.itemName, { color: theme.text }]}>
              <Text style={s.itemQty}>{it.qtd}×</Text> {it.nome}
            </Text>
            <Text style={[s.itemPrice, { color: theme.textMut }]}>{brl(it.preco * it.qtd)}</Text>
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
          <Text style={[s.total, { color: theme.text }]}>{brl(o.total)}</Text>
          {meta.next && (
            <TouchableOpacity
              style={[
                s.actionBtn,
                { backgroundColor: isNew ? '#DE6708' : theme.isDark ? '#3A4170' : '#000933' },
              ]}
              onPress={onAdvance}
              activeOpacity={0.8}
            >
              <Text style={s.actionBtnText}>{meta.next}</Text>
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </TouchableOpacity>
          )}
          {!meta.next && o.status === 'pronto' && !o.entregadorId && (
            <View style={s.dispatched}>
              <Ionicons name="time-outline" size={14} color={meta.color} />
              <Text style={[s.dispatchedText, { color: meta.color }]}>Aguardando motoboy</Text>
            </View>
          )}
          {!meta.next && o.status === 'pronto' && o.entregadorId && (
            <View style={s.dispatched}>
              <Ionicons name="bicycle" size={14} color={caminho.color} />
              <Text style={[s.dispatchedText, { color: caminho.color }]} numberOfLines={1}>
                {o.entregadorNome
                  ? `${o.entregadorNome.trim().split(/\s+/)[0]} a caminho`
                  : 'Entregador a caminho'}
              </Text>
            </View>
          )}
          {!meta.next && o.status === 'despachado' && (
            <View style={s.dispatched}>
              <Ionicons name="bicycle" size={14} color={meta.color} />
              <Text style={[s.dispatchedText, { color: meta.color }]} numberOfLines={1}>
                {(o as any).motoboy ?? 'Despachado'}
              </Text>
            </View>
          )}
          {!meta.next && o.status === 'entregue' && (
            <View style={s.dispatched}>
              <Ionicons name="checkmark-circle" size={14} color={meta.color} />
              <Text style={[s.dispatchedText, { color: meta.color }]}>Entrega concluída</Text>
            </View>
          )}
          {!meta.next && o.status === 'cancelado' && (
            <View style={s.dispatched}>
              <Ionicons name="close-circle" size={14} color={meta.color} />
              <Text style={[s.dispatchedText, { color: meta.color }]}>Cancelado</Text>
            </View>
          )}
        </View>
        {['novo', 'preparando', 'pronto'].includes(o.status) && (
          <TouchableOpacity
            style={[s.cancelLink, { borderTopColor: theme.borderL }]}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={13} color={cancelCor} />
            <Text style={[s.cancelLinkTxt, { color: cancelCor }]}>
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
  total: { fontSize: 18, fontWeight: '700', color: '#000933', flexShrink: 0 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  dispatched: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, marginLeft: 8 },
  dispatchedText: { fontSize: 12, fontWeight: '600', color: '#046C2E', flexShrink: 1 },
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
