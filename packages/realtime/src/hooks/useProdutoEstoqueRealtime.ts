import { useEffect, useRef } from 'react';
import { getSocket } from '../client';
import type { ProdutoVariacaoPayload, EstoqueAtualizadoPayload } from '../events';

interface Options {
  apiUrl: string;
  produtoId: string | null;
  enabled?: boolean;
  /** Disparado quando as variações do produto mudam (estoque por variação). */
  onVariacoes?: (variacoes: ProdutoVariacaoPayload['variacoes']) => void;
  /** Disparado quando o estoque total do produto muda. */
  onEstoque?: (payload: EstoqueAtualizadoPayload) => void;
}

/**
 * Mantém a PDP do consumidor sincronizada com o estoque do produto em tempo real.
 * Entra na sala `produto:<id>` e ouve `produto:variacoes` e `estoque:atualizado`.
 */
export function useProdutoEstoqueRealtime({
  apiUrl,
  produtoId,
  enabled = true,
  onVariacoes,
  onEstoque,
}: Options): void {
  const variacoesRef = useRef(onVariacoes);
  const estoqueRef = useRef(onEstoque);
  variacoesRef.current = onVariacoes;
  estoqueRef.current = onEstoque;

  useEffect(() => {
    if (!enabled || !produtoId || !apiUrl) return;

    const socket = getSocket(apiUrl);

    const onConnect = () => socket.emit('produto:join', produtoId);
    const onVar = (payload: ProdutoVariacaoPayload) => {
      if (payload.produtoId === produtoId) variacoesRef.current?.(payload.variacoes);
    };
    const onEst = (payload: EstoqueAtualizadoPayload) => {
      if (payload.produtoId === produtoId) estoqueRef.current?.(payload);
    };

    socket.on('connect', onConnect);
    socket.on('produto:variacoes', onVar);
    socket.on('estoque:atualizado', onEst);
    if (socket.connected) onConnect();

    return () => {
      socket.emit('produto:leave', produtoId);
      socket.off('connect', onConnect);
      socket.off('produto:variacoes', onVar);
      socket.off('estoque:atualizado', onEst);
    };
  }, [apiUrl, produtoId, enabled]);
}
