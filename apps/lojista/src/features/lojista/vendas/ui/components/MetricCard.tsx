import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../../../theme';

export function MetricCard({
  label,
  value,
  trend,
  dark,
}: {
  label: string;
  value: string;
  trend: string;
  dark: boolean;
}) {
  const textColor = dark ? colors.n0 : colors.navy;
  const subColor = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const surface = dark ? '#111638' : colors.n0;
  const border = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  return (
    <View style={[styles.metricCard, { backgroundColor: surface, borderColor: border }]}>
      <Text style={styles.metricTrend}>{trend}</Text>
      <Text style={[styles.metricLabel, { color: subColor }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metricCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14 },
  metricTrend: { fontSize: 11, fontWeight: '600', color: '#046C2E', marginBottom: 6 },
  metricLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  metricValue: { fontSize: 22, fontWeight: '700', marginTop: 2 },
});
