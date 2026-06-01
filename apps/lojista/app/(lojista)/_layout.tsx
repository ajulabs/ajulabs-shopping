import { useState } from 'react';
import { View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthLojistaStore } from '../../src/features/lojista/auth/model/store';
import { useTicketRealtime } from '@ajulabs/realtime';
import { NotificationToast, ToastData } from '../../src/components/NotificationToast';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export default function LojistaLayout() {
  const papel = useAuthLojistaStore((s) => s.papel);
  const isLojistaDono = useAuthLojistaStore((s) => s.isLojistaDono);
  const isFuncionario = !isLojistaDono && papel === 'funcionario';
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const router = useRouter();

  const [toast, setToast] = useState<ToastData | null>(null);

  useTicketRealtime({
    apiUrl: API_URL,
    ticketId: null,
    roomId: lojaId ?? null,
    roomType: 'lojista',
    enabled: !!lojaId,
    onMensagem: (msg) => {
      if (msg.remetente !== 'consumidor') return;
      const nome = msg.remetenteNome ?? 'Consumidor';
      setToast({
        type: 'mensagem',
        title: `Nova mensagem de ${nome}`,
        body: msg.texto,
        onPress: () =>
          router.navigate({
            pathname: '/(lojista)/tickets',
            params: { autoTicketId: msg.ticketId },
          } as any),
      });
    },
    onNovo: (payload) => {
      const nome = payload.consumidorNome ?? 'Consumidor';
      setToast({
        type: 'novo',
        title: `Novo ticket de ${nome}`,
        body: payload.motivo,
        onPress: () =>
          router.navigate({
            pathname: '/(lojista)/tickets',
            params: { autoTicketId: payload.id },
          } as any),
      });
    },
  });

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        initialRouteName="pedidos"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#DE6708',
          tabBarInactiveTintColor: '#9099B3',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E4E7F1',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 88 : 64,
            paddingBottom: Platform.OS === 'ios' ? 28 : 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10.5,
            fontWeight: '600',
            letterSpacing: 0.1,
          },
        }}
      >
        <Tabs.Screen
          name="pedidos"
          options={{
            title: 'Pedidos',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'clipboard' : 'clipboard-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="produtos"
          options={{
            title: 'Produtos',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="vendas"
          options={{
            title: 'Vendas',
            ...(isFuncionario ? { href: null } : {}),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'bar-chart' : 'bar-chart-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen name="onboarding" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="tickets" options={{ href: null }} />
        <Tabs.Screen name="conversas" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen
          name="chat-pedido/[pedidoId]"
          options={{ href: null, tabBarStyle: { display: 'none' } }}
        />
        <Tabs.Screen name="notificacoes" options={{ href: null }} />
        <Tabs.Screen name="avaliacoes" options={{ href: null }} />
        <Tabs.Screen
          name="logistica"
          options={{
            title: 'Logística',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'bicycle' : 'bicycle-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            title: isFuncionario ? 'Sair' : 'Perfil',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={isFuncionario ? 'log-out-outline' : focused ? 'person' : 'person-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      <NotificationToast toast={toast} onHide={() => setToast(null)} />
    </View>
  );
}
