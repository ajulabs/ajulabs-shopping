import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { brl, type OrderItem } from '../../lib';
import { useTheme } from '../../../../../shared/hooks';

interface Props {
  itens: OrderItem[];
}

export function OrderItemsList({ itens }: Props) {
  const theme = useTheme();
  return (
    <View style={[s.card, { backgroundColor: theme.surf, borderColor: theme.border }]}>
      {itens.map((it, i) => (
        <View
          key={i}
          style={[
            s.itemRow,
            i < itens.length - 1 && [s.itemBorder, { borderBottomColor: theme.borderL }],
          ]}
        >
          <View style={s.qtyBadge}>
            <Text style={s.qtyText}>{it.qtd}×</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.itemName, { color: theme.text }]}>{it.nome}</Text>
            <Text style={[s.itemEach, { color: theme.textMut }]}>{brl(it.preco)} cada</Text>
          </View>
          <Text style={[s.itemTotal, { color: theme.text }]}>{brl(it.preco * it.qtd)}</Text>
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
