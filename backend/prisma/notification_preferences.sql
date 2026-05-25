-- Criar tabela de opt-out de notificações
-- Default: tudo ligado. Linha só existe quando usuário desligou uma categoria.

CREATE TABLE preferencias_notificacao_opt_out (
  id              TEXT PRIMARY KEY,
  consumidor_id   TEXT,
  lojista_id      TEXT,
  entregador_id   TEXT,
  categoria       TEXT NOT NULL,
  criado_em       TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT prefs_opt_out_consumidor_fkey
    FOREIGN KEY (consumidor_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT prefs_opt_out_lojista_fkey
    FOREIGN KEY (lojista_id) REFERENCES lojistas(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT prefs_opt_out_entregador_fkey
    FOREIGN KEY (entregador_id) REFERENCES entregadores(id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  -- Exatamente UM dos três IDs deve estar preenchido (consistente com dispositivos_push)
  CONSTRAINT prefs_opt_out_exactly_one_owner
    CHECK (
      (CASE WHEN consumidor_id IS NOT NULL THEN 1 ELSE 0 END
     + CASE WHEN lojista_id    IS NOT NULL THEN 1 ELSE 0 END
     + CASE WHEN entregador_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

-- Uniques (um dono não pode ter duas linhas pra mesma categoria)
CREATE UNIQUE INDEX prefs_opt_out_consumidor_categoria_idx
  ON preferencias_notificacao_opt_out (consumidor_id, categoria)
  WHERE consumidor_id IS NOT NULL;

CREATE UNIQUE INDEX prefs_opt_out_lojista_categoria_idx
  ON preferencias_notificacao_opt_out (lojista_id, categoria)
  WHERE lojista_id IS NOT NULL;

CREATE UNIQUE INDEX prefs_opt_out_entregador_categoria_idx
  ON preferencias_notificacao_opt_out (entregador_id, categoria)
  WHERE entregador_id IS NOT NULL;

-- Índices por dono pra lookup rápido no pushSender
CREATE INDEX prefs_opt_out_consumidor_idx
  ON preferencias_notificacao_opt_out (consumidor_id)
  WHERE consumidor_id IS NOT NULL;

CREATE INDEX prefs_opt_out_lojista_idx
  ON preferencias_notificacao_opt_out (lojista_id)
  WHERE lojista_id IS NOT NULL;

CREATE INDEX prefs_opt_out_entregador_idx
  ON preferencias_notificacao_opt_out (entregador_id)
  WHERE entregador_id IS NOT NULL;
