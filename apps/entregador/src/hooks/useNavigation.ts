import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';

export interface NavStep {
  instruction: string;
  distance: number;    // metros até a manobra
  duration: number;    // segundos estimados desta etapa
  modifier?: string;   // 'left', 'right', 'straight', etc.
  location: { lat: number; lng: number };
}

export interface NavState {
  userLocation: { lat: number; lng: number } | null;
  heading: number;
  speedKmh: number;
  routeCoords: { lat: number; lng: number }[];
  steps: NavStep[];
  currentStep: NavStep | null;
  nextStep: NavStep | null;
  distanceToStep: number;
  etaSeconds: number;
  distanceRemaining: number;
  isOffRoute: boolean;
  routeReady: boolean;
}

// ── Haversine ─────────────────────────────────────────────
function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const φ1 = a.lat * Math.PI / 180;
  const φ2 = b.lat * Math.PI / 180;
  const Δφ = (b.lat - a.lat) * Math.PI / 180;
  const Δλ = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// ── OSRM instruction builder ───────────────────────────────
function buildInstruction(type: string, modifier?: string, name?: string): string {
  const street = name && name.trim() !== '' ? ` em ${name}` : '';
  if (type === 'depart') return `Siga${street}`;
  if (type === 'arrive') return 'Você chegou ao destino';
  if (type === 'roundabout' || type === 'rotary') return `Entre na rotatória${street}`;
  if (type === 'merge') return `Mescle${street}`;
  if (type === 'on ramp') return `Acesse a rampa${street}`;
  if (type === 'off ramp') return `Saia pela rampa${street}`;
  const map: Record<string, string> = {
    'left':        'Vire à esquerda',
    'right':       'Vire à direita',
    'straight':    'Siga em frente',
    'slight left': 'Mantenha à esquerda',
    'slight right':'Mantenha à direita',
    'sharp left':  'Curva acentuada à esquerda',
    'sharp right': 'Curva acentuada à direita',
    'uturn':       'Faça retorno',
  };
  return (map[modifier ?? ''] ?? 'Continue') + street;
}

