import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../../theme';
import { useTheme } from '../../../../shared/hooks';

const STEPS = ['Foto', 'IA analisa', 'Revisar', 'Publicar'];

export function Stepper({ current }: { current: number }) {
  const theme = useTheme();
  return (
    <View style={styles.stepperRow}>
      {STEPS.map((label, i) => {
        const isDone = i < current;
        const isActive = i === current;
        const isPending = i > current;
        return (
          <View key={label} style={styles.stepItem}>
            <View style={styles.stepTop}>
              {i > 0 && (
                <View
                  style={[
                    styles.stepLine,
                    { backgroundColor: isDone || isActive ? colors.orange : theme.border },
                  ]}
                />
              )}
              <View
                style={[
                  styles.stepCircle,
                  isActive && { backgroundColor: colors.orange },
                  isDone && { backgroundColor: colors.orange },
                  isPending && { backgroundColor: theme.surf2 },
                ]}
              >
                <Text
                  style={[
                    styles.stepNum,
                    (isActive || isDone) && { color: '#fff' },
                    isPending && { color: theme.textMut },
                  ]}
                >
                  {isDone ? '✓' : String(i + 1)}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    { backgroundColor: isDone ? colors.orange : theme.border },
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                isActive || isDone ? { color: theme.text } : { color: theme.textMut },
                isActive && { fontWeight: '600' },
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stepperRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepItem: { flex: 1, alignItems: 'center' },
  stepTop: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  stepLine: { flex: 1, height: 2 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNum: { fontSize: 12, fontWeight: '700' },
  stepLabel: { fontSize: 10, marginTop: 4, textAlign: 'center', fontWeight: '500' },
});
