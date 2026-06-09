import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ToastAndroid,
  BackHandler,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../src/features/entregador/home';
import { ActiveScreen, type Stage } from '../src/features/entregador/corrida-ativa';
import {
  EntregasAndamentoScreen,
  type ActiveRideWithStage,
} from '../src/features/entregador/andamento/ui/EntregasAndamentoScreen';
import { EarningsScreen } from '../src/features/entregador/ganhos';
import { ProfileScreen } from '../src/features/entregador/perfil';
import { EnderecoScreen } from '../src/features/entregador/perfil/ui/EnderecoScreen';
import { DadosBancariosScreen } from '../src/features/entregador/perfil/ui/DadosBancariosScreen';
import { DocumentosScreen } from '../src/features/entregador/perfil/ui/DocumentosScreen';
import { NotificacoesScreen } from '../src/features/entregador/perfil/ui/NotificacoesScreen';
import { AvaliacoesScreen as AvaliacoesScreenEntregador } from '../src/features/entregador/avaliacoes';
import { SegurancaScreen } from '../src/features/entregador/perfil/ui/SegurancaScreen';
import { VeiculoScreen } from '../src/features/entregador/perfil/ui/VeiculoScreen';
import { ConversasEntregadorScreen } from '../src/features/entregador/chat/ui/ConversasEntregadorScreen';
import { ChatPedidoEntregadorScreen } from '../src/features/entregador/chat/ui/ChatPedidoEntregadorScreen';
import { OnboardingScreen } from '../src/features/entregador/onboarding';
import { useAuthEntregadorStore } from '../src/store';
import { useHardwareBack } from '../src/hooks';
import { EntregadorService } from '../src/lib/authServices';

type Tab = 'home' | 'entregas' | 'ganhos' | 'perfil';

