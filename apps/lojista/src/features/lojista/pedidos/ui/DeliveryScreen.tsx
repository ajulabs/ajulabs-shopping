import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../data';

interface Props {
  order?: Order | null;
  onBack: () => void;
}

type Stage = 'alocando' | 'alocado' | 'coletando' | 'entregando';

const STEPS = [
  { id: 'alocado', label: 'Motoboy alocado' },
  { id: 'coletando', label: 'A caminho da loja' },
  { id: 'entregando', label: 'Entregando' },
];

const STAGE_IDX: Record<Stage, number> = {
  alocando: -1, alocado: 0, coletando: 1, entregando: 2,
};

export function DeliveryScreen({ order, onBack }: Props) {
  const [stage, setStage] = useState<Stage>('alocando');

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
        <Text style={{ fontSize: 32 }}>🛵</Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#000933', marginTop: 8 }}>Nenhum pedido para despachar</Text>
        <Text style={{ fontSize: 13, color: '#9099B3', marginTop: 4 }}>Pedidos prontos aparecerão aqui</Text>
      </View>
    </SafeAreaView>
  );
}

  useEffect(() => {
    const t = setTimeout(() => setStage('alocado'), 1500);
    return () => clearTimeout(t);
  }, []);

  const stepIdx = STAGE_IDX[stage];

  const ctaLabel = {
    alocado: 'Entreguei ao motoboy',
    coletando: 'Confirmar coleta',
    entregando: 'Voltar aos pedidos',
  }[stage as Exclude<Stage, 'alocando'>];

  const handleCta = () => {
    if (stage === 'alocado') setStage('coletando');
    else if (stage === 'coletando') setStage('entregando');
    else onBack();
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F7FB" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#000933" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Despachar pedido</Text>
          <Text style={s.headerSub}>{order.id} · {order.cliente}</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

        {stage === 'alocando' ? (
          <View style={s.loadingBox}>
            <View style={s.loadingIcon}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
            <Text style={s.loadingTitle}>Procurando motoboy…</Text>
            <Text style={s.loadingSub}>Buscando o mais próximo da sua loja</Text>
          </View>
        ) : (
          <>
            {/* Card do motoboy */}
            <View style={s.courierCard}>
              <View style={s.courierRow}>
                <View style={s.courierAvatar}>
                  <Text style={s.courierInitials}>ES</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.courierName}>Edson Silva</Text>
                  <Text style={s.courierVehicle}>
                    Moto Honda CG 150 · <Text style={{ color: '#DE6708' }}>ABC-1234</Text>
                  </Text>
                  <View style={s.starsRow}>
                    {[1,2,3,4,5].map(i => (
                      <Ionicons key={i} name="star" size={11} color="#DE6708" />
                    ))}
                    <Text style={s.starsText}>4.9 · 1.2k entregas</Text>
                  </View>
                </View>
                <TouchableOpacity style={s.callBtn}>
                  <Ionicons name="call" size={18} color="#002B12" />
                </TouchableOpacity>
              </View>

              <View style={s.statsRow}>
                <View style={s.statItem}>
                  <Text style={s.statLabel}>Chega em</Text>
                  <Text style={s.statValue}>4 min</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={s.statLabel}>Distância</Text>
                  <Text style={s.statValue}>1,4 km</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={s.statLabel}>Taxa</Text>
                  <Text style={[s.statValue, { color: '#39FF89' }]}>Grátis*</Text>
                </View>
              </View>
            </View>

            {/* Timeline de status */}
            <View style={s.timelineCard}>
              <Text style={s.timelineTitle}>Status</Text>
              {STEPS.map((step, i) => {
                const done = i <= stepIdx;
                const active = i === stepIdx;
                return (
                  <View key={step.id} style={s.stepRow}>
                    {/* Linha conectora */}
                    {i < STEPS.length - 1 && (
                      <View style={[s.stepLine, { backgroundColor: i < stepIdx ? '#DE6708' : '#E4E7F1' }]} />
                    )}
                    {/* Dot */}
                    <View style={[
                      s.stepDot,
                      done ? s.stepDotDone : s.stepDotPending,
                      active && s.stepDotActive,
                    ]}>
                      {done && !active && <Ionicons name="checkmark" size={10} color="#fff" />}
                      {active && <View style={s.stepDotInner} />}
                    </View>
                    {/* Label */}
                    <Text style={[s.stepLabel, done ? s.stepLabelDone : s.stepLabelPending]}>
                      {step.label}
                    </Text>
                    {/* Badge "Agora" */}
                    {active && (
                      <View style={s.nowBadge}>
                        <Text style={s.nowBadgeText}>Agora</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* CTA */}
            <TouchableOpacity style={s.ctaBtn} onPress={handleCta} activeOpacity={0.85}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={s.ctaBtnText}>{ctaLabel}</Text>
            </TouchableOpacity>

            <Text style={s.disclaimer}>
              * Taxa para lojas parceiras. O motoboy é alocado pela plataforma automaticamente.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#F6F7FB' },
  backBtn: { width: 38, height: 38, borderRadius: 99, backgroundColor: '#E4E7F1', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#000933' },
  headerSub: { fontSize: 12, color: '#9099B3', marginTop: 1 },
  scroll: { flex: 1 },
  loadingBox: { alignItems: 'center', paddingVertical: 60 },
  loadingIcon: { width: 64, height: 64, borderRadius: 99, backgroundColor: '#DE6708', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#DE6708', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  loadingTitle: { fontSize: 18, fontWeight: '700', color: '#000933', marginBottom: 6 },
  loadingSub: { fontSize: 13, color: '#9099B3' },
  courierCard: { borderRadius: 18, padding: 16, backgroundColor: '#000933', marginBottom: 12 },
  courierRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  courierAvatar: { width: 56, height: 56, borderRadius: 99, backgroundColor: '#DE6708', alignItems: 'center', justifyContent: 'center' },
  courierInitials: { fontSize: 22, fontWeight: '700', color: '#fff' },
  courierName: { fontSize: 17, fontWeight: '600', color: '#fff' },
  courierVehicle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  starsText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginLeft: 4 },
  callBtn: { width: 44, height: 44, borderRadius: 99, backgroundColor: '#39FF89', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, padding: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12 },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  timelineCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E4E7F1' },
  timelineTitle: { fontSize: 16, fontWeight: '700', color: '#000933', marginBottom: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, position: 'relative' },
  stepLine: { position: 'absolute', left: 9, top: 28, width: 2, height: 24 },
  stepDot: { width: 20, height: 20, borderRadius: 99, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  stepDotDone: { backgroundColor: '#DE6708' },
  stepDotPending: { backgroundColor: '#E4E7F1' },
  stepDotActive: { shadowColor: '#DE6708', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
  stepDotInner: { width: 6, height: 6, borderRadius: 99, backgroundColor: '#fff' },
  stepLabel: { flex: 1, fontSize: 13.5 },
  stepLabelDone: { fontWeight: '600', color: '#000933' },
  stepLabelPending: { color: '#9099B3' },
  nowBadge: { backgroundColor: '#FFF0E6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  nowBadgeText: { fontSize: 11, fontWeight: '700', color: '#DE6708' },
  ctaBtn: { backgroundColor: '#000933', borderRadius: 14, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  ctaBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  disclaimer: { fontSize: 11, color: '#9099B3', textAlign: 'center', lineHeight: 16 },
});