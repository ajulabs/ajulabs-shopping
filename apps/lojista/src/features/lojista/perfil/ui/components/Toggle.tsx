import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../../../theme';

export function Toggle({
  value,
  onValueChange,
  activeColor = colors.orange,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  activeColor?: string;
}) {
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      activeOpacity={0.85}
      style={[styles.toggleTrack, { backgroundColor: value ? activeColor : colors.n300 }]}
    >
      <View style={[styles.toggleThumb, { transform: [{ translateX: value ? 22 : 2 }] }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggleTrack: { width: 48, height: 28, borderRadius: 14, justifyContent: 'center' },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
