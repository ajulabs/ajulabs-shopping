import { Router } from 'express';
import { logger } from '../lib/logger';
import { geocodeByCep, geocodeByQuery, reverseGeocode } from '../lib/geocoder';

const router = Router();

// Cache em memória: chave → { lat, lng, ts }
const cache = new Map<string, { lat: number; lng: number; ts: number }>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 dias

function fromCache(key: string) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return { lat: hit.lat, lng: hit.lng };
  return null;
}

/**
 * GET /geocode?q=Av.+Ivo+do+Prado,+100,+Centro
 * GET /geocode?cep=49010340
 * GET /geocode?cep=49010340&q=Av.+Ivo+do+Prado,+100
 *
 * Retorna { lat, lng } para um endereço em Aracaju-SE.
 * CEP tem prioridade. Sem fallback genérico de bairro.
 */
router.get('/', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const cep = String(req.query.cep ?? '')
    .trim()
    .replace(/\D/g, '');

  if (!q && !cep) return res.status(400).json({ error: 'Informe q ou cep' });

  const cacheKey = cep ? `cep:${cep}` : `q:${q.toLowerCase()}`;
  const cached = fromCache(cacheKey);
  if (cached) {
    logger.info({ cacheKey, cached }, '[geocode] cache hit');
    return res.json(cached);
  }

  try {
    let result: { lat: number; lng: number } | null = null;

    if (cep) {
      logger.info({ cep }, '[geocode] tentando por CEP');
      result = await geocodeByCep(cep);
      if (!result) logger.warn({ cep }, '[geocode] CEP não geocodificado, tentando query');
    }

    if (!result && q) {
      logger.info({ q }, '[geocode] tentando por query');
      result = await geocodeByQuery(q);
    }

    if (!result) {
      logger.warn({ q, cep }, '[geocode] sem resultado');
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    cache.set(cacheKey, { ...result, ts: Date.now() });
    logger.info({ q, cep, result }, '[geocode] resultado');
    return res.json(result);
  } catch (err) {
    logger.error({ err }, '[geocode] erro interno');
    return res.status(502).json({ error: 'Erro ao geocodificar endereço' });
  }
});

/**
 * GET /geocode/by-coords?lat=-10.9245&lng=-37.0523
 *
 * Reverse geocoding com enriquecimento de CEP via ViaCEP.
 * Retorna { rua, bairro, cidade, cep, lat, lng }.
 */
router.get('/by-coords', async (req, res) => {
  const lat = parseFloat(String(req.query.lat ?? ''));
  const lng = parseFloat(String(req.query.lng ?? ''));

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'lat e lng devem ser números válidos' });
  }

  const cacheKey = `coords:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    logger.info({ cacheKey }, '[geocode/by-coords] cache hit');
    return res.json(hit);
  }

  try {
    logger.info({ lat, lng }, '[geocode/by-coords] iniciando reverse geocode');
    const result = await reverseGeocode(lat, lng);

    if (!result) {
      logger.warn({ lat, lng }, '[geocode/by-coords] sem resultado');
      return res.status(404).json({ error: 'Endereço não encontrado para estas coordenadas' });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cache.set(cacheKey, { ...(result as any), ts: Date.now() });
    logger.info({ lat, lng, result }, '[geocode/by-coords] resultado');
    return res.json(result);
  } catch (err) {
    logger.error({ err }, '[geocode/by-coords] erro interno');
    return res.status(502).json({ error: 'Erro ao geocodificar coordenadas' });
  }
});

export default router;
