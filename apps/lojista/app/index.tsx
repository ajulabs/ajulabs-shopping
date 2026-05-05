import { View, Text } from 'react-native';
import { colors } from '@ajulabs/theme';

export default function LojistaHome() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.n50 }}>
      <Text style={{ fontSize: 32 }}>🏪</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.navy, marginTop: 8 }}>
        AjuLabs Lojista
      </Text>
      <Text style={{ fontSize: 13, color: colors.n600, marginTop: 4 }}>
        Em desenvolvimento
      </Text>
    </View>
  );
}