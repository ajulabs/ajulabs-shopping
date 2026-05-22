import { Router } from 'express';

const router = Router();

// Simple in-memory cache: key → {lat, lng, ts}
const cache = new Map<string, { lat: number; lng: number; ts: number }>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const NOM_HEADERS = { 'User-Agent': 'AjuLabs-Entregador/1.0 (lucassntcarvalho@gmail.com)' };

async function nominatim(q: string): Promise<{ lat: number; lng: number } | null> {
  const url  = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=3&countrycodes=br&viewbox=-37.30,-10.75,-36.95,-11.15&bounded=1`;
  const res  = await fetch(url, { headers: NOM_HEADERS });
  if (!res.ok) return null;
  const data: any[] = await res.json();
  if (!data.length) return null;
  const best = data.find(r => r.display_name?.toLowerCase().includes('aracaju')) ?? data[0];
  return { lat: parseFloat(best.lat), lng: parseFloat(best.lon) };
}

async function geocodeByCep(cep: string): Promise<{ lat: number; lng: number } | null> {
  // 1. ViaCEP → get formatted address
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  const viares = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
  if (!viares.ok) return null;
  const via: any = await viares.json();
  if (via.erro) return null;

  // 2. Nominatim with the structured address from ViaCEP
  const q = `${via.logradouro}, ${via.bairro}, ${via.localidade}, ${via.uf}`;
  const r = await nominatim(q);
  if (r) return r;

  // 3. Fallback: just city + state from ViaCEP (CEP prefix area)
  return nominatim(`${via.bairro ?? ''}, ${via.localidade}, ${via.uf}`);
}

/**
 * GET /geocode?q=Av.+José+Carlos+Silva,+4977,+São+Conrado
 * GET /geocode?cep=49040360
 * GET /geocode?cep=49040360&q=Av.+José+Carlos+Silva,+4977   (CEP preferred, q as fallback)
 *
 * Returns { lat, lng } for an address in Aracaju, SE.
 */
router.get('/', async (req, res) => {
  const q   = String(req.query.q   ?? '').trim();
  const cep = String(req.query.cep ?? '').trim();

  if (!q && !cep) return res.status(400).json({ error: 'Informe q ou cep' });

  const cacheKey = cep ? `cep:${cep.replace(/\D/g, '')}` : `q:${q.toLowerCase()}`;
  const cached   = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.json({ lat: cached.lat, lng: cached.lng });
  }

  try {
    let result: { lat: number; lng: number } | null = null;

    // CEP gives the most accurate result — try it first
    if (cep) result = await geocodeByCep(cep);

    // Fall back to free-text address
    if (!result && q) {
      const parts  = q.split(',').map(p => p.trim()).filter(Boolean);
      const street = parts[0] ?? q;
      for (const attempt of [`${q}, Aracaju, SE`, `${street}, Aracaju, Sergipe`]) {
        result = await nominatim(attempt);
        if (result) break;
      }
    }

    if (!result) return res.status(404).json({ error: 'Endereço não encontrado' });

    cache.set(cacheKey, { ...result, ts: Date.now() });
    return res.json(result);
  } catch (err) {
    console.error('[geocode] error:', err);
    return res.status(502).json({ error: 'Erro ao geocodificar endereço' });
  }
});

export default router;
