const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const BAIRROS: Record<string, { lat: number; lng: number }> = {
  'centro':           { lat: -10.9172, lng: -37.0513 },
  'jardins':          { lat: -10.9453, lng: -37.0422 },
  'grageru':          { lat: -10.9296, lng: -37.0499 },
  'luzia':            { lat: -10.9560, lng: -37.0610 },
  'salgado filho':    { lat: -10.9020, lng: -37.0600 },
  'coroa do meio':    { lat: -10.9850, lng: -37.0280 },
  'atalaia':          { lat: -10.9857, lng: -37.0588 },
  'farolandia':       { lat: -10.9756, lng: -37.0685 },
  'inacio barbosa':   { lat: -10.9700, lng: -37.0800 },
  'jabotiana':        { lat: -10.9500, lng: -37.0900 },
  'capucho':          { lat: -10.9050, lng: -37.0850 },
  'porto dantas':     { lat: -10.8800, lng: -37.0750 },
  'soledade':         { lat: -10.9100, lng: -37.0600 },
  'santos dumont':    { lat: -10.9000, lng: -37.0450 },
  'industrial':       { lat: -10.9200, lng: -37.0950 },
  'ponto novo':       { lat: -10.9200, lng: -37.0800 },
  'cirurgia':         { lat: -10.9250, lng: -37.0550 },
  'sao conrado':      { lat: -10.9600, lng: -37.0480 },
  'suissa':           { lat: -10.9350, lng: -37.0450 },
  'treze de julho':   { lat: -10.9350, lng: -37.0500 },
  'siqueira campos':  { lat: -10.9150, lng: -37.0550 },
  'novo paraiso':     { lat: -10.9650, lng: -37.0700 },
  'america':          { lat: -10.9150, lng: -37.0800 },
  'pereira lobo':     { lat: -10.9250, lng: -37.0750 },
  'getulio vargas':   { lat: -10.9300, lng: -37.0600 },
  'santa maria':      { lat: -10.9400, lng: -37.0900 },
  '18 do forte':      { lat: -10.9100, lng: -37.0950 },
  'bugio':            { lat: -10.9050, lng: -37.0700 },
  'lamarao':          { lat: -10.8650, lng: -37.0700 },
  'aeroporto':        { lat: -10.9150, lng: -37.0700 },
  'japaozinho':       { lat: -10.9270, lng: -37.0860 },
  'japao':            { lat: -10.9270, lng: -37.0860 },
  'cidade nova':      { lat: -10.9350, lng: -37.0750 },
  'olaria':           { lat: -10.9100, lng: -37.0750 },
  'zona de expansao': { lat: -11.0500, lng: -37.0600 },
  'mosqueiro':        { lat: -11.0200, lng: -37.0400 },
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

  const parts  = address.split(',').map(p => p.trim()).filter(Boolean);
  const bairro = parts.length >= 2 ? parts[parts.length - 1] : '';
  return bairroFallback(bairro);
}
