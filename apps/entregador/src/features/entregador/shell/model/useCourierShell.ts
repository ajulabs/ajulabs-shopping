import { useState, useEffect, useCallback, useRef } from 'react';
import { ToastAndroid, Platform } from 'react-native';
import { type Stage } from '../../../../entities/corrida';
import { type RideWithStage, type Ride } from '../../../../entities/corrida';
import { mapToRide } from '../../../../entities/corrida';
import { useAuthEntregadorStore } from '../../../../store';
import { useHardwareBack } from '../../../../shared/hooks';
import { EntregadorService } from '../../../../shared/lib/authServices';

export type Tab = 'home' | 'entregas' | 'ganhos' | 'perfil';

export type Screen =
  | 'onboarding'
  | 'approval'
  | 'main'
  | 'active'
  | 'documentos'
  | 'veiculo'
  | 'dados-bancarios'
  | 'notificacoes'
  | 'avaliacoes'
  | 'seguranca'
  | 'endereco'
  | 'conversas'
  | 'chat';

export function useCourierShell() {
  const needsOnboarding = useAuthEntregadorStore((s) => s.needsOnboarding);
  const logout = useAuthEntregadorStore((s) => s.logout);
  const token = useAuthEntregadorStore((s) => s.token);

  const [screen, setScreen] = useState<Screen>(needsOnboarding ? 'onboarding' : 'main');
  const [tab, setTab] = useState<Tab>('home');
  const [isOnline, setIsOnline] = useState(false);
  const [chatPedidoId, setChatPedidoId] = useState<string | null>(null);
  const [chatFromScreen, setChatFromScreen] = useState<'conversas' | 'active'>('conversas');

  // Marca o instante do último "voltar" na tela raiz, para o padrão
  // "aperte voltar novamente para sair" (evita fechar o app sem querer).
  const lastBackPressRef = useRef(0);

  // Botão físico de voltar do Android: respeita a navegação por estado interno.
  // Ordem: chat → tela origem; sub-tela de perfil → main; tab≠home → home; senão sai.
  useHardwareBack(() => {
    if (screen === 'chat') {
      setScreen(chatFromScreen === 'active' ? 'active' : 'conversas');
      return true;
    }
    const subTelas: Screen[] = [
      'documentos',
      'veiculo',
      'dados-bancarios',
      'notificacoes',
      'avaliacoes',
      'seguranca',
      'endereco',
      'conversas',
    ];
    if (subTelas.includes(screen)) {
      setScreen('main');
      return true;
    }
    // Em 'main' mas numa tab diferente de home → volta pra home antes de sair
    if (screen === 'main' && tab !== 'home') {
      setTab('home');
      return true;
    }
    // Tela raiz (home): exige dois toques de voltar em até 2s para sair,
    // evitando fechar o app por engano.
    const agora = Date.now();
    if (agora - lastBackPressRef.current < 2000) {
      return false; // segundo toque dentro da janela → deixa o app fechar
    }
    lastBackPressRef.current = agora;
    if (Platform.OS === 'android') {
      ToastAndroid.show('Aperte voltar novamente para sair', ToastAndroid.SHORT);
    }
    return true; // primeiro toque → trata o evento (não fecha)
  });

  // Múltiplas entregas (máx 2)
  const [activeRides, setActiveRides] = useState<RideWithStage[]>([]);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);

  // Sincroniza as corridas ativas com o backend. Fonte da verdade = servidor:
  // adiciona novas, remove as concluídas (não retornadas) e preserva o `stage`
  // local (to-store / at-store / to-customer) das que já estavam em andamento.
  const refreshActiveRides = useCallback(() => {
    if (!token) return;
    EntregadorService.buscarCorridasAtivas(token)
      .then((corridas) => {
        setActiveRides((prev) => {
          const prevById = new Map(prev.map((r) => [r.id, r]));
          return corridas.map((raw: any) => {
            const existing = prevById.get(raw.id);
            return {
              ...mapToRide(raw),
              stage:
                existing?.stage ?? (raw.status === 'saiu_entrega' ? 'to-customer' : 'to-store'),
            };
          });
        });
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    refreshActiveRides();
  }, [refreshActiveRides]);

  const selectedRide = activeRides.find((r) => r.id === selectedRideId) ?? null;

  const handleAcceptRide = (ride: Ride) => {
    if (activeRides.length >= 2) return;
    const newRide: RideWithStage = { ...ride, stage: 'to-store' };
    setActiveRides((prev) => [...prev, newRide]);
    setSelectedRideId(newRide.id);
    setScreen('active');
  };

  const handleActiveBack = (currentStage: Stage) => {
    setActiveRides((prev) =>
      prev.map((r) => (r.id === selectedRideId ? { ...r, stage: currentStage } : r)),
    );
    setSelectedRideId(null);
    setScreen('main');
    setTab('entregas');
  };

  const handleActiveFinish = () => {
    const remaining = activeRides.filter((r) => r.id !== selectedRideId);
    setActiveRides(remaining);
    setSelectedRideId(null);
    setScreen('main');
    setTab(remaining.length > 0 ? 'entregas' : 'ganhos');
    // Re-sincroniza com o backend (confirma a remoção da entrega concluída e
    // pega qualquer mudança feita em outro dispositivo).
    refreshActiveRides();
  };

  const handleSelectRide = (ride: RideWithStage) => {
    setSelectedRideId(ride.id);
    setScreen('active');
  };

  const openChat = (pedidoId: string, from: 'conversas' | 'active') => {
    setChatPedidoId(pedidoId);
    setChatFromScreen(from);
    setScreen('chat');
  };

  return {
    logout,
    screen,
    setScreen,
    tab,
    setTab,
    isOnline,
    setIsOnline,
    chatPedidoId,
    chatFromScreen,
    activeRides,
    selectedRide,
    refreshActiveRides,
    handleAcceptRide,
    handleActiveBack,
    handleActiveFinish,
    handleSelectRide,
    openChat,
  };
}