// ── OSRM API call ──────────────────────────────────────────
async function fetchOsrmFull(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson&steps=true`;

  const res = await fetch(url);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('Rota não encontrada');

  const coords: { lat: number; lng: number }[] =
    (route.geometry.coordinates as number[][]).map(c => ({ lat: c[1], lng: c[0] }));

  const steps: NavStep[] = [];
  for (const leg of route.legs ?? []) {
    for (const step of leg.steps ?? []) {
      steps.push({
        instruction: buildInstruction(step.maneuver.type, step.maneuver.modifier, step.name),
        distance: step.distance,
        duration: step.duration,
        modifier: step.maneuver.modifier,
        location: { lat: step.maneuver.location[1], lng: step.maneuver.location[0] },
      });
    }
  }

  return {
    coords,
    steps,
    totalDuration: route.duration as number,
    totalDistance: route.distance as number,
  };
}

// ── Nearest route coord (efficient search) ─────────────────
function nearestIdx(
  pos: { lat: number; lng: number },
  coords: { lat: number; lng: number }[],
  fromIdx: number,
): { idx: number; dist: number } {
  const start = Math.max(0, fromIdx - 5);
  const end = Math.min(coords.length - 1, fromIdx + 60);
  let bestIdx = fromIdx;
  let bestDist = Infinity;
  for (let i = start; i <= end; i++) {
    const d = haversine(pos, coords[i]);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  }
  return { idx: bestIdx, dist: bestDist };
}

// ── Hook ───────────────────────────────────────────────────
export function useNavigation(
  destination: { lat: number; lng: number } | null,
  active: boolean,
) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading]           = useState(0);
  const [speedKmh, setSpeedKmh]         = useState(0);
  const [routeCoords, setRouteCoords]   = useState<{ lat: number; lng: number }[]>([]);
  const [steps, setSteps]               = useState<NavStep[]>([]);
  const [stepIdx, setStepIdx]           = useState(0);
  const [distanceToStep, setDistanceToStep]   = useState(0);
  const [etaSeconds, setEtaSeconds]           = useState(0);
  const [distanceRemaining, setDistanceRemaining] = useState(0);
  const [isOffRoute, setIsOffRoute]     = useState(false);
  const [routeReady, setRouteReady]     = useState(false);

  // Refs — accessed inside GPS callback without stale closure
  const routeCoordsRef  = useRef<{ lat: number; lng: number }[]>([]);
  const stepsRef        = useRef<NavStep[]>([]);
  const stepIdxRef      = useRef(0);
  const progressIdxRef  = useRef(0);
  const destRef         = useRef(destination);
  const fetchKeyRef     = useRef('');
  const fetchingRef     = useRef(false);

  destRef.current = destination;

  // ── Fetch / refetch route ────────────────────────────────
  const fetchRoute = useCallback(async (from: { lat: number; lng: number }) => {
    const dest = destRef.current;
    if (!dest || fetchingRef.current) return;

    const key = `${from.lat.toFixed(3)},${from.lng.toFixed(3)}|${dest.lat},${dest.lng}`;
    if (key === fetchKeyRef.current) return;
    fetchKeyRef.current = key;
    fetchingRef.current = true;

    try {
      const result = await fetchOsrmFull(from, dest);

      routeCoordsRef.current = result.coords;
      stepsRef.current       = result.steps;
      stepIdxRef.current     = 0;
      progressIdxRef.current = 0;

      setRouteCoords(result.coords);
      setSteps(result.steps);
      setStepIdx(0);
      setEtaSeconds(result.totalDuration);
      setDistanceRemaining(result.totalDistance);
      setDistanceToStep(result.steps[0]?.distance ?? 0);
      setIsOffRoute(false);
      setRouteReady(true);
    } catch (err) {
      console.warn('[useNavigation] fetchRoute:', err);
      fetchKeyRef.current = ''; // allow retry
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // ── GPS watch ────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 1000,
        },
        (loc) => {
          const pos  = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          const hdg  = Math.max(0, loc.coords.heading ?? 0);
          const spd  = Math.max(0, (loc.coords.speed ?? 0) * 3.6);

          setUserLocation(pos);
          setHeading(hdg);
          setSpeedKmh(spd);

          const coords = routeCoordsRef.current;
          const steps  = stepsRef.current;

          // First fix: fetch route immediately
          if (coords.length === 0) {
            fetchRoute(pos);
            return;
          }

          // Off-route detection
          const { idx: nearIdx, dist: nearDist } = nearestIdx(pos, coords, progressIdxRef.current);
          if (nearDist > 80) {
            setIsOffRoute(true);
            fetchKeyRef.current = '';
            fetchRoute(pos);
            return;
          }

          progressIdxRef.current = nearIdx;

          // Advance step when within 25m of the maneuver point
          const sIdx = stepIdxRef.current;
          if (steps.length > sIdx) {
            const dToStep = haversine(pos, steps[sIdx].location);
            setDistanceToStep(dToStep);
            if (dToStep < 25 && sIdx + 1 < steps.length) {
              stepIdxRef.current = sIdx + 1;
              setStepIdx(sIdx + 1);
            }
          }

          // Update ETA from remaining steps
          const currentSIdx = stepIdxRef.current;
          const remainingEta = steps.slice(currentSIdx).reduce((a, s) => a + s.duration, 0);
          setEtaSeconds(remainingEta);

          // Straight-line distance to destination as distance remaining indicator
          if (destRef.current) {
            setDistanceRemaining(haversine(pos, destRef.current));
          }
        }
      );
    })();

    return () => { sub?.remove(); };
  }, [active, fetchRoute]);

  // Refetch when destination changes and we have a position
  useEffect(() => {
    if (destination && userLocation) {
      fetchKeyRef.current = '';
      fetchRoute(userLocation);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination?.lat, destination?.lng]);

  return {
    userLocation,
    heading,
    speedKmh,
    routeCoords,
    steps,
    currentStep: steps[stepIdx] ?? null,
    nextStep:    steps[stepIdx + 1] ?? null,
    distanceToStep,
    etaSeconds,
    distanceRemaining,
    isOffRoute,
    routeReady,
  } as NavState;
}
