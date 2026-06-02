import { logger } from './logger';

const NOM_HEADERS = { 'User-Agent': 'AjuLabs-Shopping/1.0 (lucassntcarvalho@gmail.com)' };

// Viewbox aproximado de Aracaju-SE
const NOM_VIEWBOX = '-37.30,-10.75,-36.95,-11.15';

export interface GeoCoords {
  lat: number;
  lng: number;
}

export interface ReverseResult extends GeoCoords {
  rua: string;
  bairro: string;
  cidade: string;
  cep: string;
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

// ── Nominatim ──────────────────────────────────────────────────────────────

export async function nominatimSearch(q: string): Promise<GeoCoords | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=3&countrycodes=br&viewbox=${NOM_VIEWBOX}&bounded=1`;
    const res = await fetch(url, { headers: NOM_HEADERS });
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any[];
    if (!data.length) return null;
    const best = data.find((r) => r.display_name?.toLowerCase().includes('aracaju')) ?? data[0];
    return { lat: parseFloat(best.lat), lng: parseFloat(best.lon) };
  } catch {
    return null;
  }
}

export async function nominatimReverse(lat: number, lng: number): Promise<ReverseResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18`;
    const res = await fetch(url, { headers: NOM_HEADERS });
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    if (!data.address) return null;

    const addr = data.address;
    return {
      lat,
      lng,
      rua: addr.road || addr.pedestrian || addr.street || addr.quarter || '',
      bairro: addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || '',
      cidade: addr.city || addr.town || addr.village || 'Aracaju',
      cep: (addr.postcode || '').replace(/\D/g, '').slice(0, 8),
    };
  } catch {
    return null;
  }
}

// ── ViaCEP ────────────────────────────────────────────────────────────────

export interface ViaCepResult {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  cep: string;
}

export async function viaCepByCep(cep: string): Promise<ViaCepResult | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    if (data.erro) return null;
    return data as ViaCepResult;
  } catch {
    return null;
  }
}

export async function viaCepByAddress(
  uf: string,
  cidade: string,
  logradouro: string,
): Promise<ViaCepResult[] | null> {
  try {
    const url = `https://viacep.com.br/ws/${uf}/${encodeURIComponent(cidade)}/${encodeURIComponent(logradouro)}/json/`;
    const res = await fetch(url);
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return data as ViaCepResult[];
  } catch {
    return null;
  }
}

// ── Geocode por CEP (sem fallback genérico de bairro) ────────────────────

export async function geocodeByCep(cep: string): Promise<GeoCoords | null> {
  const via = await viaCepByCep(cep);
  if (!via) return null;

  const tentativas = [
    via.logradouro ? `${via.logradouro}, ${via.bairro}, ${via.localidade}, ${via.uf}` : null,
    via.logradouro ? `${via.logradouro}, ${via.localidade}, ${via.uf}` : null,
    via.logradouro ? `${via.logradouro}, Aracaju, Sergipe` : null,
  ].filter(Boolean) as string[];

  for (const q of tentativas) {
    const r = await nominatimSearch(q);
    if (r) {
      logger.info({ cep, q, r }, '[geocoder] geocodeByCep sucesso');
      return r;
    }
  }

  // NÃO cai em bairro genérico — retorna null
  logger.warn({ cep, logradouro: via.logradouro }, '[geocoder] geocodeByCep sem resultado');
  return null;
}

// ── Geocode por texto livre ───────────────────────────────────────────────

export async function geocodeByQuery(q: string): Promise<GeoCoords | null> {
  const parts = q
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const street = parts[0] ?? q;

  for (const attempt of [`${q}, Aracaju, SE`, `${street}, Aracaju, Sergipe`]) {
    const r = await nominatimSearch(attempt);
    if (r) {
      logger.info({ q: attempt, r }, '[geocoder] geocodeByQuery sucesso');
      return r;
    }
  }

  logger.warn({ q }, '[geocoder] geocodeByQuery sem resultado');
  return null;
}

// ── Reverse geocode com enriquecimento de CEP via ViaCEP ─────────────────

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseResult | null> {
  const base = await nominatimReverse(lat, lng);
  if (!base) return null;

  // Se Nominatim retornou rua, tenta enriquecer o CEP via ViaCEP
  if (base.rua && base.cidade.toLowerCase().includes('aracaju')) {
    const resultados = await viaCepByAddress('SE', 'Aracaju', base.rua);
    if (resultados && resultados.length > 0) {
      const match = base.bairro
        ? (resultados.find(
            (e) =>
              normalize(e.bairro || '').includes(normalize(base.bairro)) ||
              normalize(base.bairro).includes(normalize(e.bairro || '')),
          ) ?? resultados[0])
        : resultados[0];

      if (match) {
        logger.info(
          { lat, lng, cepNominatim: base.cep, cepViaCep: match.cep },
          '[geocoder] CEP enriquecido via ViaCEP',
        );
        return { ...base, cep: match.cep.replace(/\D/g, ''), rua: match.logradouro || base.rua };
      }
    }
  }

  return base;
}

// ── Geocode completo (CEP → query) ────────────────────────────────────────

export async function geocode(q: string, cep?: string): Promise<GeoCoords | null> {
  if (cep) {
    const r = await geocodeByCep(cep);
    if (r) return r;
  }
  return geocodeByQuery(q);
}
