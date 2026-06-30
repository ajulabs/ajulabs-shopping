import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useTheme } from '../../../../../shared/hooks';
import type { Theme } from '../../../../../shared/hooks/useTheme';

export type EntregaFilter = 'todos' | 'em_andamento' | 'entregue' | 'cancelado';

interface Props {
  filters: { id: EntregaFilter; label: string }[];
  filter: EntregaFilter;
  counts: Record<EntregaFilter, number>;
  onSelect: (id: EntregaFilter) => void;
}

export function EntregasFilterBar({ filters, filter, counts, onSelect }: Props) {
  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
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
            style={[s.chip, active && s.chipActive]}
          >
            <Text style={[s.label, active && s.labelActive]} numberOfLines={1}>
              {f.label}
            </Text>
            <View style={[s.count, active && s.countActive]}>
              <Text style={[s.countText, active && s.countTextActive]}>{count}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    scroll: { marginTop: 14, marginBottom: 14 },
    row: { gap: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 99,
      backgroundColor: theme.surf2,
    },
    chipActive: { backgroundColor: theme.isDark ? '#3A4170' : '#000933' },
    label: { fontSize: 12.5, fontWeight: '600', color: theme.text },
    labelActive: { color: '#fff' },
    count: {
      minWidth: 18,
      height: 18,
      paddingHorizontal: 5,
      borderRadius: 99,
      backgroundColor: theme.surf,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
    countText: { fontSize: 10, fontWeight: '700', color: theme.textMut },
    countTextActive: { color: '#fff' },
  });
}
