import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../../theme';
import { LojistaService } from '@ajulabs/api-client';
import { useAuthLojistaStore } from '../../auth/model/store';

type Period = 'dia' | 'mes';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const INSIGHTS = [
  { rank: 1, nome: 'Chinelo slide masculino', buscas: 142, pct: '+38%' },
  { rank: 2, nome: 'Tênis branco infantil', buscas: 87, pct: '+22%' },
  { rank: 3, nome: 'Bota coturno feminina', buscas: 64, pct: '+18%' },
];

function BarChart({ bars }: { bars: number[] }) {
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

function MetricCard({
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

interface VendasDashboardProps {
  dark?: boolean;
  nomeLoja?: string;
}

export function VendasDashboard({ dark = false }: VendasDashboardProps) {
  const insets = useSafeAreaInsets();
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const lojaNome = useAuthLojistaStore((s) => s.lojaNome);

  const [period, setPeriod] = useState<Period>('dia');
  const [dashboard, setDashboard] = useState<{ hoje: any; mes: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lojaId || !token) {
      setLoading(false);
      return;
    }
    LojistaService.buscarDashboard(lojaId, token)
      .then((data) => setDashboard(data))
      .finally(() => setLoading(false));
  }, [lojaId, token]);

  const brl = (v: number) =>
    `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const raw = period === 'dia' ? dashboard?.hoje : dashboard?.mes;
  const periodLabel = period === 'dia' ? 'VENDAS · HOJE' : 'VENDAS · MÊS';
  const valor = raw ? brl(Number(raw.receita ?? 0)) : 'R$ –';
  const pedidos = raw ? String(raw.pedidos ?? 0) : '–';
  const ticket = raw ? brl(Number(raw.ticketMedio ?? 0)) : 'R$ –';
  const topProduto = dashboard?.mes?.topProdutos?.[0]?.nome ?? '–';
  const bars: number[] = [0, 0, 0, 0, 0, 0, Number(dashboard?.hoje?.receita ?? 0)];

  const textColor = dark ? colors.n0 : colors.navy;
  const subColor = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const bgMain = dark ? '#0B0F22' : colors.n50;
  const surface = dark ? '#111638' : colors.n0;
  const border = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'dia', label: 'Hoje' },
    { key: 'mes', label: 'Mês' },
  ];

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

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
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
  metricCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14 },
  metricTrend: { fontSize: 11, fontWeight: '600', color: '#046C2E', marginBottom: 6 },
  metricLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  metricValue: { fontSize: 22, fontWeight: '700', marginTop: 2 },
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
