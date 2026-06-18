import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { EntregadorService } from '../../../../lib/authServices';
import { useAuthEntregadorStore } from '../../auth/model/store';
import { useCorridasRealtime } from '@ajulabs/realtime';
import { haversine } from '@ajulabs/maps';
import { geocode } from '../../corrida-ativa/lib/geocode';
import { useRideAlert } from '../../../../hooks';
import { startIdleTracking, stopIdleTracking } from '../../../../tasks/locationTask';
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const SCREEN_H = Dimensions.get('window').height;
const SHEET_COLLAPSED_H = 150;
const SHEET_EXPANDED_H = Math.round(SCREEN_H * 0.65);
const SHEET_MAX_TRANSLATE = SHEET_EXPANDED_H - SHEET_COLLAPSED_H;

// Module-level sets: survive HomeScreen unmount caused by sub-screen navigation in CourierApp.
// When the user navigates to a profile sub-screen and returns, HomeScreen remounts from scratch
// but these sets are NOT recreated, so dismissed/rejected rides stay filtered out.
const _rejectedRideIds = new Set<string>();
const _dismissedOfferRideIds = new Set<string>();
import { LeafletMap } from '../../../../components/LeafletMap';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtKm = (km: number) => `${km.toFixed(1).replace('.', ',')} km`;

interface RideData {
  id: string;
  loja: {
    nome: string;
    logoUrl?: string;
    endereco: string;
    bairro: string;
    cep?: string;
    lat?: number;
    lng?: number;
  };
  cliente: {
    nome: string;
    telefone?: string;
    endereco: string;
    bairro: string;
    complemento?: string;
    cep?: string;
    lat?: number;
    lng?: number;
  };
  ganho: number;
  distancia: number;
  duracao: number;
  codigo: string;
}

function mapCorridaToRide(raw: any): RideData {
  return {
    id: raw.id,
    loja: {
      nome: raw.loja?.nome ?? '–',
      logoUrl: raw.loja?.logoUrl ?? undefined,
      endereco: raw.loja?.endereco ? `${raw.loja.endereco.rua}, ${raw.loja.endereco.numero}` : '–',
      bairro: raw.loja?.endereco?.bairro ?? '–',
      cep: raw.loja?.endereco?.cep ?? undefined,
      lat: raw.loja?.endereco?.lat ?? undefined,
      lng: raw.loja?.endereco?.lng ?? undefined,
    },
    cliente: {
      nome: raw.consumidor?.nome ?? raw.cliente?.nome ?? 'Cliente',
      telefone: raw.consumidor?.telefone ?? raw.cliente?.telefone ?? undefined,
      endereco: raw.enderecoEntrega
        ? `${raw.enderecoEntrega.rua}, ${raw.enderecoEntrega.numero}`
        : '–',
      bairro: raw.enderecoEntrega?.bairro ?? '–',
      complemento: raw.enderecoEntrega?.complemento ?? undefined,
      cep: raw.enderecoEntrega?.cep ?? undefined,
      lat: raw.enderecoEntrega?.lat ?? undefined,
      lng: raw.enderecoEntrega?.lng ?? undefined,
    },
    ganho: Number(raw.taxaEntrega ?? 0) * 0.8,
    distancia: Number(raw.distanciaKm ?? raw.distancia ?? 0),
    duracao: Number(raw.duracaoMin ?? raw.duracao ?? 20),
    codigo: raw.codigoEntrega ?? raw.id.slice(-4).toUpperCase(),
  };
}

