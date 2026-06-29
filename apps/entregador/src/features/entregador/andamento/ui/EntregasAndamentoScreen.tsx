import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Stage, RideWithStage } from '../../../../entities/corrida';
import { useEntregasAndamento, type CancelamentoHistorico } from '../model/useEntregasAndamento';
import { EntregasFilterBar } from './components/EntregasFilterBar';

export type { RideWithStage as ActiveRideWithStage } from '../../../../entities/corrida';

import { brl } from '../../../../shared/lib/format';
import { useMemo } from 'react';
import { useTheme } from '../../../../shared/hooks';
import type { Theme } from '../../../../shared/hooks/useTheme';

const fmt = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const STAGE_LABEL: Record<Stage, string> = {
  'to-store': 'A caminho da loja',
  'at-store': 'Coletando pedido',
  'to-customer': 'A caminho do cliente',
  delivered: 'Confirmando entrega',
};

const STAGE_IDX: Record<Stage, number> = {
  'to-store': 0,
  'at-store': 1,
  'to-customer': 2,
  delivered: 3,
};

const STAGE_COLOR: Record<Stage, string> = {
  'to-store': '#000933',
  'at-store': '#B34D00',
  'to-customer': '#0369A1',
  delivered: '#046C2E',
};

const STAGE_BG: Record<Stage, string> = {
  'to-store': '#E4E7F1',
  'at-store': '#FFF0E6',
  'to-customer': '#E0F2FE',
  delivered: '#E6F7ED',
};

const MOTIVO_LABELS: Record<CancelamentoHistorico['motivo'], string> = {
  area_risco: 'Área de risco',
  pneu_furou: 'Pneu furou',
  acidente: 'Acidente',
};

interface Props {
  rides: RideWithStage[];
  onSelectRide: (ride: RideWithStage) => void;
}

