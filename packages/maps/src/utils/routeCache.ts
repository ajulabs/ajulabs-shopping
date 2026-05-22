import type { NavStep } from '@ajulabs/types';

interface RouteEntry {
  coords: { lat: number; lng: number }[];
  steps: NavStep[];
  totalDuration: number;
  totalDistance: number;
  ts: number;
}

const TTL = 10 * 60 * 1000; // 10 minutes
const MAX_ENTRIES = 50;
const store = new Map<string, RouteEntry>();

function makeKey(from: { lat: number; lng: number }, to: { lat: number; lng: number }): string {
  return `${from.lat.toFixed(3)},${from.lng.toFixed(3)}→${to.lat.toFixed(3)},${to.lng.toFixed(3)}`;
}

export function getCachedRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Omit<RouteEntry, 'ts'> | null {
  const k = makeKey(from, to);
  const entry = store.get(k);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL) {
    store.delete(k);
    return null;
  }
  const { ts: _ts, ...data } = entry;
  return data;
}

export function setCachedRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  data: Omit<RouteEntry, 'ts'>,
): void {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(makeKey(from, to), { ...data, ts: Date.now() });
}