function OfferSheet({
  ride,
  countdown,
  userLocation,
  lojaCoords,
  clienteCoords,
  onAccept,
  onReject,
}: {
  ride: RideData;
  countdown: number;
  userLocation: { lat: number; lng: number } | null;
  lojaCoords: { lat: number; lng: number } | null;
  clienteCoords: { lat: number; lng: number } | null;
  onAccept: () => void;
  onReject: () => void;
}) {
  const expirado = countdown <= 0;
  const pct = expirado ? 100 : (countdown / 15) * 100;
  // Distância do entregador até a loja (coleta) e da loja até o cliente (entrega).
  // Em km; null enquanto as coordenadas ainda estão sendo resolvidas/geocodificadas.
  const pickupKm = userLocation && lojaCoords ? haversine(userLocation, lojaCoords) / 1000 : null;
  const deliveryKm =
    lojaCoords && clienteCoords ? haversine(lojaCoords, clienteCoords) / 1000 : null;
  // Total exibido: soma dos dois trechos quando ambos conhecidos; senão usa o que
  // houver (entrega calculada ou a distância vinda do backend).
  const totalKm =
    pickupKm != null && deliveryKm != null
      ? pickupKm + deliveryKm
      : (deliveryKm ?? (ride.distancia > 0 ? ride.distancia : null));
  return (
    <View style={s.offerSheet}>
      <View style={s.timerTrack}>
        <View
          style={[
            s.timerBar,
            {
              width: `${pct}%` as any,
              backgroundColor: expirado ? '#9099B3' : pct > 40 ? '#F2760F' : '#E14B3C',
            },
          ]}
        />
      </View>

      <View style={s.offerContent}>
        <View style={s.offerHeader}>
          <View style={s.offerTag}>
            <Ionicons name="flash" size={13} color="#F2760F" />
            <Text style={s.offerTagText}>Nova corrida</Text>
          </View>
          <View style={[s.countPill, expirado && s.countPillExpired]}>
            {expirado ? (
              <Text style={s.countPillTextExpired}>Disponível</Text>
            ) : (
              <>
                <View style={s.countDot} />
                <Text style={s.countPillText}>{countdown}s</Text>
              </>
            )}
          </View>
        </View>

        <Text style={s.valueLabel}>Você recebe</Text>
        <Text style={s.valueAmount}>{brl(ride.ganho)}</Text>
        <View style={s.statRow}>
          <View style={s.statPill}>
            <Ionicons name="time-outline" size={14} color="#5A6079" />
            <Text style={s.statPillText}>~{ride.duracao} min</Text>
          </View>
          {totalKm != null && (
            <View style={s.statPill}>
              <Ionicons name="navigate-outline" size={14} color="#5A6079" />
              <Text style={s.statPillText}>{fmtKm(totalKm)} total</Text>
            </View>
          )}
        </View>

        <View style={s.routeCard}>
          <View style={s.routeRow}>
            {ride.loja.logoUrl ? (
              <Image source={{ uri: ride.loja.logoUrl }} style={s.routeLogo} resizeMode="cover" />
            ) : (
              <View style={[s.routeLogo, s.routeLogoFallback]}>
                <Ionicons name="storefront" size={20} color="#000933" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.routeLabel}>Coletar em</Text>
              <Text style={s.routeMain} numberOfLines={1}>
                {ride.loja.nome}
              </Text>
              <Text style={s.routeSub} numberOfLines={1}>
                {ride.loja.endereco} · {ride.loja.bairro}
              </Text>
            </View>
            {pickupKm != null && (
              <View style={s.legDist}>
                <Text style={s.legDistVal}>{fmtKm(pickupKm)}</Text>
                <Text style={s.legDistLabel}>de você</Text>
              </View>
            )}
          </View>
          <View style={s.routeConnector} />
          <View style={s.routeRow}>
            <View style={s.dropPin}>
              <Ionicons name="location" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.routeLabel}>Entregar em</Text>
              <Text style={s.routeMain} numberOfLines={1}>
                {ride.cliente.bairro}
              </Text>
              <Text style={s.routeSub} numberOfLines={1}>
                {ride.cliente.endereco}
              </Text>
            </View>
            {deliveryKm != null && (
              <View style={s.legDist}>
                <Text style={s.legDistVal}>{fmtKm(deliveryKm)}</Text>
                <Text style={s.legDistLabel}>da loja</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity style={s.btnAccept} onPress={onAccept} activeOpacity={0.9}>
          <Text style={s.btnAcceptText}>Aceitar corrida</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={s.btnReject} onPress={onReject} activeOpacity={0.7}>
          <Text style={s.btnRejectText}>Recusar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface HomeScreenProps {
  onAcceptRide: (ride: RideData) => void;
  activeRidesCount?: number;
  online: boolean;
  onToggleOnline: (v: boolean) => void;
  /** True quando a aba "Corridas" está visível. Ao voltar a ficar visível, a tela
   *  atualiza os dados e remonta o mapa (a view nativa colapsa sob display:none). */
  isFocused?: boolean;
}

export function HomeScreen({
  onAcceptRide,
  activeRidesCount = 0,
  online,
  onToggleOnline,
  isFocused = true,
}: HomeScreenProps) {
  const token = useAuthEntregadorStore((s) => s.token);
  const entregadorId = useAuthEntregadorStore((s) => s.entregadorId);
  const [offer, setOffer] = useState<RideData | null>(null);
  // Coordenadas resolvidas da oferta atual (loja/cliente). Usa lat/lng do banco
  // quando há; senão geocodifica o endereço — muitos endereços ainda não têm
  // coordenadas salvas, então sem isso as distâncias não apareceriam.
  const [offerCoords, setOfferCoords] = useState<{
    loja: { lat: number; lng: number } | null;
    cliente: { lat: number; lng: number } | null;
  }>({ loja: null, cliente: null });

  // Alerta sonoro + vibração enquanto há uma oferta na tela (app em foreground).
  // Toca quando a oferta aparece e para assim que ela some (aceita/dispensada/timeout).
  const rideAlert = useRideAlert();
  useEffect(() => {
    if (offer) {
      void rideAlert.start();
    } else {
      void rideAlert.stop();
    }
  }, [offer]);

  // Resolve as coordenadas da oferta para calcular as distâncias de coleta/entrega.
  useEffect(() => {
    if (!offer) {
      setOfferCoords({ loja: null, cliente: null });
      return;
    }
    const lojaStored =
      offer.loja.lat != null && offer.loja.lng != null
        ? { lat: offer.loja.lat, lng: offer.loja.lng }
        : null;
    const clienteStored =
      offer.cliente.lat != null && offer.cliente.lng != null
        ? { lat: offer.cliente.lat, lng: offer.cliente.lng }
        : null;
    // Mostra de imediato o que já temos; geocodifica o que faltar em segundo plano.
    setOfferCoords({ loja: lojaStored, cliente: clienteStored });
    if (lojaStored && clienteStored) return;
    let cancelled = false;
    (async () => {
      const [loja, cliente] = await Promise.all([
        lojaStored ?? geocode(`${offer.loja.endereco}, ${offer.loja.bairro}`, offer.loja.cep),
        clienteStored ??
          geocode(`${offer.cliente.endereco}, ${offer.cliente.bairro}`, offer.cliente.cep),
      ]);
      if (!cancelled) setOfferCoords({ loja, cliente });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer?.id]);
  const [countdown, setCountdown] = useState(15);
  const [ganhoHoje, setGanhoHoje] = useState(0);
  const [corridasHoje, setCorridasHoje] = useState(0);
  const [waitingRides, setWaitingRides] = useState<RideData[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  // Remontado ao reganhar foco para forçar o mapa nativo a re-medir o layout.
  const [mapKey, setMapKey] = useState(0);
  const wasFocused = useRef(isFocused);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const rejectedIds = useRef(_rejectedRideIds);
  const dismissedOfferIds = useRef(_dismissedOfferRideIds);

  const [sheetExpanded, setSheetExpanded] = useState(false);
  const sheetTranslateY = useRef(new Animated.Value(SHEET_MAX_TRANSLATE)).current;
  const sheetIsExpanded = useRef(false);

  const snapSheet = useCallback((expand: boolean) => {
    sheetIsExpanded.current = expand;
    setSheetExpanded(expand);
    Animated.spring(sheetTranslateY, {
      toValue: expand ? 0 : SHEET_MAX_TRANSLATE,
      useNativeDriver: true,
      damping: 22,
      stiffness: 200,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dy) > 5 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderGrant: () => {
        sheetTranslateY.stopAnimation();
      },
      onPanResponderMove: (_, gs) => {
        const base = sheetIsExpanded.current ? 0 : SHEET_MAX_TRANSLATE;
        const next = Math.max(0, Math.min(SHEET_MAX_TRANSLATE, base + gs.dy));
        sheetTranslateY.setValue(next);
      },
      onPanResponderRelease: (_, gs) => {
        const base = sheetIsExpanded.current ? 0 : SHEET_MAX_TRANSLATE;
        const pos = base + gs.dy;
        const shouldExpand = gs.vy < -0.5 || pos < SHEET_MAX_TRANSLATE / 2;
        snapSheet(shouldExpand);
      },
    }),
  ).current;

  const ARACAJU = { lat: -10.9167, lng: -37.05 };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        const sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
          (l) => {
            if (!cancelled) setUserLocation({ lat: l.coords.latitude, lng: l.coords.longitude });
          },
        );
        if (cancelled) {
          try {
            sub.remove();
          } catch {}
        } else {
          locationSubRef.current = sub;
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
      try {
        locationSubRef.current?.remove();
      } catch {}
      locationSubRef.current = null;
    };
  }, []);

  const buscarGanhos = useCallback(async () => {
    if (!token) return;
    const data = await EntregadorService.buscarGanhos(token).catch(() => null);
    if (data) {
      setGanhoHoje(Number(data.semana?.total ?? 0));
      setCorridasHoje(Number(data.semana?.corridas ?? 0));
    }
  }, [token]);

  const buscarCorridas = useCallback(async () => {
    if (!token || !online || activeRidesCount >= 2) return;
    const corridas = await EntregadorService.buscarCorridasDisponiveis(token).catch((err) => {
      console.error('[HomeScreen] buscarCorridasDisponiveis error:', err);
      return [];
    });
    const rides = corridas.map(mapCorridaToRide).filter((r) => !rejectedIds.current.has(r.id));
    setWaitingRides(rides);
    if (!offer) {
      const next = rides.find((r) => !dismissedOfferIds.current.has(r.id));
      if (next) {
        setOffer(next);
        setCountdown(15);
      }
    }
  }, [token, online, offer, activeRidesCount]);

  const toggleOnline = useCallback(
    async (value: boolean) => {
      onToggleOnline(value);
      setOffer(null);
      if (token) {
        await EntregadorService.atualizarOnline(token, value).catch(() => {});
      }
      if (value) {
        buscarGanhos();
        // Inicia foreground service de localização leve (1 min) — permite
        // ao backend ofertar corridas para os entregadores mais próximos
        // mesmo com app em segundo plano. Pare-stop simétrico no offline.
        if (token) {
          startIdleTracking({ token, apiUrl: API_URL }).catch(() => {});
        }
      } else {
        // Ao ficar offline, para o foreground service e limpa os filtros de corridas
        // para que ao voltar online todas as corridas disponíveis reapareçam normalmente.
        stopIdleTracking().catch(() => {});
        _rejectedRideIds.clear();
        _dismissedOfferRideIds.clear();
      }
    },
    [token, buscarGanhos],
  );

  useEffect(() => {
    if (!online) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    buscarCorridas();
    pollRef.current = setInterval(buscarCorridas, 30000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [online, buscarCorridas]);

  // Ao voltar para a aba "Corridas" (oculta → visível): atualiza os dados e
  // remonta o mapa, que colapsa enquanto fica sob display:none em outra aba.
  useEffect(() => {
    if (isFocused && !wasFocused.current) {
      setMapKey((k) => k + 1);
      buscarGanhos();
      buscarCorridas();
    }
    wasFocused.current = isFocused;
  }, [isFocused, buscarGanhos, buscarCorridas]);

  useCorridasRealtime({
    apiUrl: API_URL,
    entregadorId,
    enabled: online && activeRidesCount < 2,
    onOferta: (corrida) => {
      if (!online || activeRidesCount >= 2) return;
      if (rejectedIds.current.has(corrida.id)) return;
      const novo: RideData = {
        id: corrida.id,
        loja: {
          nome: corrida.lojaNome,
          logoUrl: corrida.lojaLogoUrl ?? undefined,
          endereco: corrida.lojaEndereco ?? '',
          bairro: corrida.lojaBairro ?? '',
        },
        cliente: {
          nome: '',
          endereco: corrida.entregaEndereco ?? '',
          bairro: corrida.entregaBairro ?? '',
        },
        ganho: Number(corrida.taxaEntrega ?? 0) * 0.8,
        distancia: 0,
        duracao: 20,
        codigo: corrida.id.slice(-4).toUpperCase(),
      };
      setWaitingRides((prev) => {
        const exists = prev.some((r) => r.id === corrida.id);
        if (exists) return prev;
        return [...prev, novo];
      });
      // Não reabre o popup de uma oferta já dispensada — ela segue na lista de espera.
      if (!dismissedOfferIds.current.has(corrida.id)) {
        setOffer((prev) => prev ?? novo);
        setCountdown(15);
      }
    },
    onAceita: ({ pedidoId }) => {
      // Outro entregador (ou este) pegou a corrida — some da lista na hora e
      // fecha a oferta se for a que está aberta, evitando aceitar algo já tomado.
      rejectedIds.current.add(pedidoId);
      setWaitingRides((prev) => prev.filter((r) => r.id !== pedidoId));
      setOffer((prev) => (prev?.id === pedidoId ? null : prev));
    },
    onCancelada: ({ pedidoId }) => {
      // Lojista cancelou o pedido enquanto ele estava em 'pronto' (corrida já ofertada).
      rejectedIds.current.add(pedidoId);
      setWaitingRides((prev) => prev.filter((r) => r.id !== pedidoId));
      setOffer((prev) => (prev?.id === pedidoId ? null : prev));
    },
  });

  useEffect(() => {
    if (!offer) return;
    // Ao zerar, NÃO recusa automaticamente: a oferta continua exibida para o
    // entregador que perdeu o aviso poder aceitar/recusar quando voltar.
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [offer, countdown]);

  // Trata falha ao aceitar: se foi a corrida que ficou indisponível (já aceita
  // por outro), remove da lista pra não insistir. Se foi rede, mantém pra tentar
  // de novo. Em ambos os casos dá feedback ao entregador (antes só logava).
  const tratarErroAceite = useCallback((rideId: string, err: unknown) => {
    const msg = err instanceof Error ? err.message : '';
    const isNetwork = msg.includes('Network') || msg.includes('fetch') || msg.includes('Failed');
    setAcceptingId(null);
    if (isNetwork) {
      Alert.alert('Sem conexão', 'Não foi possível aceitar agora. Tente novamente.');
      return;
    }
    rejectedIds.current.add(rideId);
    setWaitingRides((prev) => prev.filter((r) => r.id !== rideId));
    setOffer((prev) => (prev?.id === rideId ? null : prev));
    Alert.alert('Corrida indisponível', msg || 'Essa corrida já foi aceita por outro entregador.');
  }, []);

  const handleAccept = useCallback(async () => {
    if (!offer || !token) return;
    const offerId = offer.id;
    try {
      const pedido = await EntregadorService.aceitarCorrida(token, offerId);
      const rideAccepted = mapCorridaToRide(pedido);
      setOffer(null);
      setWaitingRides([]);
      onAcceptRide(rideAccepted);
    } catch (err) {
      tratarErroAceite(offerId, err);
    }
  }, [offer, token, onAcceptRide, tratarErroAceite]);

  const handleAcceptWaiting = useCallback(
    async (ride: RideData) => {
      if (!token) return;
      setAcceptingId(ride.id);
      try {
        const pedido = await EntregadorService.aceitarCorrida(token, ride.id);
        const rideAccepted = mapCorridaToRide(pedido);
        setOffer(null);
        setWaitingRides([]);
        onAcceptRide(rideAccepted);
      } catch (err) {
        tratarErroAceite(ride.id, err);
      }
    },
    [token, onAcceptRide, tratarErroAceite],
  );

  return (
    <SafeAreaView style={s.safeArea}>
      <LeafletMap
        key={mapKey}
        center={userLocation ?? ARACAJU}
        userLocation={userLocation}
        zoom={15}
        style={s.map}
      />

      <View style={s.topBar}>
        <TouchableOpacity
          style={[s.onlineToggle, { backgroundColor: online ? '#39FF89' : '#FFFFFF' }]}
          onPress={() => toggleOnline(!online)}
          activeOpacity={0.85}
        >
          <View
            style={[
              s.onlineIcon,
              { backgroundColor: online ? 'rgba(255,255,255,0.3)' : '#F0F1F5' },
            ]}
          >
            <Ionicons name="power" size={18} color={online ? '#002B12' : '#9099B3'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.onlineTitle, { color: online ? '#002B12' : '#2A3156' }]}>
              {online ? 'Você está online' : 'Você está offline'}
            </Text>
            <Text style={[s.onlineSub, { color: online ? '#046C2E' : '#9099B3' }]}>
              {online ? 'Recebendo corridas' : 'Toque para ficar online'}
            </Text>
          </View>
          <View
            style={[s.toggleTrack, { backgroundColor: online ? 'rgba(0,43,18,0.25)' : '#D0D4E0' }]}
          >
            <View style={[s.toggleThumb, { transform: [{ translateX: online ? 20 : 0 }] }]} />
          </View>
        </TouchableOpacity>
      </View>

      {!online && (
        <TouchableOpacity
          style={s.offlineOverlay}
          onPress={() => toggleOnline(true)}
          activeOpacity={0.8}
        >
          <View style={s.offlineIcon}>
            <Ionicons name="power" size={32} color="#FFFFFF" />
          </View>
          <Text style={s.offlineTitle}>Em standby</Text>
          <Text style={s.offlineSub}>
            Fique <Text style={{ color: '#F2760F', fontWeight: '700' }}>online</Text> pra começar a
            receber corridas.
          </Text>
        </TouchableOpacity>
      )}

      {online && activeRidesCount >= 2 && (
        <View style={s.limitBanner}>
          <Ionicons name="lock-closed" size={16} color="#fff" />
          <Text style={s.limitBannerText}>
            Limite atingido · Finalize uma entrega para receber novas corridas
          </Text>
        </View>
      )}

      {online && !offer && activeRidesCount < 2 && (
        <Animated.View style={[s.bottomPanel, { transform: [{ translateY: sheetTranslateY }] }]}>
          {/* Handle + summary: drag from here or tap to toggle */}
          <View {...sheetPanResponder.panHandlers}>
            <View style={s.sheetHandleRow}>
              <View style={s.sheetHandleBar} />
            </View>

            <TouchableOpacity
              style={s.summarySection}
              onPress={() => snapSheet(!sheetIsExpanded.current)}
              activeOpacity={0.85}
            >
              <View style={s.summaryHeader}>
                <Text style={s.summaryLabel}>Esta semana</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {waitingRides.length > 0 && !sheetExpanded && (
                    <View style={s.waitingBadge}>
                      <Text style={s.waitingBadgeText}>{waitingRides.length}</Text>
                    </View>
                  )}
                  <View style={s.liveBadge}>
                    <View style={s.liveDot} />
                    <Text style={s.liveBadgeText}>Procurando corridas</Text>
                  </View>
                  <Ionicons
                    name={sheetExpanded ? 'chevron-down' : 'chevron-up'}
                    size={14}
                    color="#9099B3"
                  />
                </View>
              </View>
              <View style={s.summaryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.summaryAmount}>{brl(ganhoHoje)}</Text>
                  <Text style={s.summarySub}>Ganho da semana</Text>
                </View>
                <View style={s.dividerV} />
                <View style={s.summaryCol}>
                  <Text style={s.summaryColVal}>{corridasHoje}</Text>
                  <Text style={s.summaryColLabel}>Corridas</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={s.waitingSection}>
            <View style={s.waitingHeader}>
              <Text style={s.waitingTitle}>Entregas em espera</Text>
              {waitingRides.length > 0 && (
                <View style={s.waitingBadge}>
                  <Text style={s.waitingBadgeText}>{waitingRides.length}</Text>
                </View>
              )}
            </View>

            {waitingRides.length === 0 && (
              <Text style={s.waitingEmpty}>Nenhuma entrega disponível agora.</Text>
            )}

            <ScrollView contentContainerStyle={s.waitingList} showsVerticalScrollIndicator={false}>
              {waitingRides.map((ride) => (
                <View key={ride.id} style={s.waitingCard}>
                  <View style={s.waitingCardBody}>
                    <View style={s.waitingRoute}>
                      <View style={s.waitingRouteRow}>
                        <View style={[s.routeDot, { backgroundColor: '#000933' }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.waitingRouteMain}>{ride.loja.nome}</Text>
                          <Text style={s.waitingRouteSub}>{ride.loja.bairro}</Text>
                        </View>
                      </View>
                      <View style={s.routeDash} />
                      <View style={s.waitingRouteRow}>
                        <View style={[s.routeDot, { backgroundColor: '#209CEF' }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.waitingRouteMain}>{ride.cliente.bairro}</Text>
                          <Text style={s.waitingRouteSub}>{ride.cliente.endereco}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={s.waitingCardRight}>
                      <Text style={s.waitingGanho}>{brl(ride.ganho)}</Text>
                      <Text style={s.waitingDuracao}>~{ride.duracao} min</Text>
                      <TouchableOpacity
                        style={[s.btnWaitingAccept, acceptingId === ride.id && { opacity: 0.6 }]}
                        onPress={() => handleAcceptWaiting(ride)}
                        disabled={acceptingId !== null}
                        activeOpacity={0.8}
                      >
                        {acceptingId === ride.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={s.btnWaitingAcceptText}>Aceitar</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      )}

      {offer && (
        <OfferSheet
          ride={offer}
          countdown={countdown}
          userLocation={userLocation}
          lojaCoords={offerCoords.loja}
          clienteCoords={offerCoords.cliente}
          onAccept={handleAccept}
          onReject={() => {
            // Apenas dispensa o popup desta corrida: ela continua em "Entregas em
            // espera" e pode ser aceita pela lista. Não rejeita no backend (o que a
            // removeria das disponíveis) nem some da lista.
            dismissedOfferIds.current.add(offer.id);
            setOffer(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B0F22', position: 'relative' as const },
  map: { flex: 1 },
  topBar: { position: 'absolute', top: 60, left: 14, right: 14, zIndex: 20 },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  toggleTrack: { width: 46, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
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
    zIndex: 20,
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
  offlineTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  offlineSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center', maxWidth: 240 },
  limitBanner: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#B34D00',
    zIndex: 20,
  },
  limitBannerText: { fontSize: 12.5, fontWeight: '600', color: '#fff', flex: 1 },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_EXPANDED_H,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
    zIndex: 20,
  },
  sheetHandleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  sheetHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D4E0',
  },
  summarySection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F7',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#9099B3',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
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
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  summaryAmount: { fontSize: 28, fontWeight: '800', color: '#000933' },
  summarySub: { fontSize: 11, color: '#9099B3', marginTop: 3 },
  dividerV: { width: 1, height: 36, backgroundColor: '#E4E7F1' },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryColVal: { fontSize: 20, fontWeight: '700', color: '#000933' },
  summaryColLabel: { fontSize: 10, color: '#9099B3', marginTop: 4 },
  waitingSection: { flex: 1 },
  waitingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  waitingTitle: { fontSize: 14, fontWeight: '700', color: '#000933' },
  waitingBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: '#F2760F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  waitingEmpty: {
    fontSize: 12,
    color: '#9099B3',
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  waitingList: { paddingHorizontal: 14, paddingBottom: 24 },
  waitingCard: { backgroundColor: '#F8F9FC', borderRadius: 12, padding: 12, marginBottom: 10 },
  waitingCardBody: { flexDirection: 'row', gap: 10 },
  waitingRoute: { flex: 1 },
  waitingRouteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  waitingRouteMain: { fontSize: 13, fontWeight: '600', color: '#000933' },
  waitingRouteSub: { fontSize: 11, color: '#9099B3', marginTop: 1 },
  waitingCardRight: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 },
  waitingGanho: { fontSize: 16, fontWeight: '800', color: '#000933' },
  waitingDuracao: { fontSize: 10, color: '#9099B3' },
  btnWaitingAccept: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F2760F',
    minWidth: 72,
    alignItems: 'center',
  },
  btnWaitingAcceptText: { fontSize: 12, fontWeight: '700', color: '#fff' },
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
    zIndex: 20,
  },
  timerTrack: {
    height: 4,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#E4E7F1',
    overflow: 'hidden',
  },
  timerBar: { height: '100%' },
  offerContent: { padding: 20, paddingTop: 16 },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  offerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF0E3',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 99,
  },
  offerTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F2760F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#000933',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    minWidth: 58,
    justifyContent: 'center',
  },
  countPillExpired: { backgroundColor: '#E6F7ED' },
  countDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#39FF89' },
  countPillText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
  countPillTextExpired: { fontSize: 12.5, fontWeight: '800', color: '#046C2E' },

  valueLabel: { fontSize: 12.5, fontWeight: '600', color: '#9099B3', textAlign: 'center' },
  valueAmount: {
    fontSize: 46,
    fontWeight: '900',
    color: '#000933',
    textAlign: 'center',
    letterSpacing: -1.2,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 20,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F6F7FB',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 99,
  },
  statPillText: { fontSize: 13, fontWeight: '700', color: '#5A6079' },

  routeCard: { backgroundColor: '#F8F9FC', borderRadius: 16, padding: 16, marginBottom: 18 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF' },
  routeLogoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  dropPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#209CEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeConnector: {
    width: 2,
    height: 18,
    backgroundColor: '#D7DBEA',
    marginLeft: 21,
    marginVertical: 5,
    borderRadius: 1,
  },
  routeLabel: {
    fontSize: 10.5,
    color: '#9099B3',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  routeMain: { fontSize: 14.5, fontWeight: '700', color: '#000933', marginTop: 1 },
  routeSub: { fontSize: 12, color: '#9099B3', marginTop: 1 },
  legDist: { alignItems: 'flex-end', marginLeft: 8 },
  legDistVal: { fontSize: 13, fontWeight: '800', color: '#000933' },
  legDistLabel: { fontSize: 10, color: '#9099B3', marginTop: 1 },
  routeDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeDash: {
    borderLeftWidth: 2,
    borderLeftColor: '#E4E7F1',
    borderStyle: 'dashed',
    height: 14,
    marginLeft: 16,
    marginVertical: 4,
  },
  btnAccept: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F2760F',
    borderRadius: 14,
    paddingVertical: 17,
    shadowColor: '#F2760F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  btnAcceptText: { fontSize: 15.5, fontWeight: '800', color: '#FFFFFF' },
  btnReject: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 6 },
  btnRejectText: { fontSize: 14, fontWeight: '700', color: '#9099B3' },
});
