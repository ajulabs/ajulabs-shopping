import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function ConsumerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#F2760F',
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
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="chat"
        options={{ title: 'Aju', tabBarIcon: ({ color }) => <TabIcon emoji="🤖" color={color} /> }}
      />
      <Tabs.Screen
        name="vitrines"
        options={{ title: 'Lojas', tabBarIcon: ({ color }) => <TabIcon emoji="🛍️" color={color} /> }}
      />
      <Tabs.Screen
        name="carrinho"
        options={{ title: 'Carrinho', tabBarIcon: ({ color }) => <TabIcon emoji="🛒" color={color} /> }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{ title: 'Pedidos', tabBarIcon: ({ color }) => <TabIcon emoji="📦" color={color} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}