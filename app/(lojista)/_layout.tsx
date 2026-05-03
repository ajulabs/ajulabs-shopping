import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function LojistaLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#17258E',
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
        name="pedidos"
        options={{ title: 'Pedidos', tabBarIcon: ({ color }) => <TabIcon emoji="📋" color={color} /> }}
      />
      <Tabs.Screen
        name="produtos"
        options={{ title: 'Produtos', tabBarIcon: ({ color }) => <TabIcon emoji="📦" color={color} /> }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}