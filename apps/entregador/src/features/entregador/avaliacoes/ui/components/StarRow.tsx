import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function StarRow({ nota, size = 16 }: { nota: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= nota ? 'star' : 'star-outline'} size={size} color="#F59E0B" />
      ))}
    </View>
  );
}
