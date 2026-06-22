import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Animated, PanResponder, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import { useCorridasRealtime } from '@ajulabs/realtime';
import { type Ride, mapToRide } from '../../../../entities/corrida';
import { EntregadorService } from '../../../../shared/lib/authServices';
import { useAuthEntregadorStore } from '../../../../store';
import { geocode } from '../../../../shared/lib/geocode';
import { useRideAlert } from '../../../../shared/hooks';
import { startIdleTracking, stopIdleTracking } from '../../../../shared/lib/locationTask';

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

const ARACAJU = { lat: -10.9167, lng: -37.05 };

interface UseHomeArgs {
  onAcceptRide: (ride: Ride) => void;
  activeRidesCount: number;
  online: boolean;
  onToggleOnline: (v: boolean) => void;
  isFocused: boolean;
}

export function useHome({
  onAcceptRide,
  activeRidesCount,
  online,
  onToggleOnline,
  isFocused,
}: UseHomeArgs) {
  const token = useAuthEntregadorStore((s) => s.token);
  const entregadorId = useAuthEntregadorStore((s) => s.entregadorId);
  const [offer, setOffer] = useState<Ride | null>(null);
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
  const [waitingRides, setWaitingRides] = useState<Ride[]>([]);
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
    const rides = corridas.map(mapToRide).filter((r) => !rejectedIds.current.has(r.id));
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
      const novo: Ride = {
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
        ganho: Number(corrida.taxaEntrega ?? 0),
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
      const rideAccepted = mapToRide(pedido);
      setOffer(null);
      setWaitingRides([]);
      onAcceptRide(rideAccepted);
    } catch (err) {
      tratarErroAceite(offerId, err);
    }
  }, [offer, token, onAcceptRide, tratarErroAceite]);

  const handleAcceptWaiting = useCallback(
    async (ride: Ride) => {
      if (!token) return;
      setAcceptingId(ride.id);
      try {
        const pedido = await EntregadorService.aceitarCorrida(token, ride.id);
        const rideAccepted = mapToRide(pedido);
        setOffer(null);
        setWaitingRides([]);
        onAcceptRide(rideAccepted);
      } catch (err) {
        tratarErroAceite(ride.id, err);
      }
    },
    [token, onAcceptRide, tratarErroAceite],
  );

  // Dispensa o popup desta corrida: ela continua em "Entregas em espera" e pode
  // ser aceita pela lista. Não rejeita no backend nem some da lista.
  const dismissOffer = useCallback(() => {
    setOffer((prev) => {
      if (prev) dismissedOfferIds.current.add(prev.id);
      return null;
    });
  }, []);

  return {
    offer,
    offerCoords,
    countdown,
    ganhoHoje,
    corridasHoje,
    waitingRides,
    acceptingId,
    userLocation,
    mapKey,
    aracaju: ARACAJU,
    sheetExpanded,
    sheetTranslateY,
    sheetIsExpanded,
    sheetPanResponder,
    snapSheet,
    toggleOnline,
    handleAccept,
    handleAcceptWaiting,
    dismissOffer,
  };
}
