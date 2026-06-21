import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { brl, type Order } from '../../lib';

interface Props {
  order: Order;
}

export function OrderSummary({ order }: Props) {
  return (
    <View style={[s.card, { marginTop: 16 }]}>
      <View style={s.summaryRow}>
        <Text style={s.summaryLabel}>Subtotal</Text>
        <Text style={s.summaryValue}>{brl(order.total - 8.9)}</Text>
      </View>
      <View style={s.summaryRow}>
        <Text style={s.summaryLabel}>Taxa de entrega</Text>
        <Text style={s.summaryValue}>R$ 8,90</Text>
      </View>
      <View style={s.summaryRow}>
        <Text style={s.summaryLabel}>Pagamento</Text>
        <Text style={[s.summaryValue, { fontWeight: '600' }]}>Pix · pago</Text>
      </View>
      <View style={s.totalRow}>
        <Text style={s.totalLabel}>Total</Text>
        <Text style={s.totalValue}>{brl(order.total)}</Text>
      </View>
      <Text style={s.platformFee}>
        Você recebe{' '}
        <Text style={{ color: '#046C2E', fontWeight: '700' }}>{brl(order.total * 0.88)}</Text>{' '}
        depois da taxa da plataforma (12%).
      </Text>
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
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryLabel: { fontSize: 13, color: '#9099B3' },
  summaryValue: { fontSize: 13, color: '#000933' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E4E7F1',
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#000933' },
  totalValue: { fontSize: 20, fontWeight: '700', color: '#000933' },
  platformFee: { fontSize: 11, color: '#9099B3', marginTop: 8, lineHeight: 16 },
});
