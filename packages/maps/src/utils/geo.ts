export function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function nearestIdx(
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
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return { idx: bestIdx, dist: bestDist };
}

/**
 * Perpendicular distance (m) from point `p` to the segment `a`–`b`, using a local
 * equirectangular projection (accurate at city scale). Used for off-route detection:
 * distance to the route *line* is far more reliable than distance to the nearest
 * vertex, which can read large on long straight segments with sparse vertices.
 */
export function distanceToSegment(
  p: { lat: number; lng: number },
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const mLat = 110540;
  const mLng = 111320 * Math.cos((p.lat * Math.PI) / 180);
  const ax = a.lng * mLng,
    ay = a.lat * mLat;
  const bx = b.lng * mLng,
    by = b.lat * mLat;
  const px = p.lng * mLng,
    py = p.lat * mLat;
  const dx = bx - ax,
    dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx,
    cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/** Smallest distance (m) from `pos` to the route polyline, within a window around `fromIdx`. */
export function distanceToPath(
  pos: { lat: number; lng: number },
  coords: { lat: number; lng: number }[],
  fromIdx: number,
): number {
  if (coords.length < 2) return coords.length === 1 ? haversine(pos, coords[0]) : Infinity;
  const start = Math.max(0, fromIdx - 5);
  const end = Math.min(coords.length - 2, fromIdx + 60);
  let best = Infinity;
  for (let i = start; i <= end; i++) {
    const d = distanceToSegment(pos, coords[i], coords[i + 1]);
    if (d < best) best = d;
  }
  return best;
}

export function buildInstruction(type: string, modifier?: string, name?: string): string {
  const street = name && name.trim() !== '' ? ` em ${name}` : '';
  if (type === 'depart') return `Siga${street}`;
  if (type === 'arrive') return 'Você chegou ao destino';
  if (type === 'roundabout' || type === 'rotary') return `Entre na rotatória${street}`;
  if (type === 'merge') return `Mescle${street}`;
  if (type === 'on ramp') return `Acesse a rampa${street}`;
  if (type === 'off ramp') return `Saia pela rampa${street}`;
  const map: Record<string, string> = {
    left: 'Vire à esquerda',
    right: 'Vire à direita',
    straight: 'Siga em frente',
    'slight left': 'Mantenha à esquerda',
    'slight right': 'Mantenha à direita',
    'sharp left': 'Curva acentuada à esquerda',
    'sharp right': 'Curva acentuada à direita',
    uturn: 'Faça retorno',
  };
  return (map[modifier ?? ''] ?? 'Continue') + street;
}
