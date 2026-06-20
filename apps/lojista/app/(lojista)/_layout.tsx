import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthLojistaStore } from '../../src/store';
import { NotificationToast } from '../../src/shared/ui/NotificationToast';
import { useTicketToasts } from '../../src/features/lojista/tickets';

export default function LojistaLayout() {
  const papel = useAuthLojistaStore((s) => s.papel);
  const isLojistaDono = useAuthLojistaStore((s) => s.isLojistaDono);
  const isFuncionario = !isLojistaDono && papel === 'funcionario';
  const insets = useSafeAreaInsets();

  const { toast, setToast } = useTicketToasts();

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
            height: 64 + insets.bottom,
            paddingBottom: insets.bottom + 8,
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
