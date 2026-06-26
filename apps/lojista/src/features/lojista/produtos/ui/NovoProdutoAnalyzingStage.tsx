import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../../../theme';
import { useTheme } from '../../../../shared/hooks';

export function AnalyzingStage() {
  const theme = useTheme();
  return (
    <View style={[styles.content, styles.analyzingContainer]}>
      <View
        style={[styles.analyzingCard, { backgroundColor: theme.surf, borderColor: theme.border }]}
      >
        <ActivityIndicator size="large" color={colors.orange} />
        <Text style={[styles.analyzingTitle, { color: theme.text }]}>IA analisando sua foto…</Text>
        <Text style={[styles.analyzingDesc, { color: theme.textSec }]}>
          Identificando categoria, cor e sugestões de preço
        </Text>
        <View style={styles.analyzeSteps}>
          {[
            'Identificando produto…',
            'Gerando descrição otimizada…',
            'Sugerindo tags de busca…',
          ].map((t, i) => (
            <View key={i} style={styles.analyzeStep}>
              <View style={[styles.analyzeStepDot, { backgroundColor: colors.orange }]} />
              <Text style={[styles.analyzeStepText, { color: theme.textSec }]}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14 },
  analyzingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  analyzingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  analyzingTitle: { fontSize: 18, fontWeight: '600', color: '#000933', letterSpacing: -0.3 },
  analyzingDesc: { fontSize: 13, color: '#6B7390', textAlign: 'center' },
  analyzeSteps: { gap: 8, width: '100%', marginTop: 4 },
  analyzeStep: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  analyzeStepDot: { width: 6, height: 6, borderRadius: 3 },
  analyzeStepText: { fontSize: 13, color: '#6B7390' },
});
