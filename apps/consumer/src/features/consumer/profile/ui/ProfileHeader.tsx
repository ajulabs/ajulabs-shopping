import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import { useAuthStore } from '../../../../store';

function getIniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
}

interface Props {
  isDark?: boolean;
}

export function ProfileHeader({ isDark = false }: Props) {
  const nome = useAuthStore(s => s.nome) ?? 'Usuário';
  const email = useAuthStore(s => s.email) ?? '';
  const iniciais = getIniciais(nome);

  const surf    = isDark ? colors.surfDark : colors.n0;
  const border  = isDark ? 'rgba(255,255,255,0.08)' : colors.n200;
  const text    = isDark ? colors.n0      : colors.navy;
  const textSec = isDark ? 'rgba(255,255,255,0.55)' : colors.n600;

  return (
    <View style={[styles.card, { backgroundColor: surf, borderColor: border }]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarTxt}>{iniciais}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.nome, { color: text }]}>{nome}</Text>
        {!!email && <Text style={[styles.email, { color: textSec as string }]}>{email}</Text>}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="flash" size={11} color={colors.orange600} />
            <Text style={styles.badgeTxt}>Cliente AjuLabs</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:       { flexDirection: 'row', alignItems: 'center', gap: 14,
                borderRadius: 16, padding: 16, borderWidth: 1 },

  avatar:     { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.orange,
                alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { color: '#fff', fontWeight: '700', fontSize: 26 },

  nome:       { fontSize: 18, fontWeight: '700' },
  email:      { fontSize: 12, marginTop: 2 },

  badgeRow:   { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: colors.orange100, paddingHorizontal: 10, paddingVertical: 3,
                borderRadius: 99 },
  badgeTxt:   { fontSize: 11, fontWeight: '600', color: colors.orange600 },
});
