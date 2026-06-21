import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated, Platform, ToastAndroid } from 'react-native';
import { LojistaService, ApiUnauthorizedError } from '@ajulabs/api-client';
import { usePedidosRealtime, usePedidoLojistaRealtime } from '@ajulabs/realtime';
import { useAuthLojistaStore } from '../../../../store';
import { useHardwareBack } from '../../../../shared/hooks';
import { FLOW, type OrderStatus, type Order } from '../lib';
import { mapPedidoToOrder } from '../lib';
import { usePedidoSound } from './usePedidoSound';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export type Screen = 'list' | 'detail' | 'delivery' | 'tickets' | 'chat';

export function usePedidos() {
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const lojaNome = useAuthLojistaStore((s) => s.lojaNome);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todos' | OrderStatus>('todos');
  const [screen, setScreen] = useState<Screen>('list');
  const [selected, setSelected] = useState<Order | null>(null);

  // Botão físico de voltar do Android: respeita a navegação por estado interno.
  // Sem isso, voltar de uma sub-tela (detail/delivery/chat/tickets) fecha o app.
  const lastBackPressRef = useRef(0);
  useHardwareBack(() => {
    if (screen === 'chat') {
      setScreen('detail');
      return true;
    }
    // Em 'tickets' (lista aberta via card de Pedidos), voltar retorna pros
    // pedidos. O TicketsScreen é renderizado por estado (não é rota), então seu
    // próprio useFocusEffect/back não dispara aqui — quem trata é esta rota.
    if (screen === 'tickets') {
      setScreen('list');
      return true;
    }
    if (screen !== 'list') {
      setScreen('list');
      return true;
    }
    // Em 'list' (raiz da tab): padrão "aperte voltar novamente para sair".
    const agora = Date.now();
    if (agora - lastBackPressRef.current < 2000) {
      return false; // segundo toque em 2s → deixa o app fechar
    }
    lastBackPressRef.current = agora;
    if (Platform.OS === 'android') {
      ToastAndroid.show('Aperte voltar novamente para sair', ToastAndroid.SHORT);
    }
    return true; // primeiro toque → não fecha
  });
  const [showSomModal, setShowSomModal] = useState(false);
  const [openTickets, setOpenTickets] = useState(0);
  const [cancelModal, setCancelModal] = useState<{
    orderId: string;
    dbId: string;
    status: OrderStatus;
  } | null>(null);
  const [recarregando, setRecarregando] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const { tocarSom, somAtual, salvarSom } = usePedidoSound();
  const novosAnteriorRef = useRef(0);
  const primeiraCarregadaRef = useRef(true);

  const fetchPedidos = useCallback(async () => {
    if (!lojaId) {
      setLoading(false);
      setError('loja_null');
      return;
    }
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const raw = await LojistaService.listarPedidos(lojaId, token);
      setOrders(raw.map(mapPedidoToOrder));
      setError(null);
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        // Dispara refresh — quando o token atualizar no store o componente
        // re-renderiza com novo token e o useEffect chama fetchPedidos novamente.
        useAuthLojistaStore.getState().refreshAccessToken();
      } else {
        setError('Não foi possível carregar pedidos.');
      }
    }
    setLoading(false);
  }, [lojaId, token]);

  const handleRefresh = useCallback(async () => {
    if (recarregando) return;
    setRecarregando(true);
    spinAnim.setValue(0);
    spinLoopRef.current = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    );
    spinLoopRef.current.start();
    await fetchPedidos();
    spinLoopRef.current.stop();
    spinAnim.setValue(0);
    setRecarregando(false);
  }, [recarregando, fetchPedidos, spinAnim]);

  const fetchTicketCount = useCallback(async () => {
    if (!lojaId || !token) return;
    try {
      const raw = await LojistaService.listarTickets(lojaId, token);
      setOpenTickets(raw.filter((t: any) => t.status === 'aberto').length);
    } catch {
      /* silencioso — badge opcional */
    }
  }, [lojaId, token]);

  useEffect(() => {
    fetchPedidos();
    fetchTicketCount();
    const interval = setInterval(() => {
      fetchPedidos();
      fetchTicketCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPedidos, fetchTicketCount]);

  // Realtime: pedido novo chega na hora (não espera o polling de 30s).
  // O efeito de `novos` abaixo dispara o som ao detectar o aumento.
  usePedidosRealtime({
    apiUrl: API_URL,
    lojaId: lojaId ?? null,
    enabled: !!lojaId,
    onNovoPedido: () => {
      fetchPedidos();
    },
  });

  // Realtime: mudança de status (cancelamento pelo consumidor, entregador
  // alocado/retirou) reflete na lista e na tela de logística sem recarregar.
  usePedidoLojistaRealtime({
    apiUrl: API_URL,
    lojaId: lojaId ?? null,
    enabled: !!lojaId,
    onAtualizado: () => {
      fetchPedidos();
    },
  });

  const novos = orders.filter((o) => o.status === 'novo').length;

  useEffect(() => {
    if (primeiraCarregadaRef.current) {
      primeiraCarregadaRef.current = false;
      novosAnteriorRef.current = novos;
      return;
    }
    if (novos > novosAnteriorRef.current) {
      tocarSom();
    }
    novosAnteriorRef.current = novos;
  }, [novos]);

  const advance = useCallback(
    async (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (!order || !token) return;
      setOrders((os) =>
        os.map((o) => {
          if (o.id !== id) return o;
          const idx = FLOW.indexOf(o.status);
          const next = FLOW[idx + 1];
          return next ? { ...o, status: next } : o;
        }),
      );
      if (order._id) {
        try {
          await LojistaService.avancarStatus(order._id, token);
        } catch {
          fetchPedidos();
        }
      }
    },
    [orders, token, fetchPedidos],
  );

  const handleCancelar = useCallback(
    async (dbId: string, motivo: string) => {
      if (!token) return;
      setCancelModal(null);
      setOrders((os) => os.filter((o) => o._id !== dbId));
      try {
        await LojistaService.cancelarPedido(dbId, token, motivo);
      } catch {
        fetchPedidos();
      }
    },
    [token, fetchPedidos],
  );

  // Ordem de prioridade: novos primeiro (precisam de ação imediata), depois o fluxo.
  const PRIORIDADE: Record<OrderStatus, number> = {
    novo: 0,
    preparando: 1,
    pronto: 2,
    despachado: 3,
    entregue: 4,
  };
  const ordenarPorPrioridade = (lista: Order[]) =>
    [...lista].sort((a, b) => (PRIORIDADE[a.status] ?? 9) - (PRIORIDADE[b.status] ?? 9));

  const list = ordenarPorPrioridade(
    filter === 'todos' ? orders : orders.filter((o) => o.status === filter),
  );

  const filters: { id: 'todos' | OrderStatus; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'novo', label: 'Novos' },
    { id: 'preparando', label: 'Preparando' },
    { id: 'pronto', label: 'Prontos' },
    { id: 'despachado', label: 'Despachados' },
    { id: 'entregue', label: 'Concluídos' },
  ];

  // Borda laranja fixa para destacar itens novos. (Antes era um pulse animado via
  // borderColor com useNativeDriver:false, que conflitava com animações nativas e
  // disparava "JS driven animation on a node moved to native" ao re-renderizar a lista.)
  const borderColor = '#DE6708';

  return {
    // store-derived
    lojaNome,
    // data
    orders,
    list,
    loading,
    error,
    novos,
    openTickets,
    filters,
    filter,
    setFilter,
    // navigation
    screen,
    setScreen,
    selected,
    setSelected,
    // modals
    showSomModal,
    setShowSomModal,
    cancelModal,
    setCancelModal,
    // refresh anim
    recarregando,
    spinAnim,
    borderColor,
    // actions
    fetchPedidos,
    handleRefresh,
    advance,
    handleCancelar,
    // sound
    tocarSom,
    somAtual,
    salvarSom,
  };
}
