import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function EmptyState() {
  return (
    <View style={s.emptyBox}>
      <View style={s.emptyIcon}>
        <Ionicons name="star-outline" size={32} color="#9099B3" />
      </View>
      <Text style={s.emptyTitle}>Ainda sem avaliações</Text>
      <Text style={s.emptyDesc}>
        Quando os clientes começarem a avaliar suas entregas, aparecerá aqui um resumo das notas e
        comentários.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0F1F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#000933' },
  emptyDesc: {
    fontSize: 13,
    color: '#9099B3',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },
});
