import { useMemo } from 'react';
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
import { MovimentacaoEstoque, TipoMovimentacao } from '@ajulabs/types';
import { C, FILTROS, useMovimentacoesC, type MovimentacoesC } from '../lib/movimentacoesTheme';
import { useMovimentacoes } from '../model/useMovimentacoes';
import { MovimentacaoCard } from './components/MovimentacaoCard';

interface Props {
  onVoltar: () => void;
}

function getLabel(iso: string) {
  const dt = new Date(iso);
  const diffDays = Math.floor((Date.now() - dt.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' });
}

type Row = { type: 'sep'; date: string } | { type: 'mov'; data: MovimentacaoEstoque };

export function MovimentacoesScreen({ onVoltar }: Props) {
  const c = useMovimentacoesC();
  const s = useMemo(() => makeStyles(c), [c]);
  const insets = useSafeAreaInsets();
  const {
    items,
    total,
    loading,
    loadingMore,
    refreshing,
    filtro,
    changeFiltro,
    onRefresh,
    onEndReached,
  } = useMovimentacoes();

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
    return <MovimentacaoCard m={item.data} />;
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={s.backBtn} onPress={onVoltar} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={c.sub} />
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
            <Ionicons name="swap-vertical-outline" size={30} color={c.mute} />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.orange} />
          }
          onEndReached={onEndReached}
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

function makeStyles(c: MovimentacoesC) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    /* Header */
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 16,
      paddingBottom: 16,
      backgroundColor: c.card,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.bg,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerMid: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: c.text },
    headerSub: { fontSize: 12, color: c.mute, marginTop: 1 },

    /* Filtros */
    filterWrap: { backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border },
    filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    chipActive: { borderColor: C.orange, backgroundColor: C.orange + '15' },
    chipText: { fontSize: 13, fontWeight: '600', color: c.sub },
    chipTextActive: { color: C.orange },

    list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 56 },

    /* Separador de data */
    sep: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
    sepLine: { flex: 1, height: 1, backgroundColor: c.border },
    sepText: {
      fontSize: 10,
      fontWeight: '700',
      color: c.mute,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },

    /* Empty */
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 18,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: c.text },
    emptySub: { fontSize: 13, color: c.sub },
  });
}
