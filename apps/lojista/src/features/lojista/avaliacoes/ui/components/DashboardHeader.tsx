import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type DashboardAvaliacoes } from '@ajulabs/types';
import { StarRow } from './StarRow';
import type { TagCatalog } from '../../lib/types';

export function DashboardHeader({
  data,
  accentColor,
  tagCatalog,
}: {
  data: DashboardAvaliacoes;
  accentColor: string;
  tagCatalog: TagCatalog;
}) {
  void tagCatalog;
  const maxBar = Math.max(...Object.values(data.distribuicao));
  return (
    <View style={s.headerCard}>
      <View style={s.headerCardTop}>
        <View style={{ alignItems: 'center' }}>
          <Text style={[s.mediaNum, { color: accentColor }]}>{data.media.toFixed(1)}</Text>
          <StarRow nota={Math.round(data.media)} size={18} />
          <Text style={s.totalText}>
            {data.total} avaliaç{data.total === 1 ? 'ão' : 'ões'}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          {(['5', '4', '3', '2', '1'] as const).map((nota) => {
            const count = data.distribuicao[nota];
            const pct = maxBar > 0 ? (count / maxBar) * 100 : 0;
            return (
              <View key={nota} style={s.barRow}>
                <Text style={s.barNota}>{nota}</Text>
                <Ionicons name="star" size={11} color="#F59E0B" />
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${pct}%`, backgroundColor: accentColor }]} />
                </View>
                <Text style={s.barCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    marginBottom: 16,
  },
  headerCardTop: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  mediaNum: { fontSize: 40, fontWeight: '800', lineHeight: 44 },
  totalText: { fontSize: 11, color: '#9099B3', marginTop: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barNota: { fontSize: 11, color: '#9099B3', width: 10, textAlign: 'right' },
  barTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F0F1F5',
    overflow: 'hidden',
  },
  barFill: { height: 7, borderRadius: 4 },
  barCount: { fontSize: 10, color: '#9099B3', width: 22, textAlign: 'right' },
});
