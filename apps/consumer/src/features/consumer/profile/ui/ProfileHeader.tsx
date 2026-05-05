import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@ajulabs/theme';
import { USUARIO_MOCK } from '@ajulabs/api-client';

function getIniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
}

export function ProfileHeader() {
  const user = USUARIO_MOCK;
  const iniciais = getIniciais(user.nome);

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarTxt}>{iniciais}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.nome}>{user.nome}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>⚡ Cliente desde 2024</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:       { flexDirection: 'row', alignItems: 'center', gap: 14,
                backgroundColor: colors.n0, borderRadius: 16, padding: 16,
                borderWidth: 1, borderColor: colors.n200 },

  avatar:     { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.orange,
                alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { color: '#fff', fontWeight: '700', fontSize: 26 },

  nome:       { fontSize: 18, fontWeight: '700', color: colors.navy },
  email:      { fontSize: 12, color: colors.n600, marginTop: 2 },

  badgeRow:   { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge:      { backgroundColor: colors.orange100, paddingHorizontal: 10, paddingVertical: 3,
                borderRadius: 99 },
  badgeTxt:   { fontSize: 11, fontWeight: '600', color: colors.orange600 },
});