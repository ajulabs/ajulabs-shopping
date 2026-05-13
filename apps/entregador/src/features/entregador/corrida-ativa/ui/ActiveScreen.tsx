import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { EntregadorService } from '@ajulabs/api-client';
import { useNavigation } from '@ajulabs/maps';
import { useLocationEmitter } from '@ajulabs/realtime';
import { useAuthEntregadorStore } from '../../auth/model/store';
import { LeafletMap } from '../../../../components/LeafletMap';
import type { MapMarker } from '../../../../components/LeafletMap';
import { startBackgroundTracking, stopBackgroundTracking } from '../../../../tasks/locationTask';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const ARACAJU = { lat: -10.9167, lng: -37.0500 };

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${address}, Aracaju, SE, Brasil`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { 'User-Agent': 'AjuLabs-Entregador/1.0' } }
    );
    const data = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

// ── Formatters ──────────────────────────────────────────────
function fmtDist(m: number): string {
  if (m <= 0) return '–';
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

function fmtEta(sec: number): string {
  if (sec <= 0) return '–';
  if (sec < 60) return '< 1 min';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}min`;
}

function fmtSpeed(kmh: number): string {
  return `${Math.round(kmh)} km/h`;
}

function maneuverIcon(modifier?: string): string {
  const map: Record<string, string> = {
    'left':        'arrow-back',
    'right':       'arrow-forward',
    'straight':    'arrow-up',
    'slight left': 'arrow-back-outline',
    'slight right':'arrow-forward-outline',
    'sharp left':  'return-down-back',
    'sharp right': 'return-down-forward',
    'uturn':       'refresh',
  };
  return map[modifier ?? ''] ?? 'arrow-up';
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ── Stage types ─────────────────────────────────────────────
export const STAGES = ['to-store', 'at-store', 'to-customer', 'delivered'] as const;
export type Stage = typeof STAGES[number];

const STAGE_LABEL: Record<Stage, string> = {
  'to-store':   'A caminho da loja',
  'at-store':   'Coletando pedido',
  'to-customer':'A caminho do cliente',
  delivered:    'Confirmando entrega',
};

interface ActiveRide {
  id: string;
  loja: { nome: string; endereco: string; bairro: string };
  cliente: { nome: string; telefone?: string; endereco: string; bairro: string; complemento?: string };
  ganho: number;
  distancia: number;
  duracao: number;
  codigo: string;
}

interface ActiveScreenProps {
  ride: ActiveRide;
  initialStage?: Stage;
  onFinish: () => void;
  onBack?: (currentStage: Stage) => void;
}

// ── StageCard ───────────────────────────────────────────────
function StageCard({
  icon, iconColor, primary, secondary, cta, onCta, codigoEntrega,
}: {
  icon: string; iconColor: string; primary: string; secondary: string;
  cta: string; onCta: () => void; codigoEntrega?: string;
}) {
  return (
    <View>
      <View style={s.stageRow}>
        <View style={[s.stageIcon, { backgroundColor: iconColor }]}>
          <Ionicons name={icon as any} size={22} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.stagePrimary}>{primary}</Text>
          <Text style={s.stageSec}>{secondary}</Text>
        </View>
      </View>

      {codigoEntrega && (
        <View style={s.codeInfoBox}>
          <Ionicons name="keypad-outline" size={14} color="#F2760F" />
          <Text style={s.codeInfoLabel}>Código da corrida:</Text>
          <Text style={s.codeInfoValue}>{codigoEntrega}</Text>
        </View>
      )}

      <TouchableOpacity style={s.ctaBtn} onPress={onCta} activeOpacity={0.85}>
        <Text style={s.ctaBtnText}>{cta}</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────
export function ActiveScreen({ ride, initialStage, onFinish, onBack }: ActiveScreenProps) {
  const token = useAuthEntregadorStore(s => s.token);
  const entregadorId = useAuthEntregadorStore(s => s.entregadorId);
  const [stage, setStage] = useState<Stage>(initialStage ?? 'to-store');
  const idx = STAGES.indexOf(stage);

  const [photoUri, setPhotoUri]               = useState<string | null>(null);
  const [loadingRetirada, setLoadingRetirada] = useState(false);
  const [codigoEntrega, setCodigoEntrega]     = useState('');
  const [loadingEntrega, setLoadingEntrega]   = useState(false);

  const [mapMarkers, setMapMarkers]   = useState<MapMarker[]>([]);
  const [mapCenter, setMapCenter]     = useState(ARACAJU);
  const [storeCoords, setStoreCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [clientCoords, setClientCoords] = useState<{ lat: number; lng: number } | null>(null);

  // ── Geocode once on mount ──────────────────────────────────
  useEffect(() => {
    (async () => {
      const [sc, cc] = await Promise.all([
        geocode(`${ride.loja.endereco}, ${ride.loja.bairro}`),
        geocode(`${ride.cliente.endereco}, ${ride.cliente.bairro}`),
      ]);
      setStoreCoords(sc);
      setClientCoords(cc);
      const markers: MapMarker[] = [];
      if (sc) { markers.push({ ...sc, color: '#000933', label: ride.loja.nome }); setMapCenter(sc); }
      if (cc) { markers.push({ ...cc, color: '#F2760F', label: ride.cliente.nome }); if (!sc) setMapCenter(cc); }
      if (markers.length > 0) setMapMarkers(markers);
    })();
  }, []);

  // ── Navigation destination based on current stage ──────────
  const destination =
    stage === 'to-store'    ? storeCoords  :
    stage === 'to-customer' ? clientCoords :
    null;

  const isNavigating = stage === 'to-store' || stage === 'to-customer';

  // ── useNavigation hook ─────────────────────────────────────
  const nav = useNavigation(destination, isNavigating && !!(storeCoords || clientCoords));

  // ── Start/stop background location tracking ───────────────
  useEffect(() => {
    const isDelivered = stage === 'delivered';
    if (!isDelivered) {
      startBackgroundTracking({ pedidoId: ride.id, apiUrl: API_URL });
    } else {
      stopBackgroundTracking();
    }
    return () => { stopBackgroundTracking(); };
  }, [stage === 'delivered']);

  // ── Emit location via Socket.IO (foreground) ───────────────
  useLocationEmitter({
    apiUrl: API_URL,
    pedidoId: ride.id,
    entregadorId,
    location: nav.userLocation
      ? { lat: nav.userLocation.lat, lng: nav.userLocation.lng, heading: nav.heading, speedKmh: nav.speedKmh }
      : null,
    enabled: isNavigating,
    intervalMs: 5000,
  });

  // ── Stage helpers ──────────────────────────────────────────
  const advanceStage = useCallback(() => {
    const next = STAGES[idx + 1];
    if (next) setStage(next);
  }, [idx]);

  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à câmera para tirar a foto do produto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: false });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  }, []);

  const handleConfirmarRetirada = useCallback(async () => {
    if (!token) return;
    setLoadingRetirada(true);
    try {
      await EntregadorService.confirmarRetirada(token, ride.id);
      setStage('to-customer');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível confirmar a retirada. Tente novamente.');
    } finally {
      setLoadingRetirada(false);
    }
  }, [token, ride.id]);

  const handleConfirmarEntrega = useCallback(async () => {
    if (!token || codigoEntrega.length < 4) return;
    setLoadingEntrega(true);
    try {
      await EntregadorService.confirmarEntrega(token, ride.id, codigoEntrega);
      onFinish();
    } catch (err: any) {
      const msg = err?.message?.includes('incorreto')
        ? 'Código incorreto. Peça ao cliente para verificar.'
        : 'Erro ao confirmar. Tente novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setLoadingEntrega(false);
    }
  }, [token, ride.id, codigoEntrega, onFinish]);

  // ── Computed values ────────────────────────────────────────
  const userLocation = nav.userLocation ?? undefined;
  const center       = userLocation ?? mapCenter;
  const routeCoords  = nav.routeCoords.length > 1 ? nav.routeCoords : undefined;

  return (
    <SafeAreaView style={s.safeArea}>
      {/* ── Map ── */}
      <LeafletMap
        center={center}
        userLocation={userLocation}
        markers={mapMarkers}
        routeCoords={routeCoords}
        routeTo={destination}
        heading={nav.heading}
        zoom={16}
        style={s.mapBg}
      />

      {/* ── Top overlay: back + progress + instruction ── */}
      <View style={s.topOverlay}>
        <View style={s.topRow}>
          {onBack && (
            <TouchableOpacity style={s.backBtn} onPress={() => onBack(stage)} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={20} color="#000933" />
            </TouchableOpacity>
          )}
          <View style={[s.progressCard, onBack ? { marginLeft: 8 } : {}]}>
            <View style={s.progressBars}>
              {STAGES.map((_, i) => (
                <View key={i} style={[s.progressBar, { backgroundColor: i <= idx ? '#F2760F' : '#E4E7F1' }]} />
              ))}
            </View>
            <View style={s.progressInfo}>
              <View>
                <Text style={s.progressStep}>Passo {idx + 1}/4</Text>
                <Text style={s.progressLabel}>{STAGE_LABEL[stage]}</Text>
              </View>
              <Text style={s.progressGanho}>{brl(ride.ganho)}</Text>
            </View>
          </View>
        </View>

        {/* Turn-by-turn instruction card */}
        {isNavigating && nav.currentStep && (
          <View style={s.instructionCard}>
            <View style={[s.instructionIcon, nav.distanceToStep < 100 && s.instructionIconUrgent]}>
              <Ionicons name={maneuverIcon(nav.currentStep.modifier) as any} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.instructionText} numberOfLines={1}>{nav.currentStep.instruction}</Text>
              {nav.nextStep && (
                <Text style={s.instructionNext} numberOfLines={1}>
                  Depois: {nav.nextStep.instruction}
                </Text>
              )}
            </View>
            <Text style={[s.instructionDist, nav.distanceToStep < 100 && s.instructionDistUrgent]}>
              {fmtDist(nav.distanceToStep)}
            </Text>
          </View>
        )}

        {/* Off-route warning */}
        {nav.isOffRoute && (
          <View style={s.offRouteCard}>
            <Ionicons name="refresh" size={14} color="#fff" />
            <Text style={s.offRouteTxt}>Recalculando rota...</Text>
          </View>
        )}
      </View>

      {/* ── FABs ── */}
      {stage !== 'delivered' && (
        <View style={s.fabs}>
          <TouchableOpacity
            style={[s.fab, { backgroundColor: '#39FF89' }, !ride.cliente.telefone && { opacity: 0.4 }]}
            activeOpacity={0.8}
            onPress={() => { if (ride.cliente.telefone) Linking.openURL(`tel:${ride.cliente.telefone}`); }}
          >
            <Ionicons name="call" size={20} color="#002B12" />
          </TouchableOpacity>
          <TouchableOpacity style={[s.fab, { backgroundColor: '#FFFFFF' }]} activeOpacity={0.8}>
            <Ionicons name="chatbubble" size={20} color="#000933" />
          </TouchableOpacity>
          <TouchableOpacity style={[s.fab, { backgroundColor: '#209CEF' }]} activeOpacity={0.8}>
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Bottom sheet ── */}
      <View style={s.bottomSheet}>
        {/* Navigation stats row */}
        {isNavigating && (
          <View style={s.navStats}>
            <View style={s.navStat}>
              <Text style={s.navStatLabel}>VELOCIDADE</Text>
              <Text style={s.navStatVal}>{fmtSpeed(nav.speedKmh)}</Text>
            </View>
            <View style={s.navStatDivider} />
            <View style={s.navStat}>
              <Text style={s.navStatLabel}>CHEGADA</Text>
              <Text style={[s.navStatVal, { color: '#F2760F' }]}>{fmtEta(nav.etaSeconds)}</Text>
            </View>
            <View style={s.navStatDivider} />
            <View style={s.navStat}>
              <Text style={s.navStatLabel}>DISTÂNCIA</Text>
              <Text style={s.navStatVal}>{fmtDist(nav.distanceRemaining)}</Text>
            </View>
          </View>
        )}

        {stage === 'to-store' && (
          <StageCard
            icon="storefront"
            iconColor="#000933"
            primary={ride.loja.nome}
            secondary={`${ride.loja.endereco} · ${ride.loja.bairro}`}
            cta="Cheguei na loja"
            onCta={advanceStage}
          />
        )}

        {stage === 'at-store' && (
          <View>
            <Text style={s.codeLabel}>Foto do produto</Text>

            {!photoUri ? (
              <TouchableOpacity style={s.photoBtn} onPress={handleTakePhoto} activeOpacity={0.8}>
                <Ionicons name="camera" size={28} color="#F2760F" />
                <Text style={s.photoBtnText}>Tirar foto do produto</Text>
                <Text style={s.photoBtnSub}>Obrigatório para confirmar a retirada</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.photoPreview}>
                <Image source={{ uri: photoUri }} style={s.photoImage} resizeMode="cover" />
                <TouchableOpacity style={s.photoRetake} onPress={handleTakePhoto} activeOpacity={0.8}>
                  <Ionicons name="refresh" size={14} color="#fff" />
                  <Text style={s.photoRetakeTxt}>Tirar outra</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={s.codeHint}>
              <Text style={s.codeHintText}>
                Tire uma foto do pedido antes de sair de{' '}
                <Text style={{ fontWeight: '700' }}>{ride.loja.nome}</Text>.
              </Text>
            </View>

            <TouchableOpacity
              style={[s.ctaBtn, (!photoUri || loadingRetirada) && { opacity: 0.5 }]}
              onPress={photoUri ? handleConfirmarRetirada : undefined}
              disabled={!photoUri || loadingRetirada}
              activeOpacity={0.85}
            >
              {loadingRetirada ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={s.ctaBtnText}>Confirmar retirada</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {stage === 'to-customer' && (
          <StageCard
            icon="home"
            iconColor="#209CEF"
            primary={ride.cliente.nome}
            secondary={`${ride.cliente.endereco}${ride.cliente.complemento ? ` · ${ride.cliente.complemento}` : ''}`}
            cta="Cheguei no destino"
            onCta={advanceStage}
            codigoEntrega={ride.id.slice(0, 8).toUpperCase()}
          />
        )}

        {stage === 'delivered' && (
          <View>
            <TouchableOpacity
              style={s.stageBackBtn}
              onPress={() => { setStage('to-customer'); setCodigoEntrega(''); }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color="#000933" />
              <Text style={s.stageBackText}>Voltar</Text>
            </TouchableOpacity>
            <Text style={s.codeLabel}>Código de entrega</Text>
            <View style={[s.codeHint, { flexDirection: 'row', gap: 8, alignItems: 'flex-start' }]}>
              <Ionicons name="information-circle-outline" size={16} color="#F2760F" style={{ marginTop: 1 }} />
              <Text style={[s.codeHintText, { flex: 1 }]}>
                Peça ao cliente os 4 últimos dígitos do telefone cadastrado e digite abaixo.
              </Text>
            </View>
            <TextInput
              style={s.codeInput}
              placeholder="0000"
              placeholderTextColor="#9099B3"
              keyboardType="numeric"
              maxLength={4}
              value={codigoEntrega}
              onChangeText={setCodigoEntrega}
            />
            <TouchableOpacity
              style={[s.ctaBtn, { marginTop: 12 }, (codigoEntrega.length < 4 || loadingEntrega) && { opacity: 0.5 }]}
              onPress={codigoEntrega.length === 4 ? handleConfirmarEntrega : undefined}
              disabled={codigoEntrega.length < 4 || loadingEntrega}
              activeOpacity={0.85}
            >
              {loadingEntrega ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  <Text style={s.ctaBtnText}>Confirmar entrega · {brl(ride.ganho)}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B0F22', position: 'relative' as const },
  mapBg:    { flex: 1 },

  // Top overlay
  topOverlay: {
    position: 'absolute', top: 52, left: 14, right: 14, zIndex: 20,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  progressCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 18, elevation: 8,
  },
  progressBars: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  progressBar:  { flex: 1, height: 5, borderRadius: 99 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressStep: { fontSize: 10, color: '#9099B3', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  progressLabel:{ fontSize: 15, fontWeight: '700', color: '#000933' },
  progressGanho:{ fontSize: 14, fontWeight: '700', color: '#F2760F' },

  // Turn-by-turn instruction
  instructionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#000933', borderRadius: 14,
    padding: 12, marginTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  instructionIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#209CEF',
    alignItems: 'center', justifyContent: 'center',
  },
  instructionIconUrgent: { backgroundColor: '#F2760F' },
  instructionText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', lineHeight: 18 },
  instructionNext: { fontSize: 11, color: '#9099B3', marginTop: 2 },
  instructionDist: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginLeft: 8, minWidth: 52, textAlign: 'right' },
  instructionDistUrgent: { color: '#F2760F' },

  // Off-route
  offRouteCard: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EF4444', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
    marginTop: 6, alignSelf: 'flex-start',
  },
  offRouteTxt: { fontSize: 12, color: '#fff', fontWeight: '600' },

  // FABs
  fabs: { position: 'absolute', top: 220, right: 14, gap: 8, zIndex: 20 },
  fab:  {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 18, elevation: 6,
  },

  // Bottom sheet
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 18, paddingBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.25, shadowRadius: 30, elevation: 14,
    zIndex: 20,
  },

  // Navigation stats
  navStats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F6F7FB', borderRadius: 14,
    paddingVertical: 10, marginBottom: 14,
  },
  navStat:        { flex: 1, alignItems: 'center' },
  navStatLabel:   { fontSize: 9, color: '#9099B3', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  navStatVal:     { fontSize: 16, fontWeight: '800', color: '#000933', marginTop: 2 },
  navStatDivider: { width: 1, height: 28, backgroundColor: '#E4E7F1' },

  // Stage elements
  stageRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stageIcon:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stagePrimary:{ fontSize: 15, fontWeight: '600', color: '#000933', lineHeight: 20 },
  stageSec:    { fontSize: 12, color: '#9099B3', marginTop: 2 },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#F2760F', borderRadius: 12, paddingVertical: 16,
  },
  ctaBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  stageBackBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginBottom: 14 },
  stageBackText: { fontSize: 13, fontWeight: '600', color: '#000933' },

  codeInfoBox:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF0E3', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  codeInfoLabel: { fontSize: 12, color: '#9099B3', fontWeight: '600', flex: 1 },
  codeInfoValue: { fontSize: 18, fontWeight: '800', color: '#000933', letterSpacing: 6 },

  codeLabel: { fontSize: 11, color: '#9099B3', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  codeHint:  { padding: 12, backgroundColor: '#F6F7FB', borderRadius: 10, marginBottom: 14 },
  codeHintText: { fontSize: 12.5, color: '#000933', lineHeight: 18 },
  codeInput: {
    fontSize: 32, fontWeight: '800', color: '#000933', textAlign: 'center',
    letterSpacing: 12, backgroundColor: '#F6F7FB', borderRadius: 14,
    paddingVertical: 16, borderWidth: 2, borderColor: '#E4E7F1',
  },

  photoBtn: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 24, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed',
    borderColor: '#F2760F', backgroundColor: '#FEF0E3', marginBottom: 12,
  },
  photoBtnText: { fontSize: 14, fontWeight: '700', color: '#F2760F' },
  photoBtnSub:  { fontSize: 11, color: '#9099B3' },
  photoPreview: { height: 160, borderRadius: 14, overflow: 'hidden', marginBottom: 12, position: 'relative' },
  photoImage:   { width: '100%', height: '100%' },
  photoRetake:  {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 99,
  },
  photoRetakeTxt: { fontSize: 11, color: '#fff', fontWeight: '600' },
});
