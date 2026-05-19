export function fmtDist(m: number): string {
  if (m <= 0) return '–';
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

export function fmtEta(sec: number): string {
  if (sec <= 0) return '–';
  if (sec < 60) return '< 1 min';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}min`;
}

export function fmtSpeed(kmh: number): string {
  return `${Math.round(kmh)} km/h`;
}

export function maneuverIcon(modifier?: string): string {
  const map: Record<string, string> = {
    'left':        'arrow-back',
    'right':       'arrow-forward',
    'straight':    'arrow-up',
    'slight left': 'arrow-back-outline',
    'slight right':'arrow-forward-outline',
    'sharp left':  'return-down-back',
    'sharp right': 'return-down-forward',
    'uturn':       'refresh',
  };
  return map[modifier ?? ''] ?? 'arrow-up';
}

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
