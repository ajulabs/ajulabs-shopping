import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Order } from '../lib';
import { useDeliveryTracking, iniciais } from '../model/useDeliveryTracking';
import { DeliveryTimeline } from './components';

interface Props {
  order?: Order | null;
  onBack: () => void;
}

export function DeliveryScreen({ order, onBack }: Props) {
  const { stepIdx, procurando, steps } = useDeliveryTracking(order);

  if (!order) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#F6F7FB" />
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Logística</Text>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="bicycle-outline" size={32} color="#000933" />
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#000933', marginTop: 8 }}>
            Nenhum pedido para despachar
          </Text>
          <Text style={{ fontSize: 13, color: '#9099B3', marginTop: 4 }}>
            Pedidos prontos aparecerão aqui
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F7FB" />

      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#000933" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Despachar pedido</Text>
          <Text style={s.headerSub}>
            {order.id} · {order.cliente}
          </Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {procurando ? (
          <View style={s.loadingBox}>
            <View style={s.loadingIcon}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
            <Text style={s.loadingTitle}>Procurando entregador…</Text>
            <Text style={s.loadingSub}>
              Avisamos os entregadores próximos. Assim que alguém aceitar, ele aparece aqui.
            </Text>
          </View>
        ) : (
          <>
            <View style={s.courierCard}>
              <View style={s.courierRow}>
                <View style={s.courierAvatar}>
                  <Text style={s.courierInitials}>{iniciais(order.entregadorNome)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.courierName}>{order.entregadorNome ?? 'Entregador'}</Text>
                  <Text style={s.courierVehicle}>Entregador AjuLabs</Text>
                </View>
                <View style={s.statusPill}>
                  <Text style={s.statusPillText}>
                    {order.status === 'entregue'
                      ? 'Entregue'
                      : order.status === 'despachado'
                        ? 'A caminho'
                        : 'Aguardando'}
                  </Text>
                </View>
              </View>
            </View>

            <DeliveryTimeline steps={steps} stepIdx={stepIdx} />

            <Text style={s.disclaimer}>
              O entregador é alocado automaticamente pela plataforma. Entregue o pedido a ele quando
              chegar — a retirada e a entrega são confirmadas pelo próprio entregador no app dele.
            </Text>
          </>
        )}

        <TouchableOpacity style={s.ctaBtn} onPress={onBack} activeOpacity={0.85}>
          <Text style={s.ctaBtnText}>Voltar aos pedidos</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F6F7FB',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 99,
    backgroundColor: '#E4E7F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#000933' },
  headerSub: { fontSize: 12, color: '#9099B3', marginTop: 1 },
  scroll: { flex: 1 },
  loadingBox: { alignItems: 'center', paddingVertical: 60 },
  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 99,
    backgroundColor: '#DE6708',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#DE6708',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingTitle: { fontSize: 18, fontWeight: '700', color: '#000933', marginBottom: 6 },
  loadingSub: {
    fontSize: 13,
    color: '#9099B3',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 19,
  },
  courierCard: { borderRadius: 18, padding: 16, backgroundColor: '#000933', marginBottom: 12 },
  courierRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  courierAvatar: {
    width: 56,
    height: 56,
    borderRadius: 99,
    backgroundColor: '#DE6708',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courierInitials: { fontSize: 22, fontWeight: '700', color: '#fff' },
  courierName: { fontSize: 17, fontWeight: '600', color: '#fff' },
  courierVehicle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  statusPillText: { fontSize: 12, fontWeight: '700', color: '#39FF89' },
  ctaBtn: {
    backgroundColor: '#000933',
    borderRadius: 14,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  disclaimer: {
    fontSize: 11,
    color: '#9099B3',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
});
