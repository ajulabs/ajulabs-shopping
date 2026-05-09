import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../src/features/entregador/home';
import { ActiveScreen } from '../src/features/entregador/corrida-ativa';
import { EarningsScreen } from '../src/features/entregador/ganhos';
import { ProfileScreen } from '../src/features/entregador/perfil';
import { DadosBancariosScreen } from '../src/features/entregador/perfil/ui/DadosBancariosScreen';
import { DocumentosScreen } from '../src/features/entregador/perfil/ui/DocumentosScreen';
import { NotificacoesScreen } from '../src/features/entregador/perfil/ui/NotificacoesScreen';
import { SegurancaScreen } from '../src/features/entregador/perfil/ui/SegurancaScreen';
import { VeiculoScreen } from '../src/features/entregador/perfil/ui/VeiculoScreen';
import { OnboardingScreen } from '../src/features/entregador/onboarding';
import { useAuthEntregadorStore } from '../src/store';

interface ActiveRide {
  id: string;
  loja: { nome: string; endereco: string; bairro: string };
  cliente: { nome: string; endereco: string; bairro: string; complemento?: string };
  ganho: number;
  distancia: number;
  duracao: number;
  codigo: string;
}

type Tab = 'home' | 'ganhos' | 'perfil';

function CourierNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const items = [
    { id: 'home' as Tab, icon: 'map', label: 'Corridas' },
    { id: 'ganhos' as Tab, icon: 'wallet', label: 'Ganhos' },
    { id: 'perfil' as Tab, icon: 'person', label: 'Perfil' },
  ] as const;

  return (
    <View style={nav.bar}>
      {items.map((it) => {
        const active = tab === it.id;
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
    paddingVertical: 8,
    paddingBottom: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  iconWrap: {
    padding: '4px 12px' as any,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#9099B3',
    letterSpacing: 0.1,
  },
});

type Screen = 'onboarding' | 'approval' | 'main' | 'active' | 'documentos' | 'veiculo' | 'dados-bancarios' | 'notificacoes' | 'seguranca';

function ApprovalScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 30 }}
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
      <Text style={{ fontSize: 26, fontWeight: '800', color: '#000933', marginBottom: 10, textAlign: 'center' }}>
        Cadastro enviado!
      </Text>
      <View style={{ alignItems: 'center', maxWidth: 280, marginBottom: 28, gap: 4 }}>
        <Text style={{ fontSize: 14, color: '#9099B3', textAlign: 'center', lineHeight: 21 }}>
          Análise em até 24h. Como essa é uma demo, já liberamos tudo — bora começar a rodar
        </Text>
        <Ionicons name="car-sport" size={18} color="#9099B3" />
      </View>
      <TouchableOpacity
        style={{ backgroundColor: '#F2760F', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40 }}
        onPress={onContinue}
        activeOpacity={0.85}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Começar a rodar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export function CourierApp() {
  const needsOnboarding = useAuthEntregadorStore(s => s.needsOnboarding);
  const logout = useAuthEntregadorStore(s => s.logout);
  const [screen, setScreen] = useState<Screen>(needsOnboarding ? 'onboarding' : 'main');
  const [tab, setTab] = useState<Tab>('home');
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);

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

  if (screen === 'approval') {
    return <ApprovalScreen onContinue={() => setScreen('main')} />;
  }

  if (screen === 'documentos') {
    return <DocumentosScreen onBack={() => setScreen('main')} />;
  }

  if (screen === 'dados-bancarios') {
    return <DadosBancariosScreen onBack={() => setScreen('main')} />;
  }

  if (screen === 'notificacoes') {
    return <NotificacoesScreen onBack={() => setScreen('main')} />;
  }

  if (screen === 'seguranca') {
    return <SegurancaScreen onBack={() => setScreen('main')} />;
  }

  if (screen === 'veiculo') {
    return <VeiculoScreen onBack={() => setScreen('main')} />;
  }

  if (screen === 'active' && activeRide) {
    return (
      <ActiveScreen
        ride={activeRide}
        onFinish={() => {
          setActiveRide(null);
          setScreen('main');
          setTab('ganhos');
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'home' && (
          <HomeScreen
            onAcceptRide={(ride) => {
              setActiveRide(ride);
              setScreen('active');
            }}
          />
        )}
        {tab === 'ganhos' && <EarningsScreen />}
        {tab === 'perfil' && <ProfileScreen onLogout={logout} onNavigate={(dest) => setScreen(dest)} />}
      </View>
      <CourierNav tab={tab} onChange={setTab} />
    </View>
  );
}
