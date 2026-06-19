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
import { Order } from '../data';

interface Props {
  order?: Order | null;
  onBack: () => void;
}

const STEPS = [
  { id: 'alocado', label: 'Entregador alocado' },
  { id: 'retirada', label: 'Retirada na loja' },
  { id: 'entregando', label: 'Saiu para entrega' },
];

// Deriva em qual etapa o pedido está a partir do estado REAL:
// - sem entregador (status pronto)      → -1 (procurando)
// - entregador alocado (status pronto)  →  0 (aguardando retirada)
// - despachado (saiu para entrega)      →  2
function stepIndexFromOrder(order: Order): number {
  if (order.status === 'entregue') return STEPS.length; // todas as etapas concluídas
  if (order.status === 'despachado') return 2;
  if (order.entregadorId) return 0;
  return -1;
}

function iniciais(nome?: string): string {
  if (!nome) return '–';
  return nome
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function DeliveryScreen({ order, onBack }: Props) {
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

  const stepIdx = stepIndexFromOrder(order);
  const procurando = stepIdx === -1;

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

            <View style={s.timelineCard}>
              <Text style={s.timelineTitle}>Status</Text>
              {STEPS.map((step, i) => {
                const done = i <= stepIdx;
                const active = i === stepIdx;
                return (
                  <View key={step.id} style={s.stepRow}>
                    {i < STEPS.length - 1 && (
                      <View
                        style={[
                          s.stepLine,
                          { backgroundColor: i < stepIdx ? '#DE6708' : '#E4E7F1' },
                        ]}
                      />
                    )}
                    <View
                      style={[
                        s.stepDot,
                        done ? s.stepDotDone : s.stepDotPending,
                        active && s.stepDotActive,
                      ]}
                    >
                      {done && !active && <Ionicons name="checkmark" size={10} color="#fff" />}
                      {active && <View style={s.stepDotInner} />}
                    </View>
                    <Text style={[s.stepLabel, done ? s.stepLabelDone : s.stepLabelPending]}>
                      {step.label}
                    </Text>
                    {active && (
                      <View style={s.nowBadge}>
                        <Text style={s.nowBadgeText}>Agora</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

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
  timelineCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  timelineTitle: { fontSize: 16, fontWeight: '700', color: '#000933', marginBottom: 14 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    position: 'relative',
  },
  stepLine: { position: 'absolute', left: 9, top: 28, width: 2, height: 24 },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepDotDone: { backgroundColor: '#DE6708' },
  stepDotPending: { backgroundColor: '#E4E7F1' },
  stepDotActive: {
    shadowColor: '#DE6708',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  stepDotInner: { width: 6, height: 6, borderRadius: 99, backgroundColor: '#fff' },
  stepLabel: { flex: 1, fontSize: 13.5 },
  stepLabelDone: { fontWeight: '600', color: '#000933' },
  stepLabelPending: { color: '#9099B3' },
  nowBadge: {
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  nowBadgeText: { fontSize: 11, fontWeight: '700', color: '#DE6708' },
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
