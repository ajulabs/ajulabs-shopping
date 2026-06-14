-- Campo para armazenar o resumo periódico do contexto da conversa.
-- Gerado automaticamente a cada 20 mensagens para manter o AI informado
-- sobre o histórico sem aumentar o custo de tokens indefinidamente.

ALTER TABLE conversas_chat
  ADD COLUMN IF NOT EXISTS resumo_contexto TEXT;
