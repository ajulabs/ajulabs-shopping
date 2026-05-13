import { useState, useEffect, useRef } from 'react';
import { fetchOsrmSimple } from '../utils/osrm';

interface UseRouteDisplayOptions {
  from: { lat: number; lng: number } | null;
  to: { lat: number; lng: number } | null;
  enabled?: boolean;
}

export function useRouteDisplay({ from, to, enabled = true }: UseRouteDisplayOptions) {
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const lastKeyRef = useRef('');

  useEffect(() => {
    if (!enabled || !from || !to) {
      setRouteCoords([]);
      lastKeyRef.current = '';
      return;
    }

    const key = `${from.lat.toFixed(3)},${from.lng.toFixed(3)}->${to.lat.toFixed(3)},${to.lng.toFixed(3)}`;
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    fetchOsrmSimple(from, to).then(coords => {
      if (key === lastKeyRef.current) setRouteCoords(coords);
    });
  }, [
    from ? Math.round(from.lat * 1000) : null,
    from ? Math.round(from.lng * 1000) : null,
    to ? Math.round(to.lat * 1000) : null,
    to ? Math.round(to.lng * 1000) : null,
    enabled,
  ]);

  return routeCoords;
}
