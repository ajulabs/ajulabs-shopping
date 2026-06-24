import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { InsightSeveridade } from '@ajulabs/types';
import { colors } from '../../../../../theme';
import { useInsights } from '../../model/useInsights';

const COR_SEVERIDADE: Record<InsightSeveridade, string> = {
  critico: '#FF5A5A',
  atencao: '#FFA05C',
  positivo: colors.mint,
  info: 'rgba(255,255,255,0.45)',
};

export function InsightCard() {
  const { insights, loading } = useInsights();

  return (
    <View style={styles.insightCard}>
      <View style={styles.insightBadge}>
        <Text style={styles.insightBadgeText}>Insight IA</Text>
      </View>
      <Text style={styles.insightTitle}>Análise da sua loja</Text>
      <Text style={styles.insightSub}>Baseado nos seus dados dos últimos 30 dias</Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#FFA05C" />
        </View>
      ) : (
        insights.map((item, i) => (
          <View
            key={item.id}
            style={[
              styles.insightItem,
              i > 0 && { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: COR_SEVERIDADE[item.severidade] }]} />
            <View style={styles.insightInfo}>
              <Text style={styles.insightName}>{item.titulo}</Text>
              <Text style={styles.insightDetail}>{item.detalhe}</Text>
            </View>
            {item.valor ? (
              <Text style={[styles.valor, { color: COR_SEVERIDADE[item.severidade] }]}>
                {item.valor}
              </Text>
            ) : null}
          </View>
        ))
      )}
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
  loadingBox: { paddingVertical: 24, alignItems: 'center' },
  insightItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  insightInfo: { flex: 1 },
  insightName: { fontSize: 13, fontWeight: '700', color: '#fff' },
  insightDetail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    lineHeight: 17,
  },
  valor: { fontSize: 13, fontWeight: '700', flexShrink: 0, marginLeft: 4 },
});
