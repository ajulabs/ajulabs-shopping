import { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NivelEstoque, Produto } from '@ajulabs/types';
import { usePermissions } from '../../../../shared/hooks/usePermissions';
import { TIPO_LABEL } from '../../../../entities/produto';
import { C, NIVEL_CFG, useDashboardC, type DashboardC } from '../lib/dashboardTheme';
import { useEstoqueDashboard } from '../model/useEstoqueDashboard';
import { useTheme } from '../../../../shared/hooks';
import { DonutChart } from './components/DonutChart';
import { EstoqueStatsGrid, StatCard } from './components/EstoqueStatsGrid';
import { ProdutoRow } from './components/ProdutoRow';
import { AjusteRapidoPicker } from './components/AjusteRapidoPicker';
import { AjusteRapidoModal } from './AjusteRapidoModal';

interface Props {
  onVoltar?: () => void;
  onVerMovimentacoes: () => void;
  onVerNivel: (nivel: NivelEstoque) => void;
  onAdicionarProduto: () => void;
  onEditarProduto: (p: Produto) => void;
  onDeleteProduto: (p: Produto) => void;
  skipTopInset?: boolean;
}

export function EstoqueDashboard({
  onVoltar,
  onVerMovimentacoes,
  onVerNivel,
  onAdicionarProduto,
  onEditarProduto,
  onDeleteProduto,
  skipTopInset = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const c = useDashboardC();
  const s = useMemo(() => makeStyles(c), [c]);
  const { canViewStockValue } = usePermissions();
  const {
    lojaId,
    token,
    dashboard,
    produtos,
    loading,
    refreshing,
    ajusteTarget,
    setAjusteTarget,
    showPicker,
    setShowPicker,
    imgErrors,
    markImgError,
    onRefresh,
    onAjusteSaved,
  } = useEstoqueDashboard();

  const d = dashboard;
  const totalProd = d?.totalProdutos ?? 0;
  const nZerado = d?.produtosSemEstoque ?? 0;
  const nCritico = d?.produtosBaixoEstoque ?? 0;
  const nAtencao = d?.produtosAtencao ?? 0;
  const nSaudavel = Math.max(0, totalProd - nZerado - nCritico - nAtencao);
  const alertas = d?.alertas ?? [];

  const gridCards: StatCard[] = [
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
    <View style={[s.root, { backgroundColor: theme.bg }]}>
      <View
        style={[
          s.header,
          {
            backgroundColor: theme.surf,
            borderBottomColor: theme.border,
            paddingTop: (skipTopInset ? 0 : insets.top) + 12,
          },
        ]}
      >
        {onVoltar ? (
          <TouchableOpacity style={s.iconBtn} onPress={onVoltar} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={c.text} />
          </TouchableOpacity>
        ) : null}
        <Text style={[s.headerTitle, !onVoltar && s.headerTitleMain, { color: theme.text }]}>
          Produtos
        </Text>
        <TouchableOpacity style={s.histBtn} onPress={onVerMovimentacoes} activeOpacity={0.7}>
          <Ionicons name="time-outline" size={15} color={C.orange} />
          <Text style={s.histBtnText}>Histórico</Text>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.orange} />
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

          <EstoqueStatsGrid cards={gridCards} />

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
                    <Ionicons name="chevron-forward" size={14} color={c.mute} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={s.section}>
            <View style={s.sectionHead}>
              <View>
                <Text style={s.sectionTitle}>Produtos</Text>
                <Text style={s.sectionSub}>{produtos.length} cadastrados</Text>
              </View>
              <TouchableOpacity
                style={s.adjustBtn}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="swap-vertical-outline" size={15} color={C.orange} />
                <Text style={s.adjustBtnText}>Ajustar estoque</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.addBtn} onPress={onAdicionarProduto} activeOpacity={0.85}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.addBtnText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
            {produtos.length === 0 ? (
              <View style={s.emptyCard}>
                <Ionicons name="bag-outline" size={28} color={c.mute} />
                <Text style={s.emptyText}>Nenhum produto cadastrado</Text>
              </View>
            ) : (
              produtos.map((produto) => (
                <ProdutoRow
                  key={produto.id}
                  produto={produto}
                  hasImgError={!!imgErrors[produto.id]}
                  onImgError={() => markImgError(produto.id)}
                  onAjuste={() => setAjusteTarget(produto)}
                  onEditar={() => onEditarProduto(produto)}
                  onDelete={() => onDeleteProduto(produto)}
                />
              ))
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
                      <Text style={s.movTipo} numberOfLines={1}>
                        {TIPO_LABEL[m.tipo] ?? m.tipo}
                        {m.variacaoNome ? ` · ${m.variacaoNome}` : ''}
                      </Text>
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

      {/* Seletor de produto para ajuste de estoque */}
      <AjusteRapidoPicker
        visible={showPicker}
        produtos={produtos}
        onClose={() => setShowPicker(false)}
        onSelect={(p) => {
          setShowPicker(false);
          setAjusteTarget(p);
        }}
      />

      {ajusteTarget && lojaId && token && (
        <AjusteRapidoModal
          visible
          produto={ajusteTarget}
          lojaId={lojaId}
          token={token}
          onClose={() => setAjusteTarget(null)}
          onSaved={onAjusteSaved}
        />
      )}
    </View>
  );
}

function makeStyles(c: DashboardC) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 14,
      backgroundColor: c.card,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.bg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    histBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: C.orange + '15',
      borderWidth: 1,
      borderColor: C.orange + '40',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
    },
    histBtnText: { fontSize: 13, fontWeight: '700', color: C.orange },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: c.text },
    headerTitleMain: { fontSize: 26, letterSpacing: -0.5 },

    scroll: { paddingBottom: 56 },

    donutCard: {
      backgroundColor: c.card,
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
      borderColor: c.border,
    },
    donutWrap: { marginBottom: 20 },
    donutLegend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: { fontSize: 12, color: c.sub, fontWeight: '500' },
    legendPct: { fontSize: 12, fontWeight: '800' },

    section: { paddingHorizontal: 16, marginTop: 24 },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
      justifyContent: 'space-between',
    },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: c.text },
    sectionSub: { fontSize: 12, color: c.sub },
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
    adjustBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: C.orange + '15',
      borderWidth: 1,
      borderColor: C.orange + '40',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
    },
    adjustBtnText: { color: C.orange, fontSize: 13, fontWeight: '700' },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
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
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: c.border,
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
    alertName: { flex: 1, fontSize: 14, fontWeight: '700', color: c.text },
    alertQty: { fontSize: 13, fontWeight: '800' },
    barTrack: { height: 5, backgroundColor: c.border, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: 5, borderRadius: 3 },

    emptyCard: {
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 24,
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    emptyText: { fontSize: 13, color: c.sub },

    movRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    movIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    movInfo: { flex: 1 },
    movNome: { fontSize: 13, fontWeight: '700', color: c.text },
    movTipo: { fontSize: 11, color: c.sub, marginTop: 2 },
    movRight: { alignItems: 'flex-end', gap: 2 },
    movQty: { fontSize: 16, fontWeight: '800' },
    movData: { fontSize: 10, color: c.mute },
  });
}
