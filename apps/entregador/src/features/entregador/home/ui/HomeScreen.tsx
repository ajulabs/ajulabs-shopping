import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Mock data ────────────────────────────────────────────────
const COURIER_TODAY = {
  ganho: 187.5,
  corridas: 12,
  horasOnline: 4.5,
  meta: { feitas: 12, alvo: 20, bonus: 50 },
};

const LIVE_RIDE = {
  id: 'ride-001',
  loja: {
    nome: 'Caju & Cia',
    endereco: 'Rua João Pessoa, 342',
    bairro: 'Centro',
  },
  cliente: {
    nome: 'Mariana S.',
    endereco: 'Rua Laranjeiras, 45',
    bairro: 'Suíssa',
    complemento: 'Apto 12',
  },
  ganho: 18.9,
  distancia: 3.2,
  duracao: 18,
};

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ─── Offer sheet ──────────────────────────────────────────────
function OfferSheet({
  ride,
  countdown,
  onAccept,
  onReject,
}: {
  ride: typeof LIVE_RIDE;
  countdown: number;
  onAccept: () => void;
  onReject: () => void;
}) {
  const pct = (countdown / 15) * 100;
  return (
    <View style={s.offerSheet}>
      {/* Timer bar */}
      <View style={s.timerTrack}>
        <View
          style={[
            s.timerBar,
            {
              width: `${pct}%` as any,
              backgroundColor: pct > 40 ? '#F2760F' : '#E14B3C',
            },
          ]}
        />
      </View>

      <View style={s.offerContent}>
        <View style={s.offerHeader}>
          <View style={s.offerTitleRow}>
            <View style={s.zapCircle}>
              <Ionicons name="flash" size={16} color="#FFFFFF" />
            </View>
            <Text style={s.offerTitle}>Nova corrida</Text>
          </View>
          <View style={s.countdownBadge}>
            <Text style={s.countdownText}>{countdown}s</Text>
          </View>
        </View>

        {/* Valor */}
        <View style={s.valueBanner}>
          <View>
            <Text style={s.valueLabel}>Você ganha</Text>
            <Text style={s.valueAmount}>{brl(ride.ganho)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.valueLabel}>Distância total</Text>
            <Text style={s.valueSub}>{ride.distancia} km</Text>
            <Text style={s.valueLabel}>~{ride.duracao} min</Text>
          </View>
        </View>

        {/* Rota */}
        <View style={s.routeBox}>
          <View style={s.routeRow}>
            <View style={[s.routeDot, { backgroundColor: '#000933' }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.routeLabel}>Retirar em</Text>
              <Text style={s.routeMain}>{ride.loja.nome}</Text>
              <Text style={s.routeSub}>
                {ride.loja.endereco} · {ride.loja.bairro}
              </Text>
            </View>
          </View>
          <View style={s.routeDash} />
          <View style={s.routeRow}>
            <View style={[s.routeDot, { backgroundColor: '#209CEF' }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.routeLabel}>Entregar em</Text>
              <Text style={s.routeMain}>
                {ride.cliente.nome} · {ride.cliente.bairro}
              </Text>
              <Text style={s.routeSub}>{ride.cliente.endereco}</Text>
            </View>
          </View>
        </View>

        {/* Botões */}
        <View style={s.offerBtns}>
          <TouchableOpacity
            style={s.btnReject}
            onPress={onReject}
            activeOpacity={0.8}
          >
            <Text style={s.btnRejectText}>Recusar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.btnAccept}
            onPress={onAccept}
            activeOpacity={0.85}
          >
            <Text style={s.btnAcceptText}>Aceitar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────
interface HomeScreenProps {
  onAcceptRide: (ride: typeof LIVE_RIDE) => void;
}

export function HomeScreen({ onAcceptRide }: HomeScreenProps) {
  const [online, setOnline] = useState(true);
  const [offer, setOffer] = useState<typeof LIVE_RIDE | null>(null);
  const [countdown, setCountdown] = useState(15);

  // Simula oferta chegando após 3s de online
  useEffect(() => {
    if (!online || offer) return;
    const t = setTimeout(() => {
      setOffer(LIVE_RIDE);
      setCountdown(15);
    }, 3000);
    return () => clearTimeout(t);
  }, [online, offer]);

  // Countdown da oferta
  useEffect(() => {
    if (!offer) return;
    if (countdown <= 0) {
      setOffer(null);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [offer, countdown]);

  return (
    <SafeAreaView style={s.safeArea}>
      {/* Mapa simulado */}
      <View style={s.mapPlaceholder}>
        <Text style={s.mapText}>🗺️</Text>
        <Text style={s.mapSub}>Mapa — Aracaju, SE</Text>
      </View>

      {/* Toggle online/offline */}
      <View style={s.topBar}>
        <TouchableOpacity
          style={[s.onlineToggle, { backgroundColor: online ? '#39FF89' : '#FFFFFF' }]}
          onPress={() => {
            setOnline((v) => !v);
            setOffer(null);
          }}
          activeOpacity={0.85}
        >
          <View
            style={[
              s.onlineIcon,
              { backgroundColor: online ? 'rgba(255,255,255,0.3)' : '#F0F1F5' },
            ]}
          >
            <Ionicons
              name="power"
              size={18}
              color={online ? '#002B12' : '#9099B3'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                s.onlineTitle,
                { color: online ? '#002B12' : '#2A3156' },
              ]}
            >
              {online ? 'Você está online' : 'Você está offline'}
            </Text>
            <Text
              style={[
                s.onlineSub,
                { color: online ? '#046C2E' : '#9099B3' },
              ]}
            >
              {online ? 'Recebendo corridas' : 'Toque para ficar online'}
            </Text>
          </View>
          <View
            style={[
              s.toggleTrack,
              { backgroundColor: online ? 'rgba(0,43,18,0.25)' : '#D0D4E0' },
            ]}
          >
            <View
              style={[
                s.toggleThumb,
                { transform: [{ translateX: online ? 20 : 0 }] },
              ]}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Overlay offline */}
      {!online && (
        <View style={s.offlineOverlay}>
          <View style={s.offlineIcon}>
            <Ionicons name="power" size={32} color="#FFFFFF" />
          </View>
          <Text style={s.offlineTitle}>Em standby</Text>
          <Text style={s.offlineSub}>
            Fique online pra começar a receber corridas.
          </Text>
        </View>
      )}

      {/* Resumo do dia */}
      {online && !offer && (
        <View style={s.summaryCard}>
          <View style={s.summaryHeader}>
            <Text style={s.summaryLabel}>Hoje</Text>
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveBadgeText}>Procurando corridas</Text>
            </View>
          </View>
          <View style={s.summaryRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.summaryAmount}>{brl(COURIER_TODAY.ganho)}</Text>
              <Text style={s.summarySub}>Ganho do dia</Text>
            </View>
            <View style={s.dividerV} />
            <View style={s.summaryCol}>
              <Text style={s.summaryColVal}>{COURIER_TODAY.corridas}</Text>
              <Text style={s.summaryColLabel}>Corridas</Text>
            </View>
            <View style={s.dividerV} />
            <View style={s.summaryCol}>
              <Text style={s.summaryColVal}>{COURIER_TODAY.horasOnline}h</Text>
              <Text style={s.summaryColLabel}>Online</Text>
            </View>
          </View>
          <View style={s.metaBanner}>
            <Ionicons name="trophy" size={14} color="#F2760F" />
            <Text style={s.metaText}>
              Meta da semana: {COURIER_TODAY.meta.feitas}/
              {COURIER_TODAY.meta.alvo} corridas · bônus R${' '}
              {COURIER_TODAY.meta.bonus}
            </Text>
          </View>
        </View>
      )}

      {/* Oferta de corrida */}
      {offer && (
        <OfferSheet
          ride={offer}
          countdown={countdown}
          onAccept={() => {
            setOffer(null);
            onAcceptRide(offer);
          }}
          onReject={() => setOffer(null)}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B0F22' },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0F22',
  },
  mapText: { fontSize: 64 },
  mapSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 },
  topBar: {
    position: 'absolute',
    top: 60,
    left: 14,
    right: 14,
  },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px' as any,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  onlineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineTitle: { fontSize: 15, fontWeight: '700' },
  onlineSub: { fontSize: 11, marginTop: 1 },
  toggleTrack: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  offlineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11,15,34,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  offlineIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  offlineTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  offlineSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    maxWidth: 240,
  },
  summaryCard: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: { fontSize: 11, color: '#9099B3', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(57,255,137,0.15)',
    borderRadius: 99,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#39FF89' },
  liveBadgeText: { fontSize: 11, fontWeight: '700', color: '#046C2E' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  summaryAmount: { fontSize: 32, fontWeight: '800', color: '#000933' },
  summarySub: { fontSize: 11, color: '#9099B3', marginTop: 3 },
  dividerV: { width: 1, height: 36, backgroundColor: '#E4E7F1' },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryColVal: { fontSize: 20, fontWeight: '700', color: '#000933' },
  summaryColLabel: { fontSize: 10, color: '#9099B3', marginTop: 4 },
  metaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#FEF0E3',
    borderRadius: 10,
  },
  metaText: { fontSize: 11.5, color: '#F2760F', fontWeight: '600', flex: 1 },
  // Offer sheet
  offerSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 20,
    paddingBottom: 8,
  },
  timerTrack: {
    height: 4,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#E4E7F1',
    overflow: 'hidden',
  },
  timerBar: { height: '100%' },
  offerContent: { padding: 18 },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  offerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  zapCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F2760F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerTitle: { fontSize: 16, fontWeight: '700', color: '#000933' },
  countdownBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#000933',
    borderRadius: 99,
  },
  countdownText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  valueBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F2760F',
    borderRadius: 14,
    marginBottom: 12,
  },
  valueLabel: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  valueAmount: { fontSize: 30, fontWeight: '800', color: '#FFFFFF' },
  valueSub: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  routeBox: { marginBottom: 16 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  routeDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeLabel: { fontSize: 10, color: '#9099B3', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  routeMain: { fontSize: 14, fontWeight: '600', color: '#000933', lineHeight: 18 },
  routeSub: { fontSize: 11.5, color: '#9099B3', marginTop: 1 },
  routeDash: {
    borderLeftWidth: 2,
    borderLeftColor: '#E4E7F1',
    borderStyle: 'dashed',
    height: 14,
    marginLeft: 16,
    marginVertical: 4,
  },
  offerBtns: { flexDirection: 'row', gap: 10 },
  btnReject: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    alignItems: 'center',
  },
  btnRejectText: { fontSize: 14, fontWeight: '600', color: '#9099B3' },
  btnAccept: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F2760F',
    alignItems: 'center',
  },
  btnAcceptText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
