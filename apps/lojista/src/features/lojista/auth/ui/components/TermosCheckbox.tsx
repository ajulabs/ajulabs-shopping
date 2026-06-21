import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../theme';

interface TermosCheckboxProps {
  aceitou: boolean;
  error?: string;
  onToggle: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
}

export function TermosCheckbox({ aceitou, error, onToggle, onLayout }: TermosCheckboxProps) {
  return (
    <>
      <TouchableOpacity
        onLayout={onLayout}
        style={styles.termosRow}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <Ionicons
          name={aceitou ? 'checkbox' : 'square-outline'}
          size={20}
          color={error ? '#E24B4A' : aceitou ? colors.orange : colors.n300}
        />
        <Text style={styles.terms}>
          Li e aceito os <Text style={styles.termsLink}>Termos de Uso</Text> e a{' '}
          <Text style={styles.termsLink}>Política de Privacidade</Text> da AjuLabs.
        </Text>
      </TouchableOpacity>
      {error ? (
        <Text style={[styles.errorGeral, { textAlign: 'left', marginTop: 4 }]}>{error}</Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  termosRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14 },
  terms: { flex: 1, fontSize: 11, color: colors.n500, lineHeight: 16 },
  termsLink: { color: colors.orange, fontWeight: '600' },
  errorGeral: {
    fontSize: 13,
    color: '#E24B4A',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
});
