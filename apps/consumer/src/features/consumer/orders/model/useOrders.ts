import { useState, useEffect, useCallback, useRef } from 'react';
import { Pedido } from '@ajulabs/types';
import { PedidoService, ConsumerTicketService, AvaliacaoService } from '@ajulabs/api-client';
import { usePedidoConsumerRealtime, useTicketRealtime } from '@ajulabs/realtime';
import { useAuthStore } from '../../../../store';

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

export function useOrders() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketsAbertos, setTicketsAbertos] = useState(0);
  const [pedidoParaAvaliar, setPedidoParaAvaliar] = useState<Pedido | null>(null);
  const [showConfirmada, setShowConfirmada] = useState(false);
  const [showAvaliacao, setShowAvaliacao] = useState(false);
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const pedidosRef = useRef<Pedido[]>([]);

  const fetchTicketCount = useCallback(async () => {
    if (!token) return;
    try {
      const raw = await ConsumerTicketService.listar(token);
      setTicketsAbertos((raw ?? []).filter((t: any) => t.status === 'aberto').length);
    } catch {}
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    PedidoService.listar(token)
      .then((data) => {
        setPedidos(data);
        pedidosRef.current = data;
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetchTicketCount();

    const interval = setInterval(() => {
      PedidoService.listar(token)
        .then((data) => {
          setPedidos(data);
          pedidosRef.current = data;
        })
        .catch(() => {});
      fetchTicketCount();
    }, 60_000);

    return () => clearInterval(interval);
  }, [token, fetchTicketCount]);

  usePedidoConsumerRealtime({
    apiUrl: API_URL,
    userId: userId ?? null,
    enabled: !!userId,
    onAtualizado: ({ pedidoId, status }) => {
      setPedidos((prev) => {
        const atualizado = prev.map((p) =>
          p.id === pedidoId ? { ...p, status: status as any } : p,
        );
        pedidosRef.current = atualizado;

        if (status === 'entregue') {
          const pedido = atualizado.find((p) => p.id === pedidoId);
          if (pedido && !pedido.avaliado) {
            setPedidoParaAvaliar(pedido);
            setShowConfirmada(true);
          }
        }

        return atualizado;
      });
    },
  });

  async function handleEnviarAvaliacao(dados: AvaliacaoPayload) {
    if (!token || !pedidoParaAvaliar) return;
    setEnviandoAvaliacao(true);
    try {
      await AvaliacaoService.avaliarPedido({ pedidoId: pedidoParaAvaliar.id, ...dados }, token);
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoParaAvaliar.id ? { ...p, avaliado: true } : p)),
      );
      setShowAvaliacao(false);
      setPedidoParaAvaliar(null);
    } catch {
      // user can retry later
    } finally {
      setEnviandoAvaliacao(false);
    }
  }

  useTicketRealtime({
    apiUrl: API_URL,
    ticketId: null,
    roomId: userId ?? null,
    roomType: 'usuario',
    enabled: !!userId,
    onNovo: () => {
      fetchTicketCount();
    },
    onStatus: ({ status }) => {
      if (status === 'resolvido' || status === 'cancelado') {
        setTicketsAbertos((prev) => Math.max(0, prev - 1));
      }
    },
  });

  type PedidoFilter = 'todos' | 'em_andamento' | 'entregue' | 'cancelado';
  const [filter, setFilter] = useState<PedidoFilter>('em_andamento');

  const counts = {
    todos: pedidos.length,
    em_andamento: pedidos.filter((p) => !['entregue', 'cancelado'].includes(p.status)).length,
    entregue: pedidos.filter((p) => p.status === 'entregue').length,
    cancelado: pedidos.filter((p) => p.status === 'cancelado').length,
  };

  const filters: { id: PedidoFilter; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'em_andamento', label: 'Andamento' },
    { id: 'entregue', label: 'Entregues' },
    { id: 'cancelado', label: 'Cancelados' },
  ];

  const list =
    filter === 'todos'
      ? pedidos
      : filter === 'em_andamento'
        ? pedidos.filter((p) => !['entregue', 'cancelado'].includes(p.status))
        : pedidos.filter((p) => p.status === filter);

  return {
    pedidos,
    loading,
    ticketsAbertos,
    filter,
    setFilter,
    filters,
    counts,
    list,
    pedidoParaAvaliar,
    setPedidoParaAvaliar,
    showConfirmada,
    setShowConfirmada,
    showAvaliacao,
    setShowAvaliacao,
    enviandoAvaliacao,
    handleEnviarAvaliacao,
  };
}
