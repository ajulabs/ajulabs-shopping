import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { haversine, nearestIdx } from '../utils/geo';
import { fetchOsrmFull } from '../utils/osrm';
import type { NavStep } from '@ajulabs/types';

export type { NavStep };

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
): NavState {
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

  const routeCoordsRef  = useRef<{ lat: number; lng: number }[]>([]);
  const stepsRef        = useRef<NavStep[]>([]);
  const stepIdxRef      = useRef(0);
  const progressIdxRef  = useRef(0);
  const destRef         = useRef(destination);
  const fetchKeyRef     = useRef('');
  const fetchingRef     = useRef(false);

  destRef.current = destination;

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
      fetchKeyRef.current = '';
    } finally {
      fetchingRef.current = false;
    }
  }, []);

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

          if (coords.length === 0) {
            fetchRoute(pos);
            return;
          }

          const { idx: nearIdx, dist: nearDist } = nearestIdx(pos, coords, progressIdxRef.current);
          if (nearDist > 80) {
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
            if (dToStep < 25 && sIdx + 1 < steps.length) {
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
        }
      );
    })();

    return () => { sub?.remove(); };
  }, [active, fetchRoute]);

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
  };
}
