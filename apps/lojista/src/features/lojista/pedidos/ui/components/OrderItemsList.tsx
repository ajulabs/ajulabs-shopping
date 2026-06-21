import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { brl, type OrderItem } from '../../lib';

interface Props {
  itens: OrderItem[];
}

export function OrderItemsList({ itens }: Props) {
  return (
    <View style={s.card}>
      {itens.map((it, i) => (
        <View key={i} style={[s.itemRow, i < itens.length - 1 && s.itemBorder]}>
          <View style={s.qtyBadge}>
            <Text style={s.qtyText}>{it.qtd}×</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.itemName}>{it.nome}</Text>
            <Text style={s.itemEach}>{brl(it.preco)} cada</Text>
          </View>
          <Text style={s.itemTotal}>{brl(it.preco * it.qtd)}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    padding: 12,
    marginBottom: 14,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#E4E7F1' },
  qtyBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 14, fontWeight: '700', color: '#B34D00' },
  itemName: { fontSize: 13.5, fontWeight: '600', color: '#000933' },
  itemEach: { fontSize: 11.5, color: '#9099B3' },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#000933' },
});
