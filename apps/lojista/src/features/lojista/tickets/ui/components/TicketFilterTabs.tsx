import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { TicketStatus, FILTERS } from '../../model/data';

interface Props {
  filter: 'todos' | TicketStatus;
  onSelect: (id: 'todos' | TicketStatus) => void;
  countFor: (id: 'todos' | TicketStatus) => number;
}

export function TicketFilterTabs({ filter, onSelect, countFor }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtersScroll}>
      {FILTERS.map((f) => {
        const count = countFor(f.id);
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