export function EntregasAndamentoScreen({ rides, onSelectRide }: Props) {
  const {
    slots,
    loadingHistorico,
    filter,
    setFilter,
    counts,
    filters,
    mostrarRides,
    historicoFiltrado,
  } = useEntregasAndamento(rides);

  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.headerSub}>Suas entregas</Text>
        <Text style={s.headerTitle}>Em andamento</Text>
        <EntregasFilterBar filters={filters} filter={filter} counts={counts} onSelect={setFilter} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {mostrarRides && rides.length === 0 && filter === 'em_andamento' ? (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Ionicons name="bicycle-outline" size={40} color="#9099B3" />
            </View>
            <Text style={s.emptyTitle}>Nenhuma entrega ativa</Text>
            <Text style={s.emptySub}>
              Aceite corridas na aba{' '}
              <Text style={{ fontWeight: '700', color: '#F2760F' }}>Corridas</Text> para começar a
              entregar.
            </Text>
          </View>
        ) : null}

        {mostrarRides && rides.length > 0 && (
          <>
            {slots > 0 ? (
              <View style={s.slotBanner}>
                <Ionicons name="add-circle-outline" size={16} color="#046C2E" />
                <Text style={s.slotBannerText}>
                  Você pode aceitar mais {slots} entrega{slots > 1 ? 's' : ''} simultânea
                  {slots > 1 ? 's' : ''}.
                </Text>
              </View>
            ) : (
              <View style={[s.slotBanner, s.slotBannerFull]}>
                <Ionicons name="lock-closed-outline" size={16} color="#B34D00" />
                <Text style={[s.slotBannerText, { color: '#B34D00' }]}>
                  Limite de 2 entregas atingido. Finalize uma para aceitar outra.
                </Text>
              </View>
            )}

            {rides.map((ride) => {
              const stageIdx = STAGE_IDX[ride.stage];
              return (
                <View key={ride.id} style={s.card}>
                  <View style={s.progressBars}>
                    {[0, 1, 2, 3].map((i) => (
                      <View
                        key={i}
                        style={[s.progressBar, i <= stageIdx && { backgroundColor: '#F2760F' }]}
                      />
                    ))}
                  </View>

                  <View style={s.cardHeader}>
                    <View style={[s.stageBadge, { backgroundColor: STAGE_BG[ride.stage] }]}>
                      <Text style={[s.stageBadgeText, { color: STAGE_COLOR[ride.stage] }]}>
                        {STAGE_LABEL[ride.stage]}
                      </Text>
                    </View>
                    <Text style={s.ganho}>{brl(ride.ganho)}</Text>
                  </View>

                  <View style={s.route}>
                    <View style={s.routeRow}>
                      <View style={[s.dot, { backgroundColor: '#000933' }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.routeMain}>{ride.loja.nome}</Text>
                        <Text style={s.routeSub}>{ride.loja.bairro}</Text>
                      </View>
                    </View>
                    <View style={s.routeDash} />
                    <View style={s.routeRow}>
                      <View style={[s.dot, { backgroundColor: '#209CEF' }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.routeMain}>{ride.cliente.bairro}</Text>
                        <Text style={s.routeSub}>{ride.cliente.endereco}</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={s.continueBtn}
                    onPress={() => onSelectRide(ride)}
                    activeOpacity={0.85}
                  >
                    <Text style={s.continueBtnText}>Continuar entrega</Text>
                    <Ionicons name="arrow-forward" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {filter !== 'em_andamento' && (
          <>
            {filter === 'todos' && (rides.length > 0 || historicoFiltrado.length > 0) && (
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Histórico</Text>
              </View>
            )}

            {loadingHistorico ? (
              <ActivityIndicator size="small" color="#F2760F" style={{ marginTop: 20 }} />
            ) : historicoFiltrado.length === 0 ? (
              <Text style={s.historicoEmpty}>
                {filter === 'entregue'
                  ? 'Nenhuma entrega concluída ainda.'
                  : filter === 'cancelado'
                    ? 'Nenhuma corrida cancelada.'
                    : 'Nenhuma entrega ou cancelamento ainda.'}
              </Text>
            ) : (
              historicoFiltrado.map((item) => {
                if (item.kind === 'entrega') {
                  const e = item.data;
                  const ganho = Number(e.valorRecebido) + (e.bonus ? Number(e.bonus) : 0);
                  return (
                    <View key={`e-${e.id}`} style={s.historicoCard}>
                      <View style={s.historicoBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#046C2E" />
                        <Text style={s.historicoBadgeText}>Entregue</Text>
                      </View>
                      <View style={s.historicoBody}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.historicoLoja}>{e.pedido?.loja?.nome ?? '–'}</Text>
                          <Text style={s.historicoDest}>
                            {e.pedido?.enderecoEntrega?.bairro ?? '–'} ·{' '}
                            {e.pedido?.enderecoEntrega?.cidade ?? ''}
                          </Text>
                          <Text style={s.historicoData}>{fmt(e.criadoEm)}</Text>
                        </View>
                        <Text style={s.historicoGanho}>{brl(ganho)}</Text>
                      </View>
                    </View>
                  );
                }

                const c = item.data;
                return (
                  <View key={`c-${c.id}`} style={s.historicoCard}>
                    <View style={s.historicoBadge}>
                      <Ionicons name="close-circle" size={16} color="#9B1C1C" />
                      <Text style={[s.historicoBadgeText, { color: '#9B1C1C' }]}>Cancelado</Text>
                    </View>
                    <View style={s.historicoBody}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.historicoLoja}>{c.pedido?.loja?.nome ?? '–'}</Text>
                        <Text style={s.historicoDest}>
                          {c.pedido?.enderecoEntrega?.bairro ?? '–'} ·{' '}
                          {c.pedido?.enderecoEntrega?.cidade ?? ''}
                        </Text>
                        <Text style={s.historicoData}>{fmt(c.criadoEm)}</Text>
                      </View>
                      <View style={s.motivoChip}>
                        <Text style={s.motivoChipTxt}>{MOTIVO_LABELS[c.motivo]}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    header: {
      backgroundColor: theme.surf,
      paddingHorizontal: 16,
      paddingTop: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerSub: {
      fontSize: 11,
      color: theme.textMut,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    headerTitle: { fontSize: 24, fontWeight: '700', color: theme.text, marginTop: 2 },
    scroll: { padding: 16, paddingBottom: 32 },
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 14 },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.surf2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
    emptySub: {
      fontSize: 13,
      color: theme.textMut,
      textAlign: 'center',
      maxWidth: 260,
      lineHeight: 20,
    },
    slotBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderRadius: 12,
      backgroundColor: '#E6F7ED',
      borderWidth: 1,
      borderColor: '#046C2E',
      marginBottom: 14,
    },
    slotBannerFull: { backgroundColor: '#FFF0E6', borderColor: '#F2760F' },
    slotBannerText: { fontSize: 12.5, color: '#046C2E', fontWeight: '600', flex: 1 },
    card: {
      backgroundColor: theme.surf,
      borderRadius: 16,
      padding: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    progressBars: { flexDirection: 'row', gap: 5, marginBottom: 14 },
    progressBar: { flex: 1, height: 4, borderRadius: 99, backgroundColor: theme.border },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    stageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
    stageBadgeText: { fontSize: 11, fontWeight: '700' },
    ganho: { fontSize: 18, fontWeight: '800', color: theme.text },
    route: { marginBottom: 14 },
    routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
    routeMain: { fontSize: 13, fontWeight: '600', color: theme.text },
    routeSub: { fontSize: 11, color: theme.textMut, marginTop: 1 },
    routeDash: {
      borderLeftWidth: 2,
      borderLeftColor: theme.border,
      borderStyle: 'dashed',
      height: 12,
      marginLeft: 4,
      marginVertical: 3,
    },
    continueBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#F2760F',
      borderRadius: 12,
      paddingVertical: 14,
    },
    continueBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    sectionHeader: {
      marginTop: 8,
      marginBottom: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 16,
    },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
    historicoEmpty: {
      fontSize: 12,
      color: theme.textMut,
      textAlign: 'center',
      paddingVertical: 16,
    },
    historicoCard: {
      backgroundColor: theme.surf,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    historicoBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
    historicoBadgeText: { fontSize: 11, fontWeight: '700', color: '#046C2E' },
    historicoBody: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    historicoLoja: { fontSize: 13, fontWeight: '600', color: theme.text },
    historicoDest: { fontSize: 11, color: theme.textMut, marginTop: 2 },
    historicoData: { fontSize: 10, color: '#B0B7CC', marginTop: 3 },
    historicoGanho: { fontSize: 16, fontWeight: '800', color: '#046C2E' },
    motivoChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 99,
      backgroundColor: '#FCEBEB',
      borderWidth: 1,
      borderColor: '#FCA5A5',
    },
    motivoChipTxt: { fontSize: 11, fontWeight: '700', color: '#9B1C1C' },
  });
}
