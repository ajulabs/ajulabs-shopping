import { View, Text } from 'react-native';

export default function VitrinasScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F7FB' }}>
      <Text style={{ fontSize: 32 }}>🛍️</Text>
      <Text style={{ fontSize: 16, color: '#2A3156', fontWeight: '600', marginTop: 8 }}>Lojas</Text>
      <Text style={{ fontSize: 13, color: '#9099B3', marginTop: 4 }}>Em desenvolvimento</Text>
    </View>
  );
}