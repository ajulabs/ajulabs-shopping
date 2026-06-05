import { useState, useCallback, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EstoqueService } from '@ajulabs/api-client';
import { MovimentacaoEstoque, TipoMovimentacao } from '@ajulabs/types';
import { useAuthLojistaStore } from '../../auth/model/store';

const C = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  sub: '#64748B',
  mute: '#94A3B8',
  orange: '#F2760F',
  green: '#10B981',
  red: '#F43F5E',
  amber: '#F59E0B',
};

const TIPO_META: Record<string, { label: string; icon: string; positive: boolean; color: string }> =
  {
    entrada_manual: {
      label: 'Entrada manual',
      icon: 'arrow-down-circle',
      positive: true,
      color: C.green,
    },
    devolucao: { label: 'Devolução', icon: 'return-up-back', positive: true, color: C.green },
    cancelamento: { label: 'Cancelamento', icon: 'refresh-circle', positive: true, color: C.green },
    liberacao_reserva: { label: 'Lib. reserva', icon: 'lock-open', positive: true, color: C.green },
    venda: { label: 'Venda', icon: 'cart', positive: false, color: C.red },
    saida_manual: { label: 'Saída manual', icon: 'arrow-up-circle', positive: false, color: C.red },
    ajuste_inventario: {
      label: 'Ajuste inventário',
      icon: 'calculator',
      positive: false,
      color: C.amber,
    },
    reserva: { label: 'Reserva', icon: 'lock-closed', positive: false, color: C.amber },
  };

const FILTROS: { label: string; value: TipoMovimentacao | '' }[] = [
  { label: 'Todos', value: '' },
  { label: 'Entradas', value: 'entrada_manual' },
  { label: 'Saídas', value: 'saida_manual' },
  { label: 'Inventário', value: 'ajuste_inventario' },
  { label: 'Devoluções', value: 'devolucao' },
];

interface Props {
  onVoltar: () => void;
}

