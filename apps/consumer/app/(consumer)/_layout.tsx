import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore, calcularQuantidadeItens } from '../../src/store';
import { useAuthStore } from '../../src/store';
import { useTheme } from '../../src/hooks';
import { colors } from '@ajulabs/theme';
import { useTicketRealtime } from '@ajulabs/realtime';
import { NotificationToast, ToastData } from '../../src/components/NotificationToast';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const STATUS_LABELS: Record<string, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  resolvido: 'Resolvido',
  cancelado: 'Cancelado',
};

export default function ConsumerLayout() {
  const itensPorLoja = useCartStore((s) => s.itensPorLoja);
  const quantidadeItens = useMemo(() => calcularQuantidadeItens(itensPorLoja), [itensPorLoja]);
  const { isDark } = useTheme();
  const userId = useAuthStore((s) => s.userId);
  const router = useRouter();

  const [toast, setToast] = useState<ToastData | null>(null);

  useTicketRealtime({
    apiUrl: API_URL,
    ticketId: null,
    roomId: userId ?? null,
    roomType: 'usuario',
    enabled: !!userId,
    onMensagem: (msg) => {
      if (msg.remetente !== 'lojista') return;
      const nome = msg.remetenteNome ?? 'Loja';
      setToast({
        type: 'mensagem',
        title: `Nova mensagem de ${nome}`,
        body: msg.texto,
        onPress: () => router.push(`/(consumer)/tickets/${msg.ticketId}` as any),
      });
    },
    onStatus: ({ ticketId, status }) => {
      setToast({
        type: 'status',
        title: 'Status do ticket atualizado',
        body: `Seu ticket foi atualizado para: ${STATUS_LABELS[status] ?? status}`,
        onPress: () => router.push(`/(consumer)/tickets/${ticketId}` as any),
      });
    },
  });

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        initialRouteName="chat"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.orange,
          tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.4)' : '#9099B3',
          tabBarStyle: {
            backgroundColor: isDark ? colors.surfDark : '#FFFFFF',
            borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#E4E7F1',
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
          name="chat"
          options={{
            title: 'Aju',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'chatbubble' : 'chatbubble-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="vitrines"
          options={{
            title: 'Vitrines',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'storefront' : 'storefront-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="carrinho"
          options={{
            title: 'Carrinho',
            tabBarBadge: quantidadeItens > 0 ? quantidadeItens : undefined,
            tabBarBadgeStyle: {
              backgroundColor: colors.orange,
              color: '#FFFFFF',
              fontSize: 10,
              fontWeight: '700',
              minWidth: 18,
              height: 18,
            },
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'cart' : 'cart-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="pedidos"
          options={{
            title: 'Pedidos',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="tickets" options={{ href: null }} />
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tickets/[id]"
          options={{ href: null, tabBarStyle: { display: 'none' } }}
        />
        <Tabs.Screen
          name="vitrine/[id]"
          options={{ href: null, tabBarStyle: { display: 'none' } }}
        />
        <Tabs.Screen
          name="produto/[id]"
          options={{ href: null, tabBarStyle: { display: 'none' } }}
        />
        <Tabs.Screen name="checkout" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen
          name="tracking/[id]"
          options={{ href: null, tabBarStyle: { display: 'none' } }}
        />
        <Tabs.Screen name="enderecos" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="pagamento" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="favoritos" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen
          name="notificacoes"
          options={{ href: null, tabBarStyle: { display: 'none' } }}
        />
        <Tabs.Screen name="ajustes" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="conversas" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen
          name="chat-pedido/[pedidoId]"
          options={{ href: null, tabBarStyle: { display: 'none' } }}
        />
      </Tabs>

      <NotificationToast toast={toast} onHide={() => setToast(null)} />
    </View>
  );
}
