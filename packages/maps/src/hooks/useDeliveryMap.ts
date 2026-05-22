import { useEffect, useRef } from 'react';
import { useNavigation } from './useNavigation';
import type { NavState, NavigationConfig } from './useNavigation';

export interface UseDeliveryMapOptions {
  /** Destination to navigate to (store or customer). */
  destination: { lat: number; lng: number } | null;
  /** Whether GPS tracking is active. */
  active?: boolean;
  /**
   * Called whenever the entregador's location changes.
   * Use this to feed useLocationEmitter from @ajulabs/realtime.
   */
  onLocationChange?: (location: {
    lat: number;
    lng: number;
    heading: number;
    speedKmh: number;
  }) => void;
  /**
   * Battery saving mode. When true, uses lower GPS accuracy and
   * larger polling intervals to reduce battery drain.
   * Trade-off: ~2-3s position lag vs. ~40% less GPS power usage.
   */
  batteryMode?: boolean;
  /** Override individual GPS config values. Takes priority over batteryMode. */
  config?: NavigationConfig;
}

export interface DeliveryMapState extends NavState {
  /** Ready-to-use location object for useLocationEmitter. Null until first GPS fix. */
  locationForEmitter: { lat: number; lng: number; heading: number; speedKmh: number } | null;
}

const BATTERY_CONFIG: NavigationConfig = {
  accuracyMode: 'balanced',
  distanceInterval: 15,
  timeInterval: 3000,
  offRouteThreshold: 100,
  stepAdvanceDistance: 30,
};

const HIGH_CONFIG: NavigationConfig = {
  accuracyMode: 'high',
  distanceInterval: 5,
  timeInterval: 1000,
  offRouteThreshold: 80,
  stepAdvanceDistance: 25,
};

export function useDeliveryMap({
  destination,
  active = true,
  onLocationChange,
  batteryMode = false,
  config,
}: UseDeliveryMapOptions): DeliveryMapState {
  const resolvedConfig = config ?? (batteryMode ? BATTERY_CONFIG : HIGH_CONFIG);
  const nav = useNavigation(destination, active, resolvedConfig);

  const prevLocKeyRef = useRef('');
  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;

  useEffect(() => {
    if (!nav.userLocation || !onLocationChangeRef.current) return;
    const key = `${nav.userLocation.lat.toFixed(5)},${nav.userLocation.lng.toFixed(5)}`;
    if (key === prevLocKeyRef.current) return;
    prevLocKeyRef.current = key;

    onLocationChangeRef.current({
      lat: nav.userLocation.lat,
      lng: nav.userLocation.lng,
      heading: nav.heading,
      speedKmh: nav.speedKmh,
    });
  }, [nav.userLocation?.lat, nav.userLocation?.lng, nav.heading]);

  const locationForEmitter = nav.userLocation
    ? { lat: nav.userLocation.lat, lng: nav.userLocation.lng, heading: nav.heading, speedKmh: nav.speedKmh }
    : null;

  return { ...nav, locationForEmitter };
}
