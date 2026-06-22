import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigation } from '@ajulabs/maps';

interface Params {
  destination: { lat: number; lng: number } | null;
  enabled: boolean;
}

export function useRideNavigation({ destination, enabled }: Params) {
  const [centerTrigger, setCenterTrigger] = useState(0);
  const [fitTrigger, setFitTrigger] = useState(0);
  const routeReadyRef = useRef(false);

  // GPS starts as soon as destination is available — no button needed.
  const nav = useNavigation(destination, enabled);

  // Reset per-destination state when the delivery stage changes.
  useEffect(() => {
    setCenterTrigger(0);
    routeReadyRef.current = false;
  }, [destination?.lat, destination?.lng]);

  // Auto-fit map the first time a route becomes ready for each destination.
  // This gives the entregador a full overview of the route (Uber/iFood style).
  useEffect(() => {
    if (nav.routeReady && !routeReadyRef.current) {
      routeReadyRef.current = true;
      setFitTrigger((t) => t + 1);
    }
  }, [nav.routeReady]);

  const centerMap = useCallback(() => setCenterTrigger((t) => t + 1), []);

  return {
    ...nav,
    // navigationStarted is automatic: true when OSRM has a route ready.
    navigationStarted: nav.routeReady,
    centerTrigger,
    fitTrigger,
    centerMap,
  };
}
