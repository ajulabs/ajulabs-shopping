import { useState, useEffect, useRef } from 'react';
import { Pedido } from '@ajulabs/types';
import { PedidoService, AvaliacaoService } from '@ajulabs/api-client';
import { useAuthStore } from '../../../../store';
import { useEntregadorTracking } from '../hooks/useEntregadorTracking';

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

    const interval = setInterval(() => {
      PedidoService.buscarPorId(pedidoId, token)
        .then((data) => {
          if (!data) return;
          if (
            statusAnterior.current !== 'entregue' &&
            data.status === 'entregue' &&
            !data.avaliado
          ) {
            modalDisparado.current = true;
            setShowConfirmada(true);
          }
          statusAnterior.current = data.status;
          setPedido(data);
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [pedidoId, token]);

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
      setErroCancelar(e instanceof Error ? e.message : 'Erro ao cancelar. Tente novamente.');
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
  const etaMin = pedido?.estimativaEntrega
    ? Math.max(1, Math.ceil((new Date(pedido.estimativaEntrega).getTime() - Date.now()) / 60000))
    : null;

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
