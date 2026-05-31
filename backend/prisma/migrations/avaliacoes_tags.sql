-- Adiciona coluna tags às avaliações de loja e entregador.
-- Valores válidos definidos em packages/types/src/index.ts
-- (TAGS_AVALIACAO_LOJA e TAGS_AVALIACAO_ENTREGADOR).
-- Sem CHECK constraint no banco porque o catálogo pode evoluir e a
-- validação é feita no backend (zod) antes de inserir.

ALTER TABLE avaliacoes_loja
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE avaliacoes_entregador
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- Índice GIN para queries com `tags @> ARRAY['xyz']` ou `tags && ARRAY[...]`
-- usadas pela agregação de pontos fortes/fracos no dashboard.
CREATE INDEX IF NOT EXISTS idx_avaliacoes_loja_tags ON avaliacoes_loja USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_entregador_tags ON avaliacoes_entregador USING GIN (tags);
