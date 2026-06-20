import React from 'react';
import { Text, ScrollView, TouchableOpacity, View, StyleSheet } from 'react-native';
import type { Order, OrderStatus } from '../../lib';

interface Props {
  filters: { id: 'todos' | OrderStatus; label: string }[];
  filter: 'todos' | OrderStatus;
  orders: Order[];
  onSelect: (id: 'todos' | OrderStatus) => void;
}

export function OrderFilterBar({ filters, filter, orders, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtersScroll}>
      {filters.map((f) => {
        const count =
          f.id === 'todos' ? orders.length : orders.filter((o) => o.status === f.id).length;
        const active = filter === f.id;
        return (
          <TouchableOpacity
            key={f.id}
            onPress={() => onSelect(f.id)}
            style={[s.filterBtn, active && s.filterBtnActive]}
          >
            <Text style={[s.filterLabel, active && s.filterLabelActive]}>{f.label}</Text>
            <View style={[s.filterCount, active && s.filterCountActive]}>
              <Text style={[s.filterCountText, active && s.filterCountTextActive]}>{count}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
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
});
