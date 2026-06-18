import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Ionicons
          key={i}
          name={i < Math.floor(value) ? 'star' : i < value ? 'star-half' : 'star-outline'}
          size={size}
          color={colors.orange}
        />
      ))}
    </View>
  );
}
