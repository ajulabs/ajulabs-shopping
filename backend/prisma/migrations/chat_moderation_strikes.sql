-- Campos para sistema de strikes de moderação do chat.
-- chat_strikes_count: número acumulado de mensagens inadequadas.
-- chat_bloqueado_ate: timestamp até quando o acesso ao chat está suspenso (NULL = liberado).

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS chat_strikes_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chat_bloqueado_ate TIMESTAMPTZ;
