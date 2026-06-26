import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { PapelColaborador } from '@ajulabs/types';
import { colors } from '../../../../../theme';
import { PAPEL_LABEL, PAPEL_COLOR } from '../../lib/colaboradores';
import { useTheme } from '../../../../../shared/hooks';

interface Props {
  value: PapelColaborador;
  onChange: (papel: PapelColaborador) => void;
}

export function RoleSelectMenu({ value, onChange }: Props) {
  const theme = useTheme();
  return (
    <>
      <Text style={[styles.selectorLabel, { color: theme.textSec }]}>PAPEL</Text>
      <View style={styles.papelRow}>
        {(['admin', 'gerente', 'funcionario'] as PapelColaborador[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.papelOption,
              { borderColor: theme.border },
              value === p && {
                backgroundColor: PAPEL_COLOR[p] + '18',
                borderColor: PAPEL_COLOR[p],
              },
            ]}
            onPress={() => onChange(p)}
          >
            <Text
              style={[
                styles.papelOptionText,
                { color: theme.textSec },
                value === p && { color: PAPEL_COLOR[p], fontWeight: '700' },
              ]}
            >
              {PAPEL_LABEL[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  selectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  papelRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  papelOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  papelOptionText: { fontSize: 12, fontWeight: '600', color: colors.n600 },
});
