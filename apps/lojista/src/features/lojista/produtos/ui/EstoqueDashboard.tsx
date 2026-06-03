import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { EstoqueService, LojistaService } from '@ajulabs/api-client';
import { EstoqueDashboard as TDashboard, NivelEstoque, Produto } from '@ajulabs/types';
import { colors } from '../../../../theme';
import { useAuthLojistaStore } from '../../auth/model/store';
import { usePermissions } from '../../rbac/hooks/usePermissions';
import { AjusteRapidoModal } from './AjusteRapidoModal';

const C = {
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  sub: '#64748B',
  mute: '#CBD5E1',
  green: '#10B981',
  red: '#EF4444',
  amber: '#F59E0B',
  slate: '#64748B',
  orange: '#F2760F',
  navy: '#0F172A',
};

const NIVEL_CFG: Record<NivelEstoque, { color: string; label: string; icon: string }> = {
  saudavel: { color: C.green, label: 'Saudável', icon: 'checkmark-circle' },
  atencao: { color: C.amber, label: 'Atenção', icon: 'alert-circle' },
  critico: { color: C.red, label: 'Crítico', icon: 'close-circle' },
  zerado: { color: C.slate, label: 'Zerado', icon: 'remove-circle' },
};

const TIPO_LABEL: Record<string, string> = {
  venda: 'Venda',
  entrada_manual: 'Entrada',
  saida_manual: 'Saída',
  ajuste_inventario: 'Inventário',
  devolucao: 'Devolução',
  cancelamento: 'Cancelamento',
};

interface Props {
  onVoltar?: () => void;
  onVerMovimentacoes: () => void;
  onVerNivel: (nivel: NivelEstoque) => void;
  onAdicionarProduto: () => void;
  onEditarProduto: (p: Produto) => void;
  onDeleteProduto: (p: Produto) => void;
}