export function MovimentacoesScreen({ onVoltar }: Props) {
  const insets = useSafeAreaInsets();
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const token = useAuthLojistaStore((s) => s.token);

  const [items, setItems] = useState<MovimentacaoEstoque[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState<TipoMovimentacao | ''>('');

  const carregar = useCallback(
    async (p = 1, tipo = filtro, silent = false) => {
      if (!lojaId || !token) return;
      if (!silent) {
        p === 1 ? setLoading(true) : setLoadingMore(true);
      }
      try {
        const res = await EstoqueService.getMovimentacoes(lojaId, token, {
          tipo: tipo || undefined,
          page: p,
          limit: 30,
        });
        setTotal(res.total);
        setItems((prev) => (p === 1 ? res.items : [...prev, ...res.items]));
        setPage(p);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [lojaId, token, filtro],
  );

  useEffect(() => {
    carregar(1);
  }, [carregar]);

  function changeFiltro(t: TipoMovimentacao | '') {
    setFiltro(t);
    setItems([]);
    setPage(1);
    carregar(1, t);
  }

  function getLabel(iso: string) {
    const dt = new Date(iso);
    const diffDays = Math.floor((Date.now() - dt.getTime()) / 86_400_000);
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    return dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' });
  }

  type Row = { type: 'sep'; date: string } | { type: 'mov'; data: MovimentacaoEstoque };

  const rows: Row[] = [];
  let lastKey = '';
  for (const m of items) {
    const key = new Date(m.criadoEm).toDateString();
    if (key !== lastKey) {
      rows.push({ type: 'sep', date: getLabel(m.criadoEm) });
      lastKey = key;
    }
    rows.push({ type: 'mov', data: m });
  }

  function renderRow({ item }: { item: Row }) {
    if (item.type === 'sep') {
      return (
        <View style={s.sep}>
          <View style={s.sepLine} />
          <Text style={s.sepText}>{item.date}</Text>
          <View style={s.sepLine} />
        </View>
      );
    }

    const m = item.data;
    const meta = TIPO_META[m.tipo] ?? {
      label: m.tipo,
      icon: 'ellipse',
      positive: true,
      color: C.sub,
    };
    const hora = new Date(m.criadoEm).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={s.card}>
        <View style={[s.cardIcon, { backgroundColor: meta.color + '15' }]}>
          <Ionicons name={meta.icon as any} size={18} color={meta.color} />
        </View>

        <View style={s.cardBody}>
          <Text style={s.cardNome} numberOfLines={1}>
            {m.produto?.nome ?? '—'}
          </Text>
          <View style={s.cardTipoRow}>
            <Text style={s.cardTipo}>{meta.label}</Text>
            {m.variacaoNome ? (
              <View style={s.varTag}>
                <Text style={s.varTagText} numberOfLines={1}>
                  {m.variacaoNome}
                </Text>
              </View>
            ) : null}
          </View>
          {m.motivo ? (
            <Text style={s.cardMotivo} numberOfLines={1}>
              "{m.motivo}"
            </Text>
          ) : null}
        </View>

        <View style={s.cardRight}>
          <Text style={[s.cardQty, { color: meta.color }]}>
            {meta.positive ? '+' : '−'}
            {m.quantidade}
          </Text>
          <View style={s.cardStockRow}>
            <Ionicons name="cube-outline" size={10} color={C.mute} />
            <Text style={s.cardStock}>{m.estoqueDepois}</Text>
          </View>
          <Text style={s.cardHora}>{hora}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={s.backBtn} onPress={onVoltar} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={C.sub} />
        </TouchableOpacity>
        <View style={s.headerMid}>
          <Text style={s.headerTitle}>Movimentações</Text>
          {total > 0 && <Text style={s.headerSub}>{total} registros</Text>}
        </View>
      </View>

      {/* Filtros */}
      <View style={s.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
        >
          {FILTROS.map((f) => {
            const active = filtro === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                style={[s.chip, active && s.chipActive]}
                onPress={() => changeFiltro(f.value)}
                activeOpacity={0.7}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.orange} />
        </View>
      ) : items.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Ionicons name="swap-vertical-outline" size={30} color={C.mute} />
          </View>
          <Text style={s.emptyTitle}>Nenhuma movimentação</Text>
          <Text style={s.emptySub}>Tente outro filtro.</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r, i) => (r.type === 'sep' ? `sep-${i}` : r.data.id)}
          renderItem={renderRow}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                carregar(1, filtro, true);
              }}
              tintColor={C.orange}
            />
          }
          onEndReached={() => {
            if (!loadingMore && items.length < total) carregar(page + 1);
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={C.orange} style={{ marginVertical: 24 }} />
            ) : null
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMid: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  headerSub: { fontSize: 12, color: C.mute, marginTop: 1 },

  /* Filtros */
  filterWrap: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  chipActive: { borderColor: C.orange, backgroundColor: C.orange + '15' },
  chipText: { fontSize: 13, fontWeight: '600', color: C.sub },
  chipTextActive: { color: C.orange },

  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 56 },

  /* Separador de data */
  sep: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  sepLine: { flex: 1, height: 1, backgroundColor: C.border },
  sepText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  /* Card de movimentação */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 2 },
  cardNome: { fontSize: 14, fontWeight: '700', color: C.text },
  cardTipoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardTipo: { fontSize: 12, color: C.sub },
  varTag: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  varTagText: { fontSize: 10, fontWeight: '700', color: C.sub, maxWidth: 160 },
  cardMotivo: { fontSize: 11, color: C.mute, fontStyle: 'italic' },
  cardRight: { alignItems: 'flex-end', gap: 3 },
  cardQty: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  cardStockRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardStock: { fontSize: 11, color: C.mute, fontWeight: '600' },
  cardHora: { fontSize: 10, color: C.mute },

  /* Empty */
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  emptySub: { fontSize: 13, color: C.sub },
});
