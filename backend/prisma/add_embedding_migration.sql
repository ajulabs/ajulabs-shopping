-- Execute este arquivo no Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Depois rode: pnpm exec prisma generate

-- 1. Habilitar extensão pgvector (já disponível no Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Adicionar coluna de embedding na tabela de produtos
ALTER TABLE "produtos"
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. Criar índice IVFFlat para busca aproximada por similaridade coseno
--    lists = 10 é adequado para até ~1.000 produtos
--    Ajuste para ceil(sqrt(total_produtos)) conforme o catálogo crescer
CREATE INDEX IF NOT EXISTS produtos_embedding_ivfflat_idx
  ON "produtos" USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);