export function EstoqueDashboard({
  onVoltar,
  onVerMovimentacoes,
  onVerNivel,
  onAdicionarProduto,
  onEditarProduto,
  onDeleteProduto,
}: Props) {
  const insets = useSafeAreaInsets();
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const token = useAuthLojistaStore((s) => s.token);
  const { canViewStockValue } = usePermissions();

  const [dashboard, setDashboard] = useState<TDashboard | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ajusteTarget, setAjusteTarget] = useState<Produto | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const carregar = useCallback(
    async (silent = false) => {
      if (!lojaId || !token) return;
      if (!silent) setLoading(true);
      try {
        const [dash, lista] = await Promise.all([
          EstoqueService.getDashboard(lojaId, token),
          LojistaService.listarProdutos(lojaId, token),
        ]);
        setDashboard(dash);
        setProdutos(lista);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [lojaId, token],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  const d = dashboard;
  const totalProd = d?.totalProdutos ?? 0;
  const nZerado = d?.produtosSemEstoque ?? 0;
  const nCritico = d?.produtosBaixoEstoque ?? 0;
  const nAtencao = d?.produtosAtencao ?? 0;
  const nSaudavel = Math.max(0, totalProd - nZerado - nCritico - nAtencao);
  const alertas = d?.alertas ?? [];

  const gridCards = [
    {
      label: 'Saudável',
      value: String(nSaudavel),
      icon: 'checkmark-circle-outline',
      color: C.green,
      onPress: () => onVerNivel('saudavel'),
    },
    {
      label: 'Atenção',
      value: String(nAtencao),
      icon: 'alert-circle-outline',
      color: C.amber,
      onPress: () => onVerNivel('atencao'),
    },
    {
      label: 'Crítico',
      value: String(nCritico),
      icon: 'warning-outline',
      color: C.red,
      onPress: () => onVerNivel('critico'),
    },
    {
      label: 'Sem estoque',
      value: String(nZerado),
      icon: 'cube-outline',
      color: C.slate,
      onPress: () => onVerNivel('zerado'),
    },
    ...(canViewStockValue
      ? [
          {
            label: 'Em estoque',
            value: `R$ ${((d?.valorTotalEstoque ?? 0) / 1000).toFixed(0)}k`,
            icon: 'cash-outline',
            color: C.orange,
            onPress: undefined,
          },
        ]
      : []),
    {
      label: 'Histórico',
      value: 'Ver tudo',
      icon: 'time-outline',
      color: '#3B82F6',
      onPress: onVerMovimentacoes,
    },
  ];

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        {onVoltar ? (
          <TouchableOpacity style={s.iconBtn} onPress={onVoltar} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
        ) : null}
        <Text style={[s.headerTitle, !onVoltar && s.headerTitleMain]}>Produtos</Text>
        <TouchableOpacity
          style={[s.iconBtn, { backgroundColor: C.orange + '18' }]}
          onPress={onVerMovimentacoes}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={18} color={C.orange} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.orange} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                carregar(true);
              }}
              tintColor={C.orange}
            />
          }
        >
          <View style={s.donutCard}>
            <View style={s.donutWrap}>
              <DonutChart
                saudavel={nSaudavel}
                atencao={nAtencao}
                critico={nCritico}
                zerado={nZerado}
                total={totalProd}
              />
            </View>
            <View style={s.donutLegend}>
              {[
                { nivel: 'saudavel' as NivelEstoque, count: nSaudavel },
                { nivel: 'atencao' as NivelEstoque, count: nAtencao },
                { nivel: 'critico' as NivelEstoque, count: nCritico },
                { nivel: 'zerado' as NivelEstoque, count: nZerado },
              ].map(({ nivel, count }) => {
                const cfg = NIVEL_CFG[nivel];
                const pct = totalProd > 0 ? Math.round((count / totalProd) * 100) : 0;
                return (
                  <View key={nivel} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: cfg.color }]} />
                    <Text style={s.legendLabel}>{cfg.label}</Text>
                    <Text style={[s.legendPct, { color: cfg.color }]}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={s.grid}>
            {gridCards.map((card, i) => (
              <TouchableOpacity
                key={i}
                style={[s.gridCard, { backgroundColor: card.color }]}
                onPress={card.onPress}
                activeOpacity={card.onPress ? 0.82 : 1}
              >
                <View style={s.gridIconWrap}>
                  <Ionicons name={card.icon as any} size={26} color="rgba(255,255,255,0.9)" />
                </View>
                <Text style={s.gridValue}>{card.value}</Text>
                <Text style={s.gridLabel}>{card.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {alertas.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHead}>
                <View style={[s.sectionBadge, { backgroundColor: C.red + '18' }]}>
                  <Ionicons name="alert-circle" size={14} color={C.red} />
                  <Text style={[s.sectionBadgeText, { color: C.red }]}>
                    {alertas.length} em alerta
                  </Text>
                </View>
              </View>
              {(alertas as any[]).map((item, idx) => {
                const cfg = NIVEL_CFG[item.nivel as NivelEstoque];
                const minRef = Math.max(item.estoqueMinimo ?? 0, 1);
                const maxBar = Math.max(minRef * 3, item.estoque, 10);
                const pct = Math.min(100, Math.max(4, (item.estoque / maxBar) * 100));
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={s.alertItem}
                    onPress={() => setAjusteTarget(item as Produto)}
                    activeOpacity={0.78}
                  >
                    <View style={[s.alertNum, { backgroundColor: cfg.color }]}>
                      <Text style={s.alertNumText}>{idx + 1}</Text>
                    </View>
                    <View style={s.alertBody}>
                      <View style={s.alertTopRow}>
                        <Text style={s.alertName} numberOfLines={1}>
                          {item.nome}
                        </Text>
                        <Text style={[s.alertQty, { color: cfg.color }]}>{item.estoque} un.</Text>
                      </View>
                      <View style={s.barTrack}>
                        <View
                          style={[
                            s.barFill,
                            { width: `${pct}%` as any, backgroundColor: cfg.color },
                          ]}
                        />
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={C.mute} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={s.sectionTitle}>Produtos</Text>
              <Text style={s.sectionSub}>{produtos.length} cadastrados</Text>
              <TouchableOpacity style={s.addBtn} onPress={onAdicionarProduto} activeOpacity={0.85}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.addBtnText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
            {produtos.length === 0 ? (
              <View style={s.emptyCard}>
                <Ionicons name="bag-outline" size={28} color={C.mute} />
                <Text style={s.emptyText}>Nenhum produto cadastrado</Text>
              </View>
            ) : (
              produtos.map((produto) => {
                const nivel = calcNivel(produto.estoque ?? 0);
                const cfg = NIVEL_CFG[nivel];
                const hasImg = produto.imagem && !imgErrors[produto.id];
                return (
                  <View key={produto.id} style={s.prodRow}>
                    {hasImg ? (
                      <Image
                        source={{ uri: produto.imagem }}
                        style={s.prodThumb}
                        resizeMode="cover"
                        onError={() => setImgErrors((prev) => ({ ...prev, [produto.id]: true }))}
                      />
                    ) : (
                      <View style={[s.prodThumb, s.prodThumbFallback]}>
                        <Text style={s.prodThumbLetter}>
                          {produto.nome.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={s.prodInfo}>
                      <Text style={s.prodNome} numberOfLines={1}>
                        {produto.nome}
                      </Text>
                      <Text style={s.prodPreco}>
                        R$ {Number(produto.preco).toFixed(2).replace('.', ',')}
                      </Text>
                    </View>
                    <View style={s.prodRight}>
                      <TouchableOpacity
                        style={[s.stockBadge, { backgroundColor: cfg.color }]}
                        onPress={() => setAjusteTarget(produto)}
                        activeOpacity={0.8}
                      >
                        <Text style={s.stockBadgeText}>{produto.estoque ?? 0}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.prodAction}
                        onPress={() => onEditarProduto(produto)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pencil-outline" size={15} color={C.sub} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.prodAction, { backgroundColor: '#FEE2E2' }]}
                        onPress={() => onDeleteProduto(produto)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={15} color={C.red} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {(d?.movimentacoesRecentes?.length ?? 0) > 0 && (
            <View style={s.section}>
              <View style={s.sectionHead}>
                <Text style={s.sectionTitle}>Movimentações recentes</Text>
                <TouchableOpacity
                  onPress={onVerMovimentacoes}
                  style={{ marginLeft: 'auto' }}
                  activeOpacity={0.7}
                >
                  <Text style={s.sectionLink}>Ver todas →</Text>
                </TouchableOpacity>
              </View>
              {d!.movimentacoesRecentes.slice(0, 5).map((m: any) => {
                const isPos = [
                  'entrada_manual',
                  'devolucao',
                  'cancelamento',
                  'liberacao_reserva',
                ].includes(m.tipo);
                const cor = isPos ? C.green : C.red;
                const hora = new Date(m.criadoEm).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const data = new Date(m.criadoEm).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                });
                return (
                  <View key={m.id} style={s.movRow}>
                    <View style={[s.movIcon, { backgroundColor: cor + '18' }]}>
                      <Ionicons
                        name={isPos ? 'trending-up' : 'trending-down'}
                        size={16}
                        color={cor}
                      />
                    </View>
                    <View style={s.movInfo}>
                      <Text style={s.movNome} numberOfLines={1}>
                        {m.produto?.nome ?? '—'}
                      </Text>
                      <Text style={s.movTipo}>{TIPO_LABEL[m.tipo] ?? m.tipo}</Text>
                    </View>
                    <View style={s.movRight}>
                      <Text style={[s.movQty, { color: cor }]}>
                        {isPos ? '+' : '−'}
                        {m.quantidade}
                      </Text>
                      <Text style={s.movData}>
                        {data} {hora}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {ajusteTarget && lojaId && token && (
        <AjusteRapidoModal
          visible
          produto={ajusteTarget}
          lojaId={lojaId}
          token={token}
          onClose={() => setAjusteTarget(null)}
          onSaved={(atualizado) => {
            setProdutos((prev) =>
              prev.map((p) => (p.id === atualizado.id ? { ...p, ...atualizado } : p)),
            );
            setAjusteTarget(null);
            carregar(true);
          }}
        />
      )}
    </View>
  );
}

function calcNivel(estoque: number): NivelEstoque {
  if (estoque <= 0) return 'zerado';
  if (estoque < 10) return 'critico';
  if (estoque < 20) return 'atencao';
  return 'saudavel';
}

function DonutChart({
  saudavel,
  atencao,
  critico,
  zerado,
  total,
  size = 180,
  strokeWidth = 24,
}: {
  saudavel: number;
  atencao: number;
  critico: number;
  zerado: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * r;

  const segments = [
    { value: saudavel, color: C.green },
    { value: atencao, color: C.amber },
    { value: critico, color: C.red },
    { value: zerado, color: C.slate },
  ].filter((s) => s.value > 0);

  if (total === 0) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={strokeWidth} />
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ fontSize: 32, fontWeight: '800', color: C.text }}>0</Text>
          <Text style={{ fontSize: 12, color: C.sub, fontWeight: '600' }}>produtos</Text>
        </View>
      </View>
    );
  }

  let accumulated = 0;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${cx}, ${cy}`}>
          {segments.map((seg, i) => {
            const segLen = (seg.value / total) * circumference;
            const offset = circumference - accumulated;
            const gap = segments.length > 1 ? 4 : 0;
            accumulated += segLen;
            return (
              <Circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(0, segLen - gap)} ${circumference - segLen + gap}`}
                strokeDashoffset={offset}
              />
            );
          })}
        </G>
      </Svg>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 38, fontWeight: '900', color: C.text, letterSpacing: -2 }}>
          {total}
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: C.sub,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          produtos
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: C.text },
  headerTitleMain: { fontSize: 26, letterSpacing: -0.5 },

  scroll: { paddingBottom: 56 },

  donutCard: {
    backgroundColor: C.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  donutWrap: { marginBottom: 20 },
  donutLegend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12, color: C.sub, fontWeight: '500' },
  legendPct: { fontSize: 12, fontWeight: '800' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginTop: 16 },
  gridCard: {
    width: '30.5%',
    borderRadius: 18,
    padding: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  gridIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridValue: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  gridLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)', lineHeight: 14 },

  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  sectionSub: { fontSize: 12, color: C.sub },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  sectionBadgeText: { fontSize: 12, fontWeight: '700' },
  sectionLink: { fontSize: 13, fontWeight: '700', color: C.orange },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 'auto',
    backgroundColor: C.orange,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  alertNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertNumText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  alertBody: { flex: 1, gap: 8 },
  alertTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alertName: { flex: 1, fontSize: 14, fontWeight: '700', color: C.text },
  alertQty: { fontSize: 13, fontWeight: '800' },
  barTrack: { height: 5, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 3 },

  prodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  prodThumb: { width: 46, height: 46, borderRadius: 12 },
  prodThumbFallback: {
    backgroundColor: C.orange + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodThumbLetter: { fontSize: 18, fontWeight: '800', color: C.orange },
  prodInfo: { flex: 1 },
  prodNome: { fontSize: 14, fontWeight: '700', color: C.text },
  prodPreco: { fontSize: 13, color: C.orange, fontWeight: '700', marginTop: 2 },
  prodRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stockBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockBadgeText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  prodAction: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },

  emptyCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyText: { fontSize: 13, color: C.sub },

  movRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  movIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movInfo: { flex: 1 },
  movNome: { fontSize: 13, fontWeight: '700', color: C.text },
  movTipo: { fontSize: 11, color: C.sub, marginTop: 2 },
  movRight: { alignItems: 'flex-end', gap: 2 },
  movQty: { fontSize: 16, fontWeight: '800' },
  movData: { fontSize: 10, color: C.mute },
});
