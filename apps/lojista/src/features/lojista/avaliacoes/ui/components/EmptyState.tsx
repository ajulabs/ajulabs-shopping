import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../../shared/hooks';

export function EmptyState() {
  const theme = useTheme();
  return (
    <View style={s.emptyBox}>
      <View style={[s.emptyIcon, { backgroundColor: theme.surf2 }]}>
        <Ionicons name="star-outline" size={32} color={theme.textMut} />
      </View>
      <Text style={[s.emptyTitle, { color: theme.text }]}>Ainda sem avaliações</Text>
      <Text style={[s.emptyDesc, { color: theme.textMut }]}>
        Assim que seus clientes começarem a avaliar, você verá aqui um resumo das notas, pontos
        fortes e o que melhorar.
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
