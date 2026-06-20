import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../../../theme';
import { INSIGHTS } from '../../lib/constants';

export function InsightCard() {
  return (
    <View style={styles.insightCard}>
      <View style={styles.insightBadge}>
        <Text style={styles.insightBadgeText}>Insight IA</Text>
      </View>
      <Text style={styles.insightTitle}>O que seus clientes buscam que você não tem</Text>
      <Text style={styles.insightSub}>
        Demanda reprimida nas últimas 4 semanas · Centro de Aracaju
      </Text>
      {INSIGHTS.map((item, i) => (
        <View
          key={item.rank}
          style={[
            styles.insightItem,
            i > 0 && { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
          ]}
        >
          <View style={styles.insightNum}>
            <Text style={styles.insightNumText}>{item.rank}</Text>
          </View>
          <View style={styles.insightInfo}>
            <Text style={styles.insightName}>{item.nome}</Text>
            <Text style={styles.insightDetail}>
              {item.buscas} buscas · <Text style={{ color: colors.mint }}>{item.pct}</Text>
            </Text>
          </View>
          <Text style={styles.insightChevron}>›</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  insightCard: { backgroundColor: colors.navy, borderRadius: 16, padding: 16 },
  insightBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(242,118,15,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    marginBottom: 10,
  },
  insightBadgeText: { color: '#FFA05C', fontSize: 11, fontWeight: '600' },
  insightTitle: { fontSize: 16, fontWeight: '700', color: '#fff', lineHeight: 22 },
  insightSub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4, marginBottom: 4 },
  insightItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  insightNum: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: 'rgba(242,118,15,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  insightNumText: { color: '#FFA05C', fontSize: 12, fontWeight: '700' },
  insightInfo: { flex: 1 },
  insightName: { fontSize: 13, fontWeight: '600', color: '#fff' },
  insightDetail: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  insightChevron: { fontSize: 18, color: 'rgba(255,255,255,0.3)' },
});
