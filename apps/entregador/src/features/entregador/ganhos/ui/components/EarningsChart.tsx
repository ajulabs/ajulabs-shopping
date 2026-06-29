import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { brl } from '../../../../../shared/lib/format';
import { useMemo } from 'react';
import { useTheme } from '../../../../../shared/hooks';
import type { Theme } from '../../../../../shared/hooks/useTheme';

interface EarningsChartProps {
  SALES_7D: number[];
  weekLabels: string[];
  max: number;
  totalSemana: number;
  selectedDay: number;
  setSelectedDay: (i: number) => void;
  selectedLabel: string;
  selectedDate: string | null;
  selectedCorridas: number;
  selectedValue: number;
}

export function EarningsChart({
  SALES_7D,
  weekLabels,
  max,
  totalSemana,
  selectedDay,
  setSelectedDay,
  selectedLabel,
  selectedDate,
  selectedCorridas,
  selectedValue,
}: EarningsChartProps) {
  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>Últimos 7 dias</Text>
        <Text style={s.chartTotal}>{brl(totalSemana)}</Text>
      </View>
      <View style={s.chart}>
        {SALES_7D.map((v, i) => {
          const h = max > 0 ? (v / max) * 100 : 2;
          const isToday = i === SALES_7D.length - 1;
          const isSel = i === selectedDay;
          const barColor = isSel ? '#F2760F' : isToday ? 'rgba(242,118,15,0.25)' : '#E4E7F1';
          return (
            <TouchableOpacity
              key={i}
              style={s.chartCol}
              onPress={() => setSelectedDay(i)}
              activeOpacity={0.7}
            >
              <Text style={[s.chartBarVal, { color: isSel ? '#F2760F' : '#9099B3' }]}>
                {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}
              </Text>
              <View style={s.chartBarTrack}>
                <View style={[s.chartBar, { height: `${h}%` as any, backgroundColor: barColor }]} />
              </View>
              <Text
                style={[
                  s.chartDay,
                  {
                    color: isSel ? '#F2760F' : isToday ? 'rgba(242,118,15,0.6)' : '#9099B3',
                    fontWeight: isSel ? '700' : '500',
                  },
                ]}
              >
                {weekLabels[i]}
              </Text>
              {isSel && <View style={s.chartSelDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Detalhe do dia selecionado */}
      <View style={s.dayDetail}>
        <View style={{ flex: 1 }}>
          <Text style={s.dayDetailLabel}>
            {selectedLabel}
            {selectedDate ? ` · ${selectedDate}` : ''}
          </Text>
          <Text style={s.dayDetailSub}>
            {selectedCorridas > 0
              ? `${selectedCorridas} corrida${selectedCorridas !== 1 ? 's' : ''}`
              : 'Sem corridas'}
          </Text>
        </View>
        <Text style={[s.dayDetailAmount, { color: selectedValue > 0 ? '#000933' : '#9099B3' }]}>
          {brl(selectedValue)}
        </Text>
      </View>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 16,
      backgroundColor: theme.surf,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 16,
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
    chartTotal: { fontSize: 16, fontWeight: '700', color: '#F2760F' },
    chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 130 },
    chartCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
    chartBarVal: { fontSize: 10, color: theme.textMut, fontWeight: '600', marginBottom: 4 },
    chartBarTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
    chartBar: { width: '100%', borderRadius: 6, minHeight: 4 },
    chartDay: { fontSize: 10, marginTop: 6 },
    chartSelDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#F2760F', marginTop: 3 },
    dayDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    dayDetailLabel: { fontSize: 13, fontWeight: '700', color: theme.text },
    dayDetailSub: { fontSize: 11, color: theme.textMut, marginTop: 2 },
    dayDetailAmount: { fontSize: 18, fontWeight: '800' },
  });
}
