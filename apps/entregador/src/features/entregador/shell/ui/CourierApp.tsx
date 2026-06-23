import { View } from 'react-native';
import { HomeScreen } from '../../home';
import { ActiveScreen } from '../../corrida-ativa';
import { EntregasAndamentoScreen } from '../../andamento';
import { EarningsScreen } from '../../ganhos';
import {
  ProfileScreen,
  EnderecoScreen,
  DadosBancariosScreen,
  DocumentosScreen,
  NotificacoesScreen,
  SegurancaScreen,
  VeiculoScreen,
} from '../../perfil';
import { AvaliacoesScreen as AvaliacoesScreenEntregador } from '../../avaliacoes';
import { ConversasEntregadorScreen, ChatPedidoEntregadorScreen } from '../../chat';
import { OnboardingScreen } from '../../onboarding';
import { useCourierShell } from '../model/useCourierShell';
import { CourierNav } from './components/CourierNav';
import { ApprovalScreen } from './components/ApprovalScreen';

export function CourierApp() {
  const {
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
    handleAcceptRide,
    handleActiveBack,
    handleActiveFinish,
    handleSelectRide,
    openChat,
  } = useCourierShell();

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
        onAbrirChat={(pedidoId) => openChat(pedidoId, 'conversas')}
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
        onOpenChat={(pedidoId) => openChat(pedidoId, 'active')}
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
