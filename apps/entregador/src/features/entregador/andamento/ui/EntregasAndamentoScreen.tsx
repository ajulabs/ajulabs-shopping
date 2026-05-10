import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Stage } from '../../corrida-ativa/ui/ActiveScreen';
import { EntregadorService } from '@ajulabs/api-client';
import { useAuthEntregadorStore } from '../../auth/model/store';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmt = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const STAGE_LABEL: Record<Stage, string> = {
  'to-store':     'A caminho da loja',
  'at-store':     'Coletando pedido',
  'to-customer':  'A caminho do cliente',
  'delivered':    'Confirmando entrega',
};

const STAGE_IDX: Record<Stage, number> = {
  'to-store': 0, 'at-store': 1, 'to-customer': 2, 'delivered': 3,
};

const STAGE_COLOR: Record<Stage, string> = {
  'to-store':    '#000933',
  'at-store':    '#B34D00',
  'to-customer': '#0369A1',
  'delivered':   '#046C2E',
};

const STAGE_BG: Record<Stage, string> = {
  'to-store':    '#E4E7F1',
  'at-store':    '#FFF0E6',
  'to-customer': '#E0F2FE',
  'delivered':   '#E6F7ED',
};

export interface ActiveRideWithStage {
  id: string;
  loja: { nome: string; endereco: string; bairro: string };
  cliente: { nome: string; endereco: string; bairro: string; complemento?: string };
  ganho: number;
  distancia: number;
  duracao: number;
  codigo: string;
  stage: Stage;
}

interface EntregaHistorico {
  id: string;
  valorRecebido: number;
  bonus: number | null;
  criadoEm: string;
  pedido: {
    id: string;
    loja: { nome: string } | null;
    enderecoEntrega: { bairro: string; cidade: string } | null;
  } | null;
}

interface Props {
  rides: ActiveRideWithStage[];
  onSelectRide: (ride: ActiveRideWithStage) => void;
}

export function EntregasAndamentoScreen({ rides, onSelectRide }: Props) {
  const token = useAuthEntregadorStore(s => s.token);
  const slots = 2 - rides.length;

  const [historico, setHistorico] = useState<EntregaHistorico[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoadingHistorico(true);
    EntregadorService.listarEntregas(token)
      .then(setHistorico)
      .catch(() => {})
      .finally(() => setLoadingHistorico(false));
  }, [token]);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.headerSub}>Suas entregas</Text>
        <Text style={s.headerTitle}>Em andamento</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Seção: corridas ativas ── */}
        {rides.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Ionicons name="bicycle-outline" size={40} color="#9099B3" />
            </View>
            <Text style={s.emptyTitle}>Nenhuma entrega ativa</Text>
            <Text style={s.emptySub}>
              Aceite corridas na aba <Text style={{ fontWeight: '700', color: '#F2760F' }}>Corridas</Text> para começar a entregar.
            </Text>
          </View>
        ) : (
          <>
            {slots > 0 ? (
              <View style={s.slotBanner}>
                <Ionicons name="add-circle-outline" size={16} color="#046C2E" />
                <Text style={s.slotBannerText}>
                  Você pode aceitar mais {slots} entrega{slots > 1 ? 's' : ''} simultânea{slots > 1 ? 's' : ''}.
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

            {rides.map(ride => {
              const stageIdx = STAGE_IDX[ride.stage];
              return (
                <View key={ride.id} style={s.card}>
                  <View style={s.progressBars}>
                    {[0, 1, 2, 3].map(i => (
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

        {/* ── Seção: histórico ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Histórico</Text>
        </View>

        {loadingHistorico ? (
          <ActivityIndicator size="small" color="#F2760F" style={{ marginTop: 20 }} />
        ) : historico.length === 0 ? (
          <Text style={s.historicoEmpty}>Nenhuma entrega concluída ainda.</Text>
        ) : (
          historico.map(item => {
            const ganho = Number(item.valorRecebido) + (item.bonus ? Number(item.bonus) : 0);
            return (
              <View key={item.id} style={s.historicoCard}>
                <View style={s.historicoBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#046C2E" />
                  <Text style={s.historicoBadgeText}>Entregue</Text>
                </View>
                <View style={s.historicoBody}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.historicoLoja}>{item.pedido?.loja?.nome ?? '–'}</Text>
                    <Text style={s.historicoDest}>
                      {item.pedido?.enderecoEntrega?.bairro ?? '–'} · {item.pedido?.enderecoEntrega?.cidade ?? ''}
                    </Text>
                    <Text style={s.historicoData}>{fmt(item.criadoEm)}</Text>
                  </View>
                  <Text style={s.historicoGanho}>{brl(ganho)}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#E4E7F1' },
  headerSub: { fontSize: 11, color: '#9099B3', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#000933', marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 32 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 14 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0F1F7', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#000933' },
  emptySub: { fontSize: 13, color: '#9099B3', textAlign: 'center', maxWidth: 260, lineHeight: 20 },
  slotBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: '#E6F7ED', borderWidth: 1, borderColor: '#046C2E', marginBottom: 14 },
  slotBannerFull: { backgroundColor: '#FFF0E6', borderColor: '#F2760F' },
  slotBannerText: { fontSize: 12.5, color: '#046C2E', fontWeight: '600', flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E4E7F1' },
  progressBars: { flexDirection: 'row', gap: 5, marginBottom: 14 },
  progressBar: { flex: 1, height: 4, borderRadius: 99, backgroundColor: '#E4E7F1' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  stageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  stageBadgeText: { fontSize: 11, fontWeight: '700' },
  ganho: { fontSize: 18, fontWeight: '800', color: '#000933' },
  route: { marginBottom: 14 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  routeMain: { fontSize: 13, fontWeight: '600', color: '#000933' },
  routeSub: { fontSize: 11, color: '#9099B3', marginTop: 1 },
  routeDash: { borderLeftWidth: 2, borderLeftColor: '#E4E7F1', borderStyle: 'dashed', height: 12, marginLeft: 4, marginVertical: 3 },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F2760F', borderRadius: 12, paddingVertical: 14 },
  continueBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  // histórico
  sectionHeader: { marginTop: 8, marginBottom: 12, borderTopWidth: 1, borderTopColor: '#E4E7F1', paddingTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#000933' },
  historicoEmpty: { fontSize: 12, color: '#9099B3', textAlign: 'center', paddingVertical: 16 },
  historicoCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E4E7F1' },
  historicoBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  historicoBadgeText: { fontSize: 11, fontWeight: '700', color: '#046C2E' },
  historicoBody: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historicoLoja: { fontSize: 13, fontWeight: '600', color: '#000933' },
  historicoDest: { fontSize: 11, color: '#9099B3', marginTop: 2 },
  historicoData: { fontSize: 10, color: '#B0B7CC', marginTop: 3 },
  historicoGanho: { fontSize: 16, fontWeight: '800', color: '#046C2E' },
});
