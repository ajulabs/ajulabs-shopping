-- Migration: add stock control (estoqueMinimo, TipoMovimentacao enum, movimentacoes_estoque table)
-- Run this directly in Supabase SQL Editor

-- 1. Add estoqueMinimo column to produtos
ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS estoque_minimo INT NOT NULL DEFAULT 0;

-- 2. Create TipoMovimentacao enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoMovimentacao') THEN
    CREATE TYPE "TipoMovimentacao" AS ENUM (
      'entrada_manual',
      'saida_manual',
      'venda',
      'cancelamento',
      'devolucao',
      'ajuste_inventario',
      'reserva',
      'liberacao_reserva'
    );
  END IF;
END
$$;

-- 3. Create movimentacoes_estoque table
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id     UUID        NOT NULL,
  loja_id        UUID        NOT NULL,
  lojista_id     UUID,
  tipo           "TipoMovimentacao" NOT NULL,
  quantidade     INT         NOT NULL,
  estoque_antes  INT         NOT NULL,
  estoque_depois INT         NOT NULL,
  motivo         TEXT,
  pedido_id      UUID,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_mov_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
  CONSTRAINT fk_mov_loja    FOREIGN KEY (loja_id)    REFERENCES lojas(id)    ON DELETE CASCADE
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_mov_loja_data    ON movimentacoes_estoque (loja_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_mov_produto_data ON movimentacoes_estoque (produto_id, criado_em DESC);
