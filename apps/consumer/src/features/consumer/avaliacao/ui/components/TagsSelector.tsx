import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@ajulabs/theme';
import { type TagAvaliacao } from '@ajulabs/types';
import { useTheme } from '../../../../../shared/hooks';

export function TagsSelector({
  nota,
  catalogo,
  selected,
  onToggle,
}: {
  nota: number;
  catalogo: TagAvaliacao[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const { text, textSec, borderL } = useTheme();

  // Tags só aparecem depois que o usuário escolheu uma nota.
  // Sentimento varia com a nota: 4-5 → positivas, 1-3 → negativas.
  if (nota === 0) return null;
  const sentimento = nota >= 4 ? 'positiva' : 'negativa';
  const visiveis = catalogo.filter((t) => t.sentimento === sentimento);
  if (visiveis.length === 0) return null;

  return (
    <View style={styles.tagsSection}>
      <Text style={[styles.tagsHint, { color: textSec as string }]}>
        {sentimento === 'positiva'
          ? 'O que foi bom? (opcional)'
          : 'O que pode melhorar? (opcional)'}
      </Text>
      <View style={styles.tagsWrap}>
        {visiveis.map((tag) => {
          const ativo = selected.includes(tag.id);
          return (
            <TouchableOpacity
              key={tag.id}
              onPress={() => onToggle(tag.id)}
              activeOpacity={0.7}
              style={[
                styles.tagChip,
                {
                  backgroundColor: ativo ? colors.orange : 'transparent',
                  borderColor: ativo ? colors.orange : borderL,
                },
              ]}
            >
              <Text style={[styles.tagChipTxt, { color: ativo ? '#FFFFFF' : (text as string) }]}>
                {tag.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tagsSection: { marginTop: 10, marginHorizontal: 4, gap: 8 },
  tagsHint: { fontSize: 12, fontWeight: '600' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1.5 },
  tagChipTxt: { fontSize: 12, fontWeight: '600' },
});
