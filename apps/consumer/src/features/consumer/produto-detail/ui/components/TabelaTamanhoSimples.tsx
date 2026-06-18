import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@ajulabs/theme';

// Fallback de tamanhos sem variações reais — seleção controlada pelo pai
export function TabelaTamanhoSimples({
  opcoes,
  selecionado,
  onSelecionar,
  isDark,
  text,
  borderL,
}: {
  opcoes: string[];
  selecionado: string | null;
  onSelecionar: (op: string | null) => void;
  isDark: boolean;
  text: string;
  borderL: string;
}) {
  return (
    <View>
      <Text style={[styles.tamanhoLabel, { color: text }]}>Tamanho:</Text>
      <View style={styles.tamanhoRow}>
        {opcoes.map((op) => {
          const ativo = selecionado === op;
          return (
            <TouchableOpacity
              key={op}
              style={[
                styles.tamanhoBadge,
                {
                  backgroundColor: ativo
                    ? colors.navy
                    : isDark
                      ? 'rgba(255,255,255,0.06)'
                      : colors.n0,
                  borderColor: ativo ? colors.navy : borderL,
                },
              ]}
              onPress={() => onSelecionar(ativo ? null : op)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tamanhoTxt, { color: ativo ? colors.n0 : text }]}>{op}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tamanhoLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  tamanhoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tamanhoBadge: {
    minWidth: 44,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  tamanhoTxt: { fontSize: 13, fontWeight: '700' },
});
