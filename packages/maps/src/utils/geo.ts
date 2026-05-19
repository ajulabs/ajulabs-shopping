export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const φ1 = a.lat * Math.PI / 180;
  const φ2 = b.lat * Math.PI / 180;
  const Δφ = (b.lat - a.lat) * Math.PI / 180;
  const Δλ = (b.lng - a.lng) * Math.PI / 180;
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
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  }
  return { idx: bestIdx, dist: bestDist };
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
