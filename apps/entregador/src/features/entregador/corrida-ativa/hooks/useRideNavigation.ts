import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@ajulabs/maps';

interface Params {
  destination: { lat: number; lng: number } | null;
  enabled: boolean;
}

export function useRideNavigation({ destination, enabled }: Params) {
  const [navigationStarted, setNavigationStarted] = useState(false);
  const [centerTrigger, setCenterTrigger] = useState(0);

  useEffect(() => {
    setNavigationStarted(false);
    setCenterTrigger(0);
  }, [destination?.lat, destination?.lng]);

  const nav = useNavigation(destination, enabled && navigationStarted);

  const startNavigation = useCallback(() => setNavigationStarted(true), []);
  const centerMap = useCallback(() => setCenterTrigger(t => t + 1), []);

  return { ...nav, navigationStarted, startNavigation, centerTrigger, centerMap };
}
