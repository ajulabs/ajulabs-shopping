import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface StatCard {
  label: string;
  value: string;
  icon: string;
  color: string;
  onPress?: () => void;
}

export function EstoqueStatsGrid({ cards }: { cards: StatCard[] }) {
  return (
    <View style={s.grid}>
      {cards.map((card, i) => (
        <TouchableOpacity
          key={i}
          style={[s.gridCard, { backgroundColor: card.color }]}
          onPress={card.onPress}
          activeOpacity={card.onPress ? 0.82 : 1}
        >
          <View style={s.gridIconWrap}>
            <Ionicons name={card.icon as any} size={26} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={s.gridValue}>{card.value}</Text>
          <Text style={s.gridLabel}>{card.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginTop: 16 },
  gridCard: {
    width: '30.5%',
    borderRadius: 18,
    padding: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  gridIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridValue: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  gridLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)', lineHeight: 14 },
});