function CourierNav({
  tab,
  onChange,
  activeCount,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
  activeCount: number;
}) {
  const insets = useSafeAreaInsets();
  const items = [
    { id: 'home' as Tab, icon: 'map', label: 'Corridas' },
    { id: 'entregas' as Tab, icon: 'bicycle', label: 'Entregas' },
    { id: 'ganhos' as Tab, icon: 'wallet', label: 'Ganhos' },
    { id: 'perfil' as Tab, icon: 'person', label: 'Perfil' },
  ] as const;

  return (
    <View style={[nav.bar, { paddingBottom: insets.bottom + 10 }]}>
      {items.map((it) => {
        const active = tab === it.id;
        const showBadge = it.id === 'entregas' && activeCount > 0;
        return (
          <TouchableOpacity
            key={it.id}
            style={nav.item}
            onPress={() => onChange(it.id)}
            activeOpacity={0.7}
          >
            <View style={[nav.iconWrap, active && { backgroundColor: 'rgba(242,118,15,0.12)' }]}>
              <Ionicons
                name={active ? (it.icon as any) : (`${it.icon}-outline` as any)}
                size={22}
                color={active ? '#F2760F' : '#9099B3'}
              />
              {showBadge && (
                <View style={nav.badge}>
                  <Text style={nav.badgeText}>{activeCount}</Text>
                </View>
              )}
            </View>
            <Text style={[nav.label, active && { color: '#F2760F', fontWeight: '600' }]}>
              {it.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const nav = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4E7F1',
    paddingTop: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    position: 'relative',
  },
  label: { fontSize: 10.5, fontWeight: '500', color: '#9099B3', letterSpacing: 0.1 },
  badge: {
    position: 'absolute',
    top: -2,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F2760F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
});

type Screen =
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

function ApprovalScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
      }}
    >
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: '#39FF89',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Ionicons name="checkmark" size={48} color="#002B12" />
      </View>
      <Text
        style={{
          fontSize: 26,
          fontWeight: '800',
          color: '#000933',
          marginBottom: 10,
          textAlign: 'center',
        }}
      >
        Cadastro enviado!
      </Text>
      <View style={{ alignItems: 'center', maxWidth: 280, marginBottom: 28, gap: 4 }}>
        <Text style={{ fontSize: 14, color: '#9099B3', textAlign: 'center', lineHeight: 21 }}>
          Análise em até 24h. Como essa é uma demo, já liberamos tudo — bora começar a rodar
        </Text>
        <Ionicons name="car-sport" size={18} color="#9099B3" />
      </View>
      <TouchableOpacity
        style={{
          backgroundColor: '#F2760F',
          borderRadius: 14,
          paddingVertical: 16,
          paddingHorizontal: 40,
        }}
        onPress={onContinue}
        activeOpacity={0.85}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Começar a rodar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export function CourierApp() {
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
  const [activeRides, setActiveRides] = useState<ActiveRideWithStage[]>([]);
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
              id: raw.id,
              loja: {
                nome: raw.loja?.nome ?? '–',
                logoUrl: raw.loja?.logoUrl ?? undefined,
                endereco: raw.loja?.endereco
                  ? `${raw.loja.endereco.rua}, ${raw.loja.endereco.numero}`
                  : '–',
                bairro: raw.loja?.endereco?.bairro ?? '–',
                cep: raw.loja?.endereco?.cep ?? undefined,
                lat: raw.loja?.endereco?.lat ?? undefined,
                lng: raw.loja?.endereco?.lng ?? undefined,
              },
              cliente: {
                nome: raw.consumidor?.nome ?? 'Cliente',
                telefone: raw.consumidor?.telefone ?? undefined,
                endereco: raw.enderecoEntrega
                  ? `${raw.enderecoEntrega.rua}, ${raw.enderecoEntrega.numero}`
                  : '–',
                bairro: raw.enderecoEntrega?.bairro ?? '–',
                complemento: raw.enderecoEntrega?.complemento ?? undefined,
                cep: raw.enderecoEntrega?.cep ?? undefined,
                lat: raw.enderecoEntrega?.lat ?? undefined,
                lng: raw.enderecoEntrega?.lng ?? undefined,
              },
              ganho: Number(raw.taxaEntrega ?? 0) * 0.8,
              distancia: Number(raw.distanciaKm ?? raw.distancia ?? 0),
              duracao: Number(raw.duracaoMin ?? raw.duracao ?? 20),
              codigo: raw.codigoEntrega ?? raw.id.slice(-4).toUpperCase(),
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

  const handleAcceptRide = (ride: Omit<ActiveRideWithStage, 'stage'>) => {
    if (activeRides.length >= 2) return;
    const newRide: ActiveRideWithStage = { ...ride, stage: 'to-store' };
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

  const handleSelectRide = (ride: ActiveRideWithStage) => {
    setSelectedRideId(ride.id);
    setScreen('active');
  };

  if (screen === 'onboarding') {
    return (
      <OnboardingScreen
        onDone={(r) => {
          if (r === 'cancel') logout();
          else setScreen('approval');
        }}
      />
    );
  }

  if (screen === 'approval') return <ApprovalScreen onContinue={() => setScreen('main')} />;
  if (screen === 'documentos') return <DocumentosScreen onBack={() => setScreen('main')} />;
  if (screen === 'dados-bancarios')
    return <DadosBancariosScreen onBack={() => setScreen('main')} />;
  if (screen === 'notificacoes') return <NotificacoesScreen onBack={() => setScreen('main')} />;
  if (screen === 'avaliacoes')
    return <AvaliacoesScreenEntregador onBack={() => setScreen('main')} />;
  if (screen === 'seguranca') return <SegurancaScreen onBack={() => setScreen('main')} />;
  if (screen === 'endereco') return <EnderecoScreen onBack={() => setScreen('main')} />;
  if (screen === 'veiculo') return <VeiculoScreen onBack={() => setScreen('main')} />;
  if (screen === 'conversas')
    return (
      <ConversasEntregadorScreen
        onBack={() => setScreen('main')}
        onAbrirChat={(pedidoId) => {
          setChatPedidoId(pedidoId);
          setChatFromScreen('conversas');
          setScreen('chat');
        }}
      />
    );
  if (screen === 'chat' && chatPedidoId)
    return (
      <ChatPedidoEntregadorScreen
        pedidoId={chatPedidoId}
        initialDestinatario={chatFromScreen === 'active' ? 'LOJISTA' : 'CONSUMER'}
        onBack={() => setScreen(chatFromScreen === 'active' ? 'active' : 'conversas')}
      />
    );

  if (screen === 'active' && selectedRide) {
    return (
      <ActiveScreen
        ride={selectedRide}
        initialStage={selectedRide.stage}
        onBack={handleActiveBack}
        onFinish={handleActiveFinish}
        onOpenChat={(pedidoId) => {
          setChatPedidoId(pedidoId);
          setChatFromScreen('active');
          setScreen('chat');
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <View style={[{ flex: 1 }, tab !== 'home' && { display: 'none' }]}>
          <HomeScreen
            onAcceptRide={handleAcceptRide}
            activeRidesCount={activeRides.length}
            online={isOnline}
            onToggleOnline={setIsOnline}
            isFocused={tab === 'home'}
          />
        </View>
        {tab === 'entregas' && (
          <EntregasAndamentoScreen rides={activeRides} onSelectRide={handleSelectRide} />
        )}
        {tab === 'ganhos' && <EarningsScreen />}
        {tab === 'perfil' && (
          <ProfileScreen
            onLogout={logout}
            onNavigate={(dest) => {
              if (dest === 'conversas') {
                setScreen('conversas');
                return;
              }
              setScreen(dest);
            }}
          />
        )}
      </View>
      <CourierNav tab={tab} onChange={setTab} activeCount={activeRides.length} />
    </View>
  );
}
