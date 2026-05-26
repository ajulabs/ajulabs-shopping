-- Adiciona campos de última posição reportada por heartbeat do entregador
-- Atualizado via POST /v1/entregador/heartbeat aproximadamente a cada 1 min
-- quando o entregador está online.

ALTER TABLE entregadores
  ADD COLUMN IF NOT EXISTS ultima_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS ultima_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS ultimo_heartbeat TIMESTAMP;

-- Índice parcial pra buscas geoespaciais de entregadores online
CREATE INDEX IF NOT EXISTS idx_entregadores_online_geo
  ON entregadores (ultima_lat, ultima_lng)
  WHERE online = true AND ultima_lat IS NOT NULL AND ultima_lng IS NOT NULL;
