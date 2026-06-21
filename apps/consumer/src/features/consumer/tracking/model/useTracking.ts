import { useState, useEffect, useRef, useCallback } from 'react';
import { Pedido } from '@ajulabs/types';
import { PedidoService, AvaliacaoService } from '@ajulabs/api-client';
import { usePedidoConsumerRealtime } from '@ajulabs/realtime';
import { useAuthStore } from '../../../../store';
import { useEntregadorTracking } from '../hooks/useEntregadorTracking';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

interface AvaliacaoPayload {
  notaLoja: number;
  comentarioLoja?: string;
  tagsLoja: string[];
  notaEntregador: number;
  comentarioEntregador?: string;
  tagsEntregador: string[];
  avaliacoesProdutos: { produtoId: string; nota: number; comentario?: string }[];
}

export function useTracking(pedidoId: string) {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmada, setShowConfirmada] = useState(false);
  const [showAvaliacao, setShowAvaliacao] = useState(false);
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const [erroCancelar, setErroCancelar] = useState<string | null>(null);
  const statusAnterior = useRef<string | null>(null);
  const modalDisparado = useRef(false);

  useEffect(() => {
    if (!pedido || modalDisparado.current) return;
    if (pedido.status === 'entregue' && !pedido.avaliado) {
      modalDisparado.current = true;
      const t = setTimeout(() => setShowConfirmada(true), 400);
      return () => clearTimeout(t);
    }
  }, [pedido?.id, pedido?.status, pedido?.avaliado]);

  const refetch = useCallback(() => {
    if (!token) return;
    return PedidoService.buscarPorId(pedidoId, token)
      .then((data) => {
        if (!data) return;
        if (statusAnterior.current !== 'entregue' && data.status === 'entregue' && !data.avaliado) {
          modalDisparado.current = true;
          setShowConfirmada(true);
        }
        statusAnterior.current = data.status;
        setPedido(data);
      })
      .catch(() => {});
  }, [pedidoId, token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    PedidoService.buscarPorId(pedidoId, token)
      .then((data) => {
        statusAnterior.current = data?.status ?? null;
        setPedido(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fallback polling: cobre o caso de socket caído / app voltando do background.
    // O realtime abaixo reage instantaneamente; o poll só preenche gaps.
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [pedidoId, token, refetch]);

  // Realtime: lista de pedidos já usa isso; sem o mesmo aqui, a tela de detalhe
  // ficava até 10s atrasada quando o lojista/entregador cancelava ou avançava
  // o status. Refeta o pedido completo no evento — mais simples e correto que
  // tentar mesclar payloads parciais.
  usePedidoConsumerRealtime({
    apiUrl: API_URL,
    userId,
    enabled: !!token,
    onAtualizado: (payload) => {
      if (payload.pedidoId !== pedidoId) return;
      refetch();
    },
  });

  async function handleEnviarAvaliacao(dados: AvaliacaoPayload) {
    if (!token || !pedido) return;
    setEnviandoAvaliacao(true);
    try {
      await AvaliacaoService.avaliarPedido({ pedidoId: pedido.id, ...dados }, token);
      setPedido((prev) => (prev ? { ...prev, avaliado: true } : prev));
      setShowAvaliacao(false);
    } catch {
      // silently fail — user can retry via histórico later
    } finally {
      setEnviandoAvaliacao(false);
    }
  }

  async function confirmarCancelamento() {
    if (!token || !pedido) return;
    setCancelando(true);
    setErroCancelar(null);
    try {
      await PedidoService.cancelar(pedido.id, token);
      setConfirmandoCancelar(false);
      setPedido((prev) => (prev ? { ...prev, status: 'cancelado' } : prev));
    } catch (e: unknown) {
      // 409: a loja aceitou no meio do clique. Fecha o modal — não adianta o
      // usuário ficar retentando — e refeta para refletir o novo status real.
      const status = (e as { status?: number } | null)?.status;
      const msg = e instanceof Error ? e.message : 'Erro ao cancelar. Tente novamente.';
      if (status === 409) {
        setConfirmandoCancelar(false);
        setErroCancelar(null);
        await refetch();
      } else {
        setErroCancelar(msg);
      }
      setCancelando(false);
    }
  }

  // Só há entregador a caminho (mapa + rastreio) quando ele já saiu para entrega,
  // ou quando o pedido está pronto E um entregador já aceitou a corrida. Sem isso,
  // o pedido só "pronto" (sem entregador) mostrava mapa "Localizando..." à toa.
  const isActive = pedido
    ? pedido.status === 'saiu_entrega' || (pedido.status === 'pronto' && !!pedido.entregador)
    : false;

  const { entregadorLocation, destinoLocation } = useEntregadorTracking({
    pedidoId,
    token,
    userId,
    isActive,
    enderecoEntrega: pedido?.enderecoEntrega,
  });

  const isAtivo = pedido ? !['entregue', 'cancelado'].includes(pedido.status) : false;
  // Tempo estimado do percurso de entrega (min), calculado pelo backend a ~60 km/h.
  const etaMin = pedido?.tempoEstimadoMin ?? null;

  return {
    pedido,
    loading,
    showConfirmada,
    setShowConfirmada,
    showAvaliacao,
    setShowAvaliacao,
    enviandoAvaliacao,
    cancelando,
    confirmandoCancelar,
    setConfirmandoCancelar,
    erroCancelar,
    setErroCancelar,
    handleEnviarAvaliacao,
    confirmarCancelamento,
    isActive,
    isAtivo,
    etaMin,
    entregadorLocation,
    destinoLocation,
  };
}
