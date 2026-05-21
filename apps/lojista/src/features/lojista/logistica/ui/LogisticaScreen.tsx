import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LojistaService } from '@ajulabs/api-client';
import { useAuthLojistaStore } from '../../auth/model/store';
import { RastreamentoModal } from './components/RastreamentoModal';
import { mapPedidoToEntrega } from '../lib/mappers';
import type { EntregaDisplay } from '../model/types';
import { usePedidoLojistaRealtime } from '@ajulabs/realtime';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export function LogisticaScreen() {
  const token  = useAuthLojistaStore(s => s.token);
  const lojaId = useAuthLojistaStore(s => s.lojaId);

  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [emAndamento, setEmAndamento]   = useState<EntregaDisplay[]>([]);
  const [concluidas, setConcluidas]     = useState<EntregaDisplay[]>([]);
  const [selectedEntrega, setSelectedEntrega] = useState<EntregaDisplay | null>(null);

  const fetchData = useCallback(async () => {
    if (!token || !lojaId) { setLoading(false); return; }
    try {
      const { emAndamento: ea, concluidas: co } = await LojistaService.buscarEntregas(lojaId, token);
      setEmAndamento(ea.map((p: any) => mapPedidoToEntrega(p, 'andamento')));
      setConcluidas(co.map((p: any) => mapPedidoToEntrega(p, 'concluida')));
    } catch {}
    setLoading(false);
  }, [token, lojaId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  usePedidoLojistaRealtime({
    apiUrl: API_URL,
    lojaId: lojaId ?? null,
    enabled: !!lojaId,
    onAtualizado: fetchData,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F7FB" />

      <View style={s.header}>
        <Text style={s.headerTitle}>Logística</Text>
        <View style={s.headerStats}>
          <View style={s.statPill}>
            <View style={s.dotOrange} />
            <Text style={s.statPillText}>{emAndamento.length} em rota</Text>
          </View>
          <View style={[s.statPill, s.statPillGreen]}>
            <Ionicons name="checkmark-circle" size={12} color="#046C2E" />
            <Text style={[s.statPillText, { color: '#046C2E' }]}>{concluidas.length} concluídas</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#DE6708" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#DE6708" />}
        >
          <Text style={s.sectionLabel}>Em andamento</Text>

          {emAndamento.length === 0 ? (
            <View style={[s.card, { alignItems: 'center', paddingVertical: 28 }]}>
              <Ionicons name="bicycle-outline" size={32} color="#9099B3" />
              <Text style={{ fontSize: 13, color: '#9099B3', marginTop: 8 }}>Nenhuma entrega em andamento</Text>
            </View>
          ) : emAndamento.map(e => (
            <TouchableOpacity key={e.id} style={s.card} activeOpacity={0.75} onPress={() => setSelectedEntrega(e)}>
              <View style={s.cardTop}>
                <View style={s.cardLeft}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.orderId}>{e.pedidoId}</Text>
                    <View style={e.statusRaw === 'saiu_entrega' ? s.badgeGreen : s.badgeOrange}>
                      <View style={e.statusRaw === 'saiu_entrega' ? s.dotGreen : s.dotOrangeSmall} />
                      <Text style={e.statusRaw === 'saiu_entrega' ? s.badgeGreenText : s.badgeOrangeText}>
                        {e.statusRaw === 'saiu_entrega' ? 'Em rota' : 'Aguardando'}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.cardCliente}>{e.cliente}</Text>
                  <Text style={s.cardEndereco} numberOfLines={1}>{e.endereco}</Text>
                </View>
                <View style={s.cardRight}>
                  <Text style={s.hora}>{e.hora}</Text>
                  <View style={s.mapHint}>
                    <Ionicons name="map" size={12} color="#DE6708" />
                    <Text style={s.mapHintTxt}>Ver mapa</Text>
                  </View>
                </View>
              </View>
              <View style={s.motoboyRow}>
                <View style={s.motoboyAvatar}>
                  <Text style={s.motoboyInitials}>
                    {e.motoboy.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.motoboyName}>{e.motoboy}</Text>
                  <Text style={s.motoboyPlaca}>{e.placa}</Text>
                </View>
                <View style={s.rastrearHint}>
                  <Ionicons name="navigate" size={13} color="#fff" />
                  <Text style={s.rastrearTxt}>Rastrear</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <Text style={[s.sectionLabel, { marginTop: 8 }]}>Concluídas</Text>

          {concluidas.length === 0 ? (
            <View style={[s.card, { alignItems: 'center', paddingVertical: 24 }]}>
              <Text style={{ fontSize: 13, color: '#9099B3' }}>Nenhuma entrega concluída</Text>
            </View>
          ) : concluidas.map(e => (
            <View key={e.id} style={[s.card, s.cardConcluida]}>
              <View style={s.cardTop}>
                <View style={s.cardLeft}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.orderId}>{e.pedidoId}</Text>
                    <View style={s.badgeGreenAlt}>
                      <Ionicons name="checkmark-circle" size={11} color="#046C2E" />
                      <Text style={s.badgeGreenTextAlt}>Concluída</Text>
                    </View>
                  </View>
                  <Text style={s.cardCliente}>{e.cliente}</Text>
                  <Text style={s.cardEndereco} numberOfLines={1}>{e.endereco}</Text>
                </View>
                <View style={s.cardRight}>
                  <Text style={[s.hora, { color: '#9099B3', fontSize: 13 }]}>{e.hora}</Text>
                </View>
              </View>
              <View style={s.motoboyRow}>
                <View style={[s.motoboyAvatar, { backgroundColor: '#E4E7F1' }]}>
                  <Text style={[s.motoboyInitials, { color: '#9099B3' }]}>
                    {e.motoboy.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.motoboyName}>{e.motoboy}</Text>
                  <Text style={s.motoboyPlaca}>{e.placa}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {selectedEntrega && (
        <RastreamentoModal
          entrega={selectedEntrega}
          lojaId={lojaId}
          token={token}
          onClose={() => setSelectedEntrega(null)}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#F6F7FB' },
  header:          { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#E4E7F1', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:     { fontSize: 24, fontWeight: '700', color: '#000933' },
  headerStats:     { flexDirection: 'row', gap: 8 },
  statPill:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF0E6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  statPillGreen:   { backgroundColor: '#E6F7ED' },
  statPillText:    { fontSize: 11, fontWeight: '600', color: '#B34D00' },
  dotOrange:       { width: 7, height: 7, borderRadius: 99, backgroundColor: '#DE6708' },
  sectionLabel:    { fontSize: 11, fontWeight: '600', color: '#9099B3', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  card:            { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E4E7F1', padding: 14, marginBottom: 10, overflow: 'hidden' },
  cardConcluida:   { opacity: 0.72 },
  cardTop:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardLeft:        { flex: 1, marginRight: 12 },
  cardRight:       { alignItems: 'flex-end', gap: 6 },
  cardTitleRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  orderId:         { fontSize: 15, fontWeight: '700', color: '#000933' },
  cardCliente:     { fontSize: 12.5, color: '#9099B3', marginBottom: 2 },
  cardEndereco:    { fontSize: 12, color: '#000933' },
  hora:            { fontSize: 17, fontWeight: '700', color: '#DE6708' },
  mapHint:         { flexDirection: 'row', alignItems: 'center', gap: 3 },
  mapHintTxt:      { fontSize: 10, fontWeight: '600', color: '#DE6708' },

  badgeOrange:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF0E6', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99 },
  dotOrangeSmall:  { width: 5, height: 5, borderRadius: 99, backgroundColor: '#DE6708' },
  badgeOrangeText: { fontSize: 10, fontWeight: '700', color: '#DE6708' },
  badgeGreen:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E6F7ED', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99 },
  dotGreen:        { width: 5, height: 5, borderRadius: 99, backgroundColor: '#22C55E' },
  badgeGreenText:  { fontSize: 10, fontWeight: '700', color: '#046C2E' },
  badgeGreenAlt:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E6F7ED', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99 },
  badgeGreenTextAlt:{ fontSize: 10, fontWeight: '700', color: '#046C2E' },

  motoboyRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F1F7' },
  motoboyAvatar:   { width: 32, height: 32, borderRadius: 99, backgroundColor: '#DE6708', alignItems: 'center', justifyContent: 'center' },
  motoboyInitials: { fontSize: 12, fontWeight: '700', color: '#fff' },
  motoboyName:     { fontSize: 13, fontWeight: '600', color: '#000933' },
  motoboyPlaca:    { fontSize: 11, color: '#9099B3' },
  rastrearHint:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DE6708', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  rastrearTxt:     { fontSize: 11, fontWeight: '700', color: '#fff' },
});
