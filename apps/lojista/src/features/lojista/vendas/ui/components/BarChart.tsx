import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../../../theme';
import { WEEKDAYS } from '../../lib/constants';

export function BarChart({ bars }: { bars: number[] }) {
  const max = Math.max(...bars, 1);
  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.barsRow}>
        {bars.map((val, i) => {
          const isToday = i === bars.length - 1;
          const heightPct = val > 0 ? (val / max) * 100 : 2;
          return (
            <View key={i} style={chartStyles.barCol}>
              <View style={chartStyles.barWrapper}>
                <View
                  style={[
                    chartStyles.bar,
                    {
                      height: `${heightPct}%`,
                      backgroundColor: isToday ? colors.orange : colors.orange100,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  chartStyles.barLabel,
                  isToday && { color: colors.orange600, fontWeight: '700' },
                ]}
              >
                {WEEKDAYS[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { height: 130 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', height: '100%', gap: 4 },
  barCol: { flex: 1, alignItems: 'center', height: '100%' },
  barWrapper: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 10, color: '#6B7390', fontWeight: '500', marginTop: 4 },
});
