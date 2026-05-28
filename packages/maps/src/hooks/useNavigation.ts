import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { haversine, nearestIdx } from '../utils/geo';
import { fetchOsrmFull } from '../utils/osrm';
import type { NavStep } from '@ajulabs/types';

export type { NavStep };

export interface NavigationConfig {
  /** GPS accuracy. 'high' = BestForNavigation (default). 'balanced' saves battery. */
  accuracyMode?: 'high' | 'balanced';
  /** Min distance (meters) between GPS samples. Default: 5. Increase to save battery. */
  distanceInterval?: number;
  /** Min time (ms) between GPS samples. Default: 1000. Increase to save battery. */
  timeInterval?: number;
  /** Distance (meters) to consider off-route. Default: 80. */
  offRouteThreshold?: number;
  /** Distance (meters) to advance to next step. Default: 25. */
  stepAdvanceDistance?: number;
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

export function useNavigation(
  destination: { lat: number; lng: number } | null,
  active: boolean,
  config?: NavigationConfig,
): NavState {
  const {
    accuracyMode = 'high',
    distanceInterval = 5,
    timeInterval = 1000,
    offRouteThreshold = 80,
    stepAdvanceDistance = 25,
  } = config ?? {};
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [routeCoords, setRouteCoords] = useState<{ lat: number; lng: number }[]>([]);
  const [steps, setSteps] = useState<NavStep[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [distanceToStep, setDistanceToStep] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState(0);
  const [distanceRemaining, setDistanceRemaining] = useState(0);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [routeReady, setRouteReady] = useState(false);

  const routeCoordsRef = useRef<{ lat: number; lng: number }[]>([]);
  const stepsRef = useRef<NavStep[]>([]);
  const stepIdxRef = useRef(0);
  const progressIdxRef = useRef(0);
  const destRef = useRef(destination);
  const fetchKeyRef = useRef('');
  const fetchingRef = useRef(false);
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const routeReadyRef = useRef(false);

  destRef.current = destination;
  routeReadyRef.current = routeReady;

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
      stepsRef.current = result.steps;
      stepIdxRef.current = 0;
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
      fetchKeyRef.current = '';
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const navSubRef = useRef<Location.LocationSubscription | null>(null);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;

        const sub = await Location.watchPositionAsync(
          {
            accuracy:
              accuracyMode === 'high'
                ? Location.Accuracy.BestForNavigation
                : Location.Accuracy.Balanced,
            distanceInterval,
            timeInterval,
          },
          (loc) => {
            const pos = { lat: loc.coords.latitude, lng: loc.coords.longitude };
            const hdg = Math.max(0, loc.coords.heading ?? 0);
            const spd = Math.max(0, (loc.coords.speed ?? 0) * 3.6);

            setUserLocation(pos);
            userLocationRef.current = pos;
            setHeading(hdg);
            setSpeedKmh(spd);

            const coords = routeCoordsRef.current;
            const steps = stepsRef.current;

            if (coords.length === 0) {
              fetchRoute(pos);
              return;
            }

            const { idx: nearIdx, dist: nearDist } = nearestIdx(
              pos,
              coords,
              progressIdxRef.current,
            );
            if (nearDist > offRouteThreshold) {
              setIsOffRoute(true);
              fetchKeyRef.current = '';
              fetchRoute(pos);
              return;
            }

            progressIdxRef.current = nearIdx;
            setIsOffRoute(false);

            const sIdx = stepIdxRef.current;
            if (steps.length > sIdx) {
              const dToStep = haversine(pos, steps[sIdx].location);
              setDistanceToStep(dToStep);
              if (dToStep < stepAdvanceDistance && sIdx + 1 < steps.length) {
                stepIdxRef.current = sIdx + 1;
                setStepIdx(sIdx + 1);
              }
            }

            const currentSIdx = stepIdxRef.current;
            const remainingEta = steps.slice(currentSIdx).reduce((a, s) => a + s.duration, 0);
            setEtaSeconds(remainingEta);

            if (destRef.current) {
              setDistanceRemaining(haversine(pos, destRef.current));
            }
          },
        );
        if (cancelled) {
          try {
            sub.remove();
          } catch {}
        } else {
          navSubRef.current = sub;
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
      try {
        navSubRef.current?.remove();
      } catch {}
      navSubRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, fetchRoute, accuracyMode, distanceInterval, timeInterval]);

  useEffect(() => {
    if (destination && userLocation) {
      fetchKeyRef.current = '';
      fetchRoute(userLocation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination?.lat, destination?.lng]);

  // Retry route every 8 s when not yet ready — handles desktop browsers where
  // watchPosition only fires once (user not moving) and OSRM may time out.
  useEffect(() => {
    if (!active || routeReady) return;
    const id = setInterval(() => {
      if (routeReadyRef.current) return;
      const pos = userLocationRef.current;
      if (!pos || !destRef.current) return;
      fetchKeyRef.current = '';
      fetchRoute(pos);
    }, 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, routeReady, fetchRoute]);

  return {
    userLocation,
    heading,
    speedKmh,
    routeCoords,
    steps,
    currentStep: steps[stepIdx] ?? null,
    nextStep: steps[stepIdx + 1] ?? null,
    distanceToStep,
    etaSeconds,
    distanceRemaining,
    isOffRoute,
    routeReady,
  };
}
