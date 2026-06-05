-- Migration: stock movements per product variation
-- Adds variacao_id / variacao_nome to movimentacoes_estoque so adjustments and
-- sales can be tracked per variation. Run this directly in Supabase SQL Editor.

-- 1. Add columns (nullable — produtos sem variação continuam usando NULL).
--    variacao_id é TEXT para casar com variacoes_produto.id (String/text no Prisma).
ALTER TABLE movimentacoes_estoque DROP COLUMN IF EXISTS variacao_id;
ALTER TABLE movimentacoes_estoque
  ADD COLUMN IF NOT EXISTS variacao_id   TEXT,
  ADD COLUMN IF NOT EXISTS variacao_nome TEXT;

-- 2. FK para variacoes_produto. ON DELETE SET NULL preserva o histórico
--    (variacao_nome continua mostrando qual variação era) mesmo se a variação
--    for removida na edição do produto.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_mov_variacao'
  ) THEN
    ALTER TABLE movimentacoes_estoque
      ADD CONSTRAINT fk_mov_variacao
      FOREIGN KEY (variacao_id) REFERENCES variacoes_produto(id) ON DELETE SET NULL;
  END IF;
END
$$;
