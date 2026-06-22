import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../../shared/hooks';

export type PedidoFilter = 'todos' | 'em_andamento' | 'entregue' | 'cancelado';

interface Props {
  filters: { id: PedidoFilter; label: string }[];
  filter: PedidoFilter;
  counts: Record<PedidoFilter, number>;
  onSelect: (id: PedidoFilter) => void;
}

export function OrdersFilterBar({ filters, filter, counts, onSelect }: Props) {
  const { isDark, text } = useTheme();
  const inactiveBg = isDark ? 'rgba(255,255,255,0.08)' : '#F0F1F7';
  const inactiveCountBg = isDark ? 'rgba(255,255,255,0.12)' : '#fff';
  const inactiveCountColor = isDark ? 'rgba(255,255,255,0.7)' : '#9099B3';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.row}
      style={s.scroll}
    >
      {filters.map((f) => {
        const count = counts[f.id] ?? 0;
        const active = filter === f.id;
        return (
          <TouchableOpacity
            key={f.id}
            onPress={() => onSelect(f.id)}
            activeOpacity={0.8}
            style={[s.chip, { backgroundColor: active ? colors.navy : inactiveBg }]}
          >
            <Text style={[s.label, { color: active ? colors.n0 : text }]} numberOfLines={1}>
              {f.label}
            </Text>
            <View
              style={[
                s.count,
                { backgroundColor: active ? 'rgba(255,255,255,0.25)' : inactiveCountBg },
              ]}
            >
              <Text style={[s.countText, { color: active ? colors.n0 : inactiveCountColor }]}>
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { marginTop: 14, marginBottom: 14 },
  row: { gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  label: { fontSize: 12.5, fontWeight: '600' },
  count: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 10, fontWeight: '700' },
});
