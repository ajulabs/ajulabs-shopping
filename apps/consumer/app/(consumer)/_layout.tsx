// app/(consumer)/_layout.tsx
import { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore, calcularQuantidadeItens, useThemeStore } from '../../src/store';
import { colors } from '@ajulabs/theme';

export default function ConsumerLayout() {
  const itensPorLoja = useCartStore(s => s.itensPorLoja);
  const quantidadeItens = useMemo(
    () => calcularQuantidadeItens(itensPorLoja),
    [itensPorLoja]
  );
  const isDark = useThemeStore(s => s.isDark);

  return (
    <Tabs
      initialRouteName='chat'
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
            <Ionicons
              name={focused ? 'cart' : 'cart-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen name="vitrine/[id]"  options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="checkout"      options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="tracking/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="enderecos"     options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="pagamento"     options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="favoritos"     options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="notificacoes"  options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="ajustes"       options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
