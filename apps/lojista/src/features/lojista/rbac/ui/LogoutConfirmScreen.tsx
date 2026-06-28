import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthLojistaStore } from '../../../../store';
import { useTheme } from '../../../../shared/hooks';

export function LogoutConfirmScreen() {
  const router = useRouter();
  const logout = useAuthLojistaStore((s) => s.logout);
  const theme = useTheme();

  return (
    <View style={s.overlay}>
      <View style={[s.box, { backgroundColor: theme.surf }]}>
        <View style={s.iconWrap}>
          <Ionicons name="log-out-outline" size={28} color="#E24B4A" />
        </View>
        <Text style={[s.title, { color: theme.text }]}>Sair da conta</Text>
        <Text style={[s.msg, { color: theme.textSec }]}>
          Tem certeza que deseja sair? Você precisará fazer login novamente para acessar sua conta.
        </Text>
        <TouchableOpacity style={s.btnSair} onPress={logout} activeOpacity={0.85}>
          <Text style={s.btnSairText}>Sim, quero sair</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btnCancel, { borderColor: theme.border }]}
          onPress={() => router.navigate('/(lojista)/pedidos')}
          activeOpacity={0.85}
        >
          <Text style={[s.btnCancelText, { color: theme.textSec }]}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#000933', marginBottom: 8 },
  msg: {
    fontSize: 14,
    color: '#5A6480',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  btnSair: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: '#E24B4A',
    alignItems: 'center',
    marginBottom: 10,
  },
  btnSairText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  btnCancel: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  btnCancelText: { fontSize: 15, fontWeight: '600', color: '#5A6480' },
});
