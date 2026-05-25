-- Adiciona campos de geolocalização em EnderecoUsuario
ALTER TABLE enderecos_usuario
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS accuracy INTEGER,
  ADD COLUMN IF NOT EXISTS geo_source VARCHAR(20);

-- Adiciona campos de geolocalização em EnderecoLoja
ALTER TABLE enderecos_loja
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS accuracy INTEGER,
  ADD COLUMN IF NOT EXISTS geo_source VARCHAR(20);

-- Índices para queries geoespaciais futuras
CREATE INDEX IF NOT EXISTS idx_enderecos_usuario_geo ON enderecos_usuario(lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enderecos_loja_geo ON enderecos_loja(lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;
