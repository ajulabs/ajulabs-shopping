import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../../../theme';
import { TIPOS_PRODUTO } from '../../model/tipoProdutos';
import { useTheme } from '../../../../../shared/hooks';

export function CategoriaGrid({
  selectedCatId,
  onSelect,
}: {
  selectedCatId?: string;
  onSelect: (catId: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.catGrid}>
      {TIPOS_PRODUTO.map((c) => {
        const selected = selectedCatId === c.id;
        return (
          <TouchableOpacity
            key={c.id}
            style={[
              styles.catCard,
              { backgroundColor: theme.surf, borderColor: theme.border },
              selected && styles.catCardSelected,
            ]}
            onPress={() => onSelect(c.id)}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons
              name={c.icon as any}
              size={28}
              color={selected ? colors.orange : theme.textMut}
            />
            <Text
              style={[styles.catNome, { color: theme.textSec }, selected && styles.catNomeSelected]}
              numberOfLines={2}
            >
              {c.nome}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catCard: {
    width: '31%',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n0,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 8,
  },
  catCardSelected: { borderColor: colors.orange, backgroundColor: '#FFF3E8' },
  catNome: { fontSize: 11, fontWeight: '600', color: colors.n600, textAlign: 'center' },
  catNomeSelected: { color: colors.orange600 },
});
