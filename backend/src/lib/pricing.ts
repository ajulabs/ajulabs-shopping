// Precificação da corrida do entregador.
// O valor é calculado pela distância percorrida: R$1,05 por km, com taxa mínima
// de R$5,00. Na criação do pedido só se conhece a perna loja→cliente (ainda não
// há entregador), então o valor é finalizado no aceite, somando o trecho
// entregador→loja. O entregador recebe 100% desse valor.
export const PRECO_POR_KM = 1.05;
export const TAXA_MINIMA = 5.0;

type Coord = { lat?: number | null; lng?: number | null } | null | undefined;

// Distância Haversine em km entre dois pontos. Retorna 0 quando faltam
// coordenadas, de modo que o cálculo cai na taxa mínima em vez de quebrar.
export function haversineKm(a: Coord, b: Coord): number {
  if (a?.lat == null || a?.lng == null || b?.lat == null || b?.lng == null) return 0;
  const R = 6371;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Taxa da corrida a partir da distância total (km), aplicando o mínimo e
// arredondando a 2 casas.
export function taxaPorDistancia(distanciaKm: number): number {
  const valor = PRECO_POR_KM * Math.max(0, distanciaKm);
  return Math.max(TAXA_MINIMA, Number(valor.toFixed(2)));
}

// Velocidade média assumida para estimar o tempo de percurso da entrega e
// tempo mínimo exibido (evita estimativas irrealistas/zeradas em trajetos curtos
// ou quando faltam coordenadas).
export const VELOCIDADE_MEDIA_KMH = 60;
export const TEMPO_ENTREGA_MINIMO_MIN = 10;

// Estima o tempo de entrega (minutos) a partir da distância, a 60 km/h
// (1 km ≈ 1 min). O consumo exibe uma faixa (ex.: "X a X+5 min").
export function estimarMinutosEntrega(distanciaKm: number): number {
  const minutos = Math.round((Math.max(0, distanciaKm) / VELOCIDADE_MEDIA_KMH) * 60);
  return Math.max(TEMPO_ENTREGA_MINIMO_MIN, minutos);
}
