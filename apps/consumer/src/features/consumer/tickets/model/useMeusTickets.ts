import { useState, useCallback, useEffect } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { ConsumerTicketService, PedidoService } from '@ajulabs/api-client';
import { Pedido } from '@ajulabs/types';
import { useTicketRealtime } from '@ajulabs/realtime';
import { useAuthStore } from '../../../../store';
import { TicketConsumidor, TicketStatus, mapTicketConsumidor } from './data';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export function useMeusTickets(onBack?: () => void) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);

  const [tickets, setTickets] = useState<TicketConsumidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | TicketStatus>('todos');

  const [showCriar, setShowCriar] = useState(false);
  const [motivoForm, setMotivoForm] = useState('');
  const [pedidoSelecionado, setPedidoSelecionado] = useState<string | null>(null);
  const [pedidosRecentes, setPedidosRecentes] = useState<Pedido[]>([]);
  const [criando, setCriando] = useState(false);
  const [erroCriar, setErroCriar] = useState('');

  const fetch = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const raw = await ConsumerTicketService.listar(token);
      setTickets(raw.map(mapTicketConsumidor));
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (onBack) {
      fetch();
    }
  }, [onBack, fetch]);

  useFocusEffect(
    useCallback(() => {
      if (!onBack) {
        fetch();
      }
    }, [onBack, fetch]),
  );

  const abrirCriar = useCallback(async () => {
    setMotivoForm('');
    setPedidoSelecionado(null);
    setErroCriar('');
    setShowCriar(true);
    if (token) {
      const lista = await PedidoService.listar(token).catch(() => [] as Pedido[]);
      setPedidosRecentes(lista.slice(0, 6));
    }
  }, [token]);

  const fecharCriar = useCallback(() => {
    setShowCriar(false);
    setMotivoForm('');
    setPedidoSelecionado(null);
    setErroCriar('');
  }, []);

  const handleCriar = useCallback(async () => {
    if (!token) return;
    if (!motivoForm.trim()) {
      setErroCriar('Descreva o problema para abrir o ticket.');
      return;
    }
    if (!pedidoSelecionado) {
      setErroCriar('Selecione o pedido relacionado ao problema.');
      return;
    }
    if (pedidoSelecionado) {
      const duplicado = tickets.find(
        (t) =>
          t.pedido?.id === pedidoSelecionado &&
          (t.status === 'aberto' || t.status === 'em_andamento'),
      );
      if (duplicado) {
        setErroCriar(
          `Já existe um ticket ativo (${duplicado.protocolo}) para este pedido. Acesse-o para continuar o atendimento.`,
        );
        return;
      }
    }
    setCriando(true);
    setErroCriar('');
    try {
      const novo = await ConsumerTicketService.criar(
        token,
        motivoForm.trim(),
        pedidoSelecionado ?? undefined,
      );
      fecharCriar();
      router.push(`/(consumer)/tickets/${novo.id}` as any);
    } catch (e: any) {
      setErroCriar(e?.message ?? 'Erro ao criar ticket. Tente novamente.');
    } finally {
      setCriando(false);
    }
  }, [token, motivoForm, pedidoSelecionado, tickets, fecharCriar, router]);

  useTicketRealtime({
    apiUrl: API_URL,
    ticketId: null,
    roomId: userId ?? null,
    roomType: 'usuario',
    enabled: !!userId,
    onNovo: () => {
      fetch();
    },
    onStatus: ({ ticketId, status }) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: status as TicketStatus } : t)),
      );
    },
    onMensagem: (msg) => {
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== msg.ticketId) return t;
          if (t.mensagens.some((m) => m.id === msg.id)) return t;
          return {
            ...t,
            mensagens: [
              ...t.mensagens,
              {
                id: msg.id,
                remetente: msg.remetente as 'consumidor' | 'lojista',
                texto: msg.texto,
                criadoEm: msg.criadoEm,
              },
            ],
          };
        }),
      );
    },
  });

  const list = filter === 'todos' ? tickets : tickets.filter((t) => t.status === filter);
  const countFor = (id: 'todos' | TicketStatus) =>
    id === 'todos' ? tickets.length : tickets.filter((t) => t.status === id).length;
  const abertos = tickets.filter((t) => t.status === 'aberto').length;

  return {
    tickets,
    loading,
    filter,
    setFilter,
    list,
    countFor,
    abertos,
    showCriar,
    abrirCriar,
    fecharCriar,
    motivoForm,
    setMotivoForm,
    pedidoSelecionado,
    setPedidoSelecionado,
    pedidosRecentes,
    criando,
    erroCriar,
    setErroCriar,
    handleCriar,
  };
}
