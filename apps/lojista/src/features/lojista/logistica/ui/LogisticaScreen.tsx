import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEntregas } from '../model/useEntregas';
import { EntregaCard } from './components/EntregaCard';
import { RastreamentoModal } from './components/RastreamentoModal';
import type { EntregaDisplay } from '../model/types';

export function LogisticaScreen() {
  const router = useRouter();
  const { token, lojaId, loading, refreshing, emAndamento, concluidas, handleRefresh } =
    useEntregas();

  const [selectedEntrega, setSelectedEntrega] = useState<EntregaDisplay | null>(null);

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
            <Text style={[s.statPillText, { color: '#046C2E' }]}>
              {concluidas.length} concluídas
            </Text>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#DE6708" />
          }
        >
          <Text style={s.sectionLabel}>Em andamento</Text>

          {emAndamento.length === 0 ? (
            <View style={[s.card, { alignItems: 'center', paddingVertical: 28 }]}>
              <Ionicons name="bicycle-outline" size={32} color="#9099B3" />
              <Text style={{ fontSize: 13, color: '#9099B3', marginTop: 8 }}>
                Nenhuma entrega em andamento
              </Text>
            </View>
          ) : (
            emAndamento.map((e) => (
              <EntregaCard key={e.id} entrega={e} onPress={setSelectedEntrega} />
            ))
          )}

          <Text style={[s.sectionLabel, { marginTop: 8 }]}>Concluídas</Text>

          {concluidas.length === 0 ? (
            <View style={[s.card, { alignItems: 'center', paddingVertical: 24 }]}>
              <Text style={{ fontSize: 13, color: '#9099B3' }}>Nenhuma entrega concluída</Text>
            </View>
          ) : (
            concluidas.map((e) => <EntregaCard key={e.id} entrega={e} />)
          )}
        </ScrollView>
      )}

      {selectedEntrega && (
        <RastreamentoModal
          entrega={selectedEntrega}
          lojaId={lojaId}
          token={token}
          onClose={() => setSelectedEntrega(null)}
          onOpenChat={(pedidoId) => {
            setSelectedEntrega(null);
            router.push({
              pathname: '/(lojista)/chat-pedido/[pedidoId]',
              params: { pedidoId, destinatario: 'ENTREGADOR' },
            });
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#000933' },
  headerStats: { flexDirection: 'row', gap: 8 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  statPillGreen: { backgroundColor: '#E6F7ED' },
  statPillText: { fontSize: 11, fontWeight: '600', color: '#B34D00' },
  dotOrange: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#DE6708' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9099B3',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    padding: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
});
