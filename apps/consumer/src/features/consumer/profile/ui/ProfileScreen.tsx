import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import { ProfileHeader } from './ProfileHeader';
import { ProfileMenu } from './ProfileMenu';
import { useAuthStore } from '../../../../store';
import { useTheme } from '../../../../hooks';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const { isDark, bg, surf, borderL, text, textSec } = useTheme();

  const menuPrincipal = [
    {
      icon: 'receipt-outline',
      label: 'Meus pedidos',
      badge: '3',
      onPress: () => router.push('/(consumer)/pedidos'),
    },
    {
      icon: 'location-outline',
      label: 'Endereços',
      onPress: () => router.push('/(consumer)/enderecos'),
    },
    {
      icon: 'card-outline',
      label: 'Formas de pagamento',
      onPress: () => router.push('/(consumer)/pagamento'),
    },
    {
      icon: 'heart-outline',
      label: 'Favoritos',
      onPress: () => router.push('/(consumer)/favoritos'),
    },
    {
      icon: 'chatbubbles-outline',
      label: 'Conversas',
      onPress: () => router.push('/(consumer)/conversas'),
    },
  ];

  const menuConfig = [
    {
      icon: 'notifications-outline',
      label: 'Notificações',
      onPress: () => router.push('/(consumer)/notificacoes'),
    },
    {
      icon: 'settings-outline',
      label: 'Ajustes',
      onPress: () => router.push('/(consumer)/ajustes'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Ajuda e suporte',
      onPress: () => Alert.alert('Em breve', 'Suporte em desenvolvimento'),
    },
  ];

  const handleLogout = () => setLogoutVisible(true);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: surf, borderBottomColor: borderL, paddingTop: insets.top + 12 },
        ]}
      >
        <Text style={[styles.titulo, { color: text }]}>Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ProfileHeader />

        <View style={{ marginTop: 14 }}>
          <ProfileMenu items={menuPrincipal} />
        </View>

        <View style={{ marginTop: 14 }}>
          <ProfileMenu items={menuConfig} />
        </View>

        {/* Sair */}
        <TouchableOpacity
          style={[styles.logoutBtn, isDark && { backgroundColor: 'rgba(163,45,45,0.18)' }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={17} color="#A32D2D" />
          <Text style={styles.logoutTxt}>Sair da conta</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={[styles.footer, { color: textSec as string }]}>
          Shopping Digital · v1.0 · by{' '}
          <Text style={{ color: colors.orange, fontWeight: '600' }}>AjuLabs</Text>
        </Text>
      </ScrollView>

      <Modal
        visible={logoutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: surf }]}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={28} color="#A32D2D" />
            </View>
            <Text style={[styles.modalTitle, { color: text }]}>Sair da conta</Text>
            <Text style={[styles.modalMsg, { color: textSec as string }]}>
              Tem certeza que deseja sair da sua conta?
            </Text>
            <TouchableOpacity
              style={styles.modalBtnSair}
              onPress={() => {
                setLogoutVisible(false);
                logout();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnSairText}>Sim, quero sair</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalBtnCancel,
                { borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.n100 },
              ]}
              onPress={() => setLogoutVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.modalBtnCancelText, { color: text }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  titulo: { fontSize: 20, fontWeight: '700' },

  scroll: { padding: 16, paddingBottom: 40 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: '#FCEBEB',
    borderRadius: 14,
  },
  logoutTxt: { fontSize: 14, fontWeight: '600', color: '#A32D2D' },

  footer: { textAlign: 'center', marginTop: 20, fontSize: 11, letterSpacing: 0.3 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FDECEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  modalMsg: { fontSize: 13, textAlign: 'center', marginBottom: 22, lineHeight: 19 },
  modalBtnSair: {
    width: '100%',
    backgroundColor: '#A32D2D',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalBtnSairText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  modalBtnCancel: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalBtnCancelText: { fontSize: 14, fontWeight: '600' },
});
