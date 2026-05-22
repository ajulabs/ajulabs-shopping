const API_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1';

const BAIRROS: Record<string, { lat: number; lng: number }> = {
  centro: { lat: -10.9172, lng: -37.0513 },
  jardins: { lat: -10.9453, lng: -37.0422 },
  grageru: { lat: -10.9296, lng: -37.0499 },
  luzia: { lat: -10.956, lng: -37.061 },
  'salgado filho': { lat: -10.902, lng: -37.06 },
  'coroa do meio': { lat: -10.985, lng: -37.028 },
  atalaia: { lat: -10.9857, lng: -37.0588 },
  farolandia: { lat: -10.9756, lng: -37.0685 },
  'inacio barbosa': { lat: -10.97, lng: -37.08 },
  jabotiana: { lat: -10.95, lng: -37.09 },
  capucho: { lat: -10.905, lng: -37.085 },
  'porto dantas': { lat: -10.88, lng: -37.075 },
  soledade: { lat: -10.91, lng: -37.06 },
  'santos dumont': { lat: -10.9, lng: -37.045 },
  industrial: { lat: -10.92, lng: -37.095 },
  'ponto novo': { lat: -10.92, lng: -37.08 },
  cirurgia: { lat: -10.925, lng: -37.055 },
  'sao conrado': { lat: -10.96, lng: -37.048 },
  suissa: { lat: -10.935, lng: -37.045 },
  'treze de julho': { lat: -10.935, lng: -37.05 },
  'siqueira campos': { lat: -10.915, lng: -37.055 },
  'novo paraiso': { lat: -10.965, lng: -37.07 },
  america: { lat: -10.915, lng: -37.08 },
  'pereira lobo': { lat: -10.925, lng: -37.075 },
  'getulio vargas': { lat: -10.93, lng: -37.06 },
  'santa maria': { lat: -10.94, lng: -37.09 },
  '18 do forte': { lat: -10.91, lng: -37.095 },
  bugio: { lat: -10.905, lng: -37.07 },
  lamarao: { lat: -10.865, lng: -37.07 },
  aeroporto: { lat: -10.915, lng: -37.07 },
  japaozinho: { lat: -10.927, lng: -37.086 },
  japao: { lat: -10.927, lng: -37.086 },
  'cidade nova': { lat: -10.935, lng: -37.075 },
  olaria: { lat: -10.91, lng: -37.075 },
  'zona de expansao': { lat: -11.05, lng: -37.06 },
  mosqueiro: { lat: -11.02, lng: -37.04 },
};

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function bairroFallback(bairro: string): { lat: number; lng: number } | null {
  const key = normalize(bairro);
  for (const [k, v] of Object.entries(BAIRROS)) {
    if (k === key || key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

export async function geocode(
  address: string,
  cep?: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({ q: address });
    if (cep) params.set('cep', cep.replace(/\D/g, ''));
    const res = await fetch(`${API_URL}/geocode?${params}`);
    if (res.ok) {
      const data = await res.json();
      if (typeof data.lat === 'number' && typeof data.lng === 'number') return data;
    }
  } catch {}

  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const bairro = parts.length >= 2 ? parts[parts.length - 1] : '';
  return bairroFallback(bairro);
}
