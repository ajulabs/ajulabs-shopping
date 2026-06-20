import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../../../theme';

export function StoreAvatar({ nome, size = 56 }: { nome: string; size?: number }) {
  const initials = nome
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.25 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.32 }]}>{initials || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: { color: '#fff', fontWeight: '700' },
});
