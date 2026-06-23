import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as ImagePicker from 'expo-image-picker';
import { EntregadorService } from '../../../../shared/lib/authServices';
import { useLocationEmitter, useCorridaAtivaRealtime } from '@ajulabs/realtime';
import { useAuthEntregadorStore } from '../../../../store';
import {
  startBackgroundTracking,
  stopBackgroundTracking,
  stopIdleTracking,
} from '../../../../shared/lib/locationTask';
import { STAGES, type Stage, type ActiveRide } from './types';
import { geocode } from '../../../../shared/lib/geocode';
import { useRideNavigation } from '../hooks/useRideNavigation';
import type { MotivoCancelamento } from '../ui/components/CancelCorridaModal';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// Raio (m) para considerar o entregador "chegou" ao destino da etapa.
const ARRIVAL_RADIUS = 50;

// Tag do lock de keep-awake: mantém a tela ligada durante a navegação interna.
const KEEP_AWAKE_TAG = 'corrida-navegacao';

interface UseActiveRideArgs {
  ride: ActiveRide;
  initialStage?: Stage;
  onFinish: () => void;
}

export function useActiveRide({ ride, initialStage, onFinish }: UseActiveRideArgs) {
  const token = useAuthEntregadorStore((s) => s.token);
  const entregadorId = useAuthEntregadorStore((s) => s.entregadorId);
  const [stage, setStage] = useState<Stage>(initialStage ?? 'to-store');
  const idx = STAGES.indexOf(stage);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loadingRetirada, setLoadingRetirada] = useState(false);
  const [loadingCancelamento, setLoadingCancelamento] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [codigoEntrega, setCodigoEntrega] = useState('');
  const [loadingEntrega, setLoadingEntrega] = useState(false);
  const [entregaError, setEntregaError] = useState<string | null>(null);
  const [sucessoVisivel, setSucessoVisivel] = useState(false);
  const [cancelamentoConfirmado, setCancelamentoConfirmado] = useState<MotivoCancelamento | null>(
    null,
  );

  const [storeCoords, setStoreCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [clientCoords, setClientCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodeDone, setGeocodeDone] = useState(false);

  const [navMode, setNavMode] = useState<'internal' | 'external' | null>(null);
  const [navChoiceOpen, setNavChoiceOpen] = useState(false);
  const [extNavUrl, setExtNavUrl] = useState<string | null>(null);
  const extNavTypeRef = useRef<'gmaps' | 'waze'>('gmaps');

  const runGeocode = useCallback(async () => {
    setGeocodeDone(false);
    const storedStore =
      ride.loja.lat != null && ride.loja.lng != null
        ? { lat: ride.loja.lat, lng: ride.loja.lng }
        : null;
    const storedClient =
      ride.cliente.lat != null && ride.cliente.lng != null
        ? { lat: ride.cliente.lat, lng: ride.cliente.lng }
        : null;
    const [sc, cc] = await Promise.all([
      storedStore ?? geocode(`${ride.loja.endereco}, ${ride.loja.bairro}`, ride.loja.cep),
      storedClient ?? geocode(`${ride.cliente.endereco}, ${ride.cliente.bairro}`, ride.cliente.cep),
    ]);
    setStoreCoords(sc);
    setClientCoords(cc);
    setGeocodeDone(true);
  }, [
    ride.loja.endereco,
    ride.loja.bairro,
    ride.loja.cep,
    ride.loja.lat,
    ride.loja.lng,
    ride.cliente.endereco,
    ride.cliente.bairro,
    ride.cliente.cep,
    ride.cliente.lat,
    ride.cliente.lng,
  ]);

  useEffect(() => {
    runGeocode();
  }, []);

  const prevStageRef = useRef<Stage>(stage);
  useEffect(() => {
    const prev = prevStageRef.current;
    prevStageRef.current = stage;
    const destinoDe = (st: Stage) =>
      st === 'to-store' || st === 'at-store' ? 'loja' : st === 'to-customer' ? 'cliente' : null;
    const prevDest = destinoDe(prev);
    const newDest = destinoDe(stage);
    if (newDest && prevDest && newDest !== prevDest) {
      setNavMode(null);
      setNavChoiceOpen(false);
      setExtNavUrl(null);
    }
  }, [stage]);

  const isMoving = stage === 'to-store' || stage === 'to-customer';

  const destination =
    stage === 'to-store' ? storeCoords : stage === 'to-customer' ? clientCoords : null;

  const destName = stage === 'to-store' ? ride.loja.nome : ride.cliente.nome;
  const destAddress =
    stage === 'to-store'
      ? `${ride.loja.endereco}, ${ride.loja.bairro}`
      : `${ride.cliente.endereco}${ride.cliente.complemento ? ` · ${ride.cliente.complemento}` : ''}`;
  // Rótulo do destino da etapa, para o título contextual do modal de navegação.
  const destLabel = stage === 'to-store' ? 'a loja' : 'o cliente';

  const showNavChoiceModal =
    isMoving && geocodeDone && !!destination && (navMode === null || navChoiceOpen);

  const handleOpenExternalNav = useCallback(
    async (type: 'gmaps' | 'waze') => {
      extNavTypeRef.current = type;
      setNavMode('external');
      setNavChoiceOpen(false);

      let origin: string | null = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          origin = `${loc.coords.latitude},${loc.coords.longitude}`;
        }
      } catch {}

      const dest = destination!;
      let url: string;

      if (type === 'gmaps') {
        const params = new URLSearchParams({
          api: '1',
          destination: `${dest.lat},${dest.lng}`,
          travelmode: 'driving',
        });
        if (origin) params.set('origin', origin);
        url = `https://www.google.com/maps/dir/?${params}`;
      } else {
        url = `https://waze.com/ul?ll=${dest.lat},${dest.lng}&navigate=yes`;
        if (origin) {
          const [lat, lng] = origin.split(',');
          url += `&from=lat:${lat} lng:${lng}`;
        }
      }

      setExtNavUrl(url);
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert('Erro', 'Não foi possível abrir o aplicativo de navegação.');
      }
    },
    [destination],
  );

  const handleReopenExtNav = useCallback(() => {
    if (extNavUrl) Linking.openURL(extNavUrl).catch(() => {});
  }, [extNavUrl]);

  const {
    userLocation: navUserLocation,
    routeCoords,
    progressIdx,
    currentStep,
    nextStep,
    distanceToStep,
    distanceRemaining,
    etaSeconds,
    speedKmh,
    heading,
    isOffRoute,
    navigationStarted,
    centerTrigger,
    fitTrigger,
    centerMap,
  } = useRideNavigation({
    destination,
    enabled: isMoving && !!destination && navMode === 'internal',
  });

  const isNavigating = isMoving && navigationStarted;

  // Localização em foreground usada para emitir a posição quando a navegação
  // interna ainda não está provendo (antes de o entregador escolher o mapa, ou
  // ao usar navegação externa). Sem isso, consumidor e lojista só veriam o
  // entregador depois que ele abrisse o mapa interno.
  const [coarseLocation, setCoarseLocation] = useState<{
    lat: number;
    lng: number;
    heading?: number;
    speedKmh?: number;
  } | null>(null);

  // Mantém a tela ligada enquanto o entregador navega pelo mapa interno. Sem
  // isso o celular entra em modo ocioso e apaga a tela durante a rota (a loja
  // ou o cliente), atrapalhando o acompanhamento das instruções.
  useEffect(() => {
    if (!(isMoving && navMode === 'internal')) return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [isMoving, navMode]);

  // Observa o GPS em foreground enquanto a corrida está em deslocamento e a
  // navegação interna não está ativa. Roda desde o aceite (etapa "to-store"),
  // garantindo que consumidor e lojista acompanhem o entregador de imediato,
  // independente de ele escolher mapa interno ou externo.
  useEffect(() => {
    if (!isMoving || navMode === 'internal') {
      setCoarseLocation(null);
      return;
    }
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 15 },
          (l) => {
            if (cancelled) return;
            setCoarseLocation({
              lat: l.coords.latitude,
              lng: l.coords.longitude,
              heading: l.coords.heading ?? undefined,
              speedKmh:
                l.coords.speed != null && l.coords.speed >= 0 ? l.coords.speed * 3.6 : undefined,
            });
          },
        );
      } catch {
        /* sem permissão/erro de GPS: o emissor apenas não envia */
      }
    })();
    return () => {
      cancelled = true;
      try {
        sub?.remove();
      } catch {}
    };
  }, [isMoving, navMode]);

  useEffect(() => {
    if (stage === 'delivered') {
      stopBackgroundTracking();
      return;
    }
    // Para o tracking idle (leve, 1 min) e inicia o pesado (5s) durante
    // a corrida ativa. Os dois tasks não devem rodar simultaneamente.
    stopIdleTracking().catch(() => {});
    startBackgroundTracking({ pedidoId: ride.id, apiUrl: API_URL });
    return () => {
      stopBackgroundTracking();
    };
    // Depende de `stage` (para parar ao entregar) e de `ride.id` (para não
    // continuar rastreando o pedido antigo ao alternar entre 2 corridas ativas).
  }, [stage, ride.id]);

  useLocationEmitter({
    apiUrl: API_URL,
    pedidoId: ride.id,
    entregadorId,
    location: navUserLocation
      ? { lat: navUserLocation.lat, lng: navUserLocation.lng, heading, speedKmh }
      : coarseLocation,
    enabled: isMoving,
    intervalMs: 5000,
  });

  // Sai da tela ativa imediatamente quando o pedido é cancelado pelo lojista ou
  // pelo próprio entregador em outro dispositivo. Sem isso o entregador continua
  // dirigindo e só descobre o cancelamento ao bater num 404 em confirmarRetirada.
  useCorridaAtivaRealtime({
    apiUrl: API_URL,
    entregadorId,
    pedidoId: ride.id,
    enabled: stage !== 'delivered',
    onCancelada: () => {
      Alert.alert(
        'Corrida cancelada',
        'Este pedido foi cancelado e não está mais disponível para entrega.',
        [{ text: 'OK', onPress: onFinish }],
      );
    },
  });

  const advanceStage = useCallback(() => {
    const next = STAGES[idx + 1];
    if (next) setStage(next);
  }, [idx]);

  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Permita o acesso à câmera para tirar a foto do produto.',
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  }, []);

  const handleCancelarCorrida = useCallback(() => {
    setCancelModalVisible(true);
  }, []);

  const handleConfirmarCancelamento = useCallback(
    async (motivo: MotivoCancelamento, fotoUri: string) => {
      if (!token) return;
      setLoadingCancelamento(true);
      try {
        await EntregadorService.cancelarCorrida(token, ride.id, motivo, fotoUri);
        setCancelModalVisible(false);
        setCancelamentoConfirmado(motivo);
      } catch (err: any) {
        Alert.alert('Erro', err?.message ?? 'Não foi possível cancelar a corrida.');
      } finally {
        setLoadingCancelamento(false);
      }
    },
    [token, ride.id],
  );

  const handleConfirmarRetirada = useCallback(async () => {
    if (!token) return;
    setLoadingRetirada(true);
    try {
      await EntregadorService.confirmarRetirada(token, ride.id);
      setStage('to-customer');
    } catch {
      Alert.alert('Erro', 'Não foi possível confirmar a retirada. Tente novamente.');
    } finally {
      setLoadingRetirada(false);
    }
  }, [token, ride.id]);

  const handleConfirmarEntrega = useCallback(async () => {
    if (!token || codigoEntrega.length < 4) return;
    setLoadingEntrega(true);
    setEntregaError(null);
    try {
      await EntregadorService.confirmarEntrega(token, ride.id, codigoEntrega);
      setSucessoVisivel(true);
    } catch (err: any) {
      const msg = err?.message?.includes('incorreto')
        ? 'Código incorreto. Confira os 4 últimos dígitos do telefone com o cliente.'
        : 'Não foi possível confirmar. Verifique sua conexão e tente novamente.';
      setEntregaError(msg);
    } finally {
      setLoadingEntrega(false);
    }
  }, [token, ride.id, codigoEntrega]);

  // Desenha só o trecho à frente: começa na posição atual do entregador e segue
  // até o destino, "apagando" o rastro já percorrido conforme ele avança.
  const remainingRoute = useMemo(() => {
    if (routeCoords.length < 2) return undefined;
    if (!navUserLocation) return routeCoords;
    const head = { lat: navUserLocation.lat, lng: navUserLocation.lng };
    const rest = routeCoords.slice(progressIdx + 1);
    if (rest.length < 1) return [head, routeCoords[routeCoords.length - 1]];
    return [head, ...rest];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCoords, progressIdx, navUserLocation?.lat, navUserLocation?.lng]);
  // "Chegou" (< ARRIVAL_RADIUS) tem prioridade sobre "está chegando" (até 150 m).
  const hasArrived =
    navigationStarted && distanceRemaining > 0 && distanceRemaining < ARRIVAL_RADIUS;
  const isArrivingSoon =
    navigationStarted && distanceRemaining >= ARRIVAL_RADIUS && distanceRemaining < 150;
  // Geocode falhou para o destino da etapa atual.
  const geocodeError = geocodeDone && !destination;

  return {
    stage,
    idx,
    setStage,
    photoUri,
    loadingRetirada,
    loadingCancelamento,
    cancelModalVisible,
    setCancelModalVisible,
    codigoEntrega,
    setCodigoEntrega,
    loadingEntrega,
    entregaError,
    setEntregaError,
    sucessoVisivel,
    cancelamentoConfirmado,
    navMode,
    setNavMode,
    setNavChoiceOpen,
    extNavTypeRef,
    runGeocode,
    isMoving,
    destination,
    destName,
    destAddress,
    destLabel,
    showNavChoiceModal,
    handleOpenExternalNav,
    handleReopenExtNav,
    navUserLocation,
    currentStep,
    nextStep,
    distanceToStep,
    distanceRemaining,
    etaSeconds,
    speedKmh,
    heading,
    isOffRoute,
    navigationStarted,
    centerTrigger,
    fitTrigger,
    centerMap,
    isNavigating,
    advanceStage,
    handleTakePhoto,
    handleCancelarCorrida,
    handleConfirmarCancelamento,
    handleConfirmarRetirada,
    handleConfirmarEntrega,
    remainingRoute,
    hasArrived,
    isArrivingSoon,
    geocodeError,
  };
}
