import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import { ProfileHeader } from './ProfileHeader';
import { ProfileMenu } from './ProfileMenu';
import { useAuthStore } from '../../../../store';

export function ProfileScreen() {
  const router = useRouter();

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
      onPress: () => Alert.alert('Em breve', 'Gestão de endereços em desenvolvimento'),
    },
    {
      icon: 'card-outline',
      label: 'Formas de pagamento',
      onPress: () => Alert.alert('Em breve', 'Formas de pagamento em desenvolvimento'),
    },
    {
      icon: 'heart-outline',
      label: 'Favoritos',
      onPress: () => Alert.alert('Em breve', 'Favoritos em desenvolvimento'),
    },
  ];

  const menuConfig = [
    {
      icon: 'notifications-outline',
      label: 'Notificações',
      onPress: () => Alert.alert('Em breve', 'Notificações em desenvolvimento'),
    },
    {
      icon: 'settings-outline',
      label: 'Ajustes',
      onPress: () => Alert.alert('Em breve', 'Ajustes em desenvolvimento'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Ajuda e suporte',
      onPress: () => Alert.alert('Em breve', 'Suporte em desenvolvimento'),
    },
  ];

  const logout = useAuthStore(s => s.logout);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Perfil</Text>
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
          style={styles.logoutBtn}
          onPress={() => Alert.alert('Sair', 'Tem certeza que deseja sair?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sair', style: 'destructive', onPress: () => logout() },
          ])}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={17} color="#A32D2D" />
          <Text style={styles.logoutTxt}>Sair da conta</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>
          Shopping Digital · v1.0 · by <Text style={{ color: colors.orange, fontWeight: '600' }}>AjuLabs</Text>
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#FAFBFE' },

  header:     { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
                backgroundColor: colors.n0, borderBottomWidth: 1, borderBottomColor: colors.n100 },
  titulo:     { fontSize: 20, fontWeight: '700', color: colors.navy },

  scroll:     { padding: 16, paddingBottom: 40 },

  logoutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 8, marginTop: 20, paddingVertical: 14,
                backgroundColor: '#FCEBEB', borderRadius: 14 },
  logoutTxt:  { fontSize: 14, fontWeight: '600', color: '#A32D2D' },

  footer:     { textAlign: 'center', marginTop: 20, fontSize: 11,
                color: colors.n500, letterSpacing: 0.3 },
});