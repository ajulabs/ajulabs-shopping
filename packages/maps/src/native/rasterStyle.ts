import type { StyleSpecification, LngLatBounds } from '@maplibre/maplibre-react-native';

// ── Tile sources (raster) ──────────────────────────────────────────────────────
// Mesmos tiles usados antes com react-native-maps — preservam o visual. Não exigem
// API key (ao contrário do Google Maps SDK).

export const TILE_OSM = [
  'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
];

// CartoDB Voyager: claro, colorido (usado no mapa de entrega).
export const TILE_LIGHT = [
  'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
];

// CartoDB Dark Matter: tema escuro.
export const TILE_DARK = ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'];

/**
 * Monta um MapLibre style JSON com uma única fonte raster (sem base do Google).
 * Use `tileSize: 512` para tiles `@2x` (CartoDB retina); `256` para OSM padrão.
 */
export function rasterStyle(tiles: string[], tileSize = 256): StyleSpecification {
  return {
    version: 8,
    sources: {
      'raster-tiles': { type: 'raster', tiles, tileSize },
    },
    layers: [{ id: 'raster-tiles', type: 'raster', source: 'raster-tiles' }],
  };
}

/**
 * Converte o `latitudeDelta` do react-native-maps no `zoom` aproximado do MapLibre.
 * Mantém o enquadramento próximo ao anterior (web mercator: ~360/2^zoom graus
 * visíveis na largura).
 */
export function deltaToZoom(delta: number): number {
  return Math.log2(360 / delta);
}

/**
 * Calcula os limites [oeste, sul, leste, norte] de um conjunto de pontos lat/lng,
 * no formato `LngLatBounds` esperado por `Camera.fitBounds`.
 */
export function boundsFromPoints(pts: { lat: number; lng: number }[]): LngLatBounds | null {
  if (pts.length === 0) return null;
  let west = pts[0].lng;
  let east = pts[0].lng;
  let south = pts[0].lat;
  let north = pts[0].lat;
  for (const p of pts) {
    if (p.lng < west) west = p.lng;
    if (p.lng > east) east = p.lng;
    if (p.lat < south) south = p.lat;
    if (p.lat > north) north = p.lat;
  }
  return [west, south, east, north];
}
