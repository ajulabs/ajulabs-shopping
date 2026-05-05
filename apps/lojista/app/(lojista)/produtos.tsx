import { View, Text } from 'react-native';
import { colors } from '@ajulabs/theme';

export default function ProdutosScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.n50 }}>
      <Text style={{ fontSize: 32 }}>📦</Text>
      <Text style={{ fontSize: 16, color: colors.n800, fontWeight: '600', marginTop: 8 }}>Novo Produto</Text>
      <Text style={{ fontSize: 13, color: colors.n500, marginTop: 4 }}>Em desenvolvimento</Text>
    </View>
  );
}