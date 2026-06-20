import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../../theme';
import { useVendas } from '../model/useVendas';
import { PERIODS } from '../lib/constants';
import { BarChart, MetricCard, InsightCard } from './components';

interface VendasDashboardProps {
  dark?: boolean;
  nomeLoja?: string;
}

export function VendasDashboard({ dark = false }: VendasDashboardProps) {
  const insets = useSafeAreaInsets();
  const {
    lojaNome,
    period,
    setPeriod,
    loading,
    periodLabel,
    valor,
    pedidos,
    ticket,
    topProduto,
    bars,
  } = useVendas();

  const textColor = dark ? colors.n0 : colors.navy;
  const subColor = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const bgMain = dark ? '#0B0F22' : colors.n50;
  const surface = dark ? '#111638' : colors.n0;
  const border = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  return (
    <View style={[styles.container, { backgroundColor: bgMain }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: surface, borderBottomColor: border, paddingTop: insets.top + 12 },
        ]}
      >
        <Text style={[styles.headerTitle, { color: textColor }]}>Dashboard</Text>
        <Text style={[styles.headerSub, { color: subColor }]}>{lojaNome ?? 'Minha Loja'}</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={[styles.periodTabs, { backgroundColor: surface, borderColor: border }]}>
            {PERIODS.map((p) => (
              <Pressable
                key={p.key}
                onPress={() => setPeriod(p.key)}
                style={[styles.periodTab, period === p.key && { backgroundColor: colors.navy }]}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    period === p.key ? { color: '#fff' } : { color: subColor },
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroDeco}>
              <Text style={styles.heroDecoText}>$</Text>
            </View>
            <Text style={styles.heroLabel}>{periodLabel}</Text>
            <Text style={styles.heroValue}>{valor}</Text>
          </View>

          <View style={styles.metricsGrid}>
            <MetricCard label="PEDIDOS" value={pedidos} trend="" dark={dark} />
            <MetricCard label="TICKET MÉDIO" value={ticket} trend="" dark={dark} />
          </View>

          {topProduto !== '–' && (
            <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
              <Text style={[styles.cardLabel, { color: subColor }]}>PRODUTO MAIS VENDIDO</Text>
              <Text style={[styles.cardValue, { color: textColor }]}>{topProduto}</Text>
            </View>
          )}

          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartTitle, { color: textColor }]}>Vendas · últimos 7 dias</Text>
              <Text style={[styles.chartUnit, { color: subColor }]}>R$</Text>
            </View>
            <BarChart bars={bars} />
          </View>

          <InsightCard />

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontWeight: '700', fontSize: 20, letterSpacing: -0.4 },
  headerSub: { fontSize: 12, marginTop: 2 },
  content: { padding: 14, gap: 12 },
  periodTabs: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, gap: 4 },
  periodTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  periodTabText: { fontSize: 13, fontWeight: '600' },
  heroCard: {
    backgroundColor: colors.orange,
    borderRadius: 16,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  heroDeco: { position: 'absolute', right: -10, top: '50%', marginTop: -40 },
  heroDecoText: { fontSize: 80, color: 'rgba(255,255,255,0.1)', fontWeight: '700' },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
  heroValue: { fontSize: 36, fontWeight: '700', color: '#fff', letterSpacing: -1, marginTop: 4 },
  metricsGrid: { flexDirection: 'row', gap: 10 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  cardValue: { fontSize: 17, fontWeight: '700' },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  chartTitle: { fontSize: 15, fontWeight: '600' },
  chartUnit: { fontSize: 11 },
});
