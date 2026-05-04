// src/features/consumer/profile/ui/ConsumerProfile.tsx
import { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../../../theme';

interface ConsumerProfileProps {
  dark?: boolean;
}

interface MenuItem {
  icon: string;
  label: string;
  badge?: number;
  onPress: () => void;
}

// ─── Icon components (SVG via react-native-svg se disponível,
//     senão substituir por lucide-react-native) ─────────────────
// Substitua pelos ícones do seu projeto. Aqui usamos emoji como
// placeholder visual fiel ao protótipo.
const ICONS: Record<string, string> = {
  orders:       '🗒️',
  location:     '📍',
  card:         '💳',
  heart:        '🤍',
  bell:         '🔔',
  settings:     '⚙️',
  edit:         '✏️',
  chevron:      '›',
  logout:       '⏻',
  zap:          '⚡',
};

// ─── Avatar com iniciais ──────────────────────────────────────
function Avatar({ initials, size = 56 }: { initials: string; size?: number }) {
  return (
    <View style={[
      styles.avatar,
      { width: size, height: size, borderRadius: size / 2 },
    ]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>
        {initials}
      </Text>
    </View>
  );
}

// ─── Item de menu ─────────────────────────────────────────────
function MenuRow({
  icon, label, badge, onPress, isLast = false,
}: MenuItem & { isLast?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        !isLast && styles.menuItemBorder,
        pressed && { backgroundColor: colors.n50 },
      ]}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.iconEmoji}>{icon}</Text>
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      {badge !== undefined && (
        <View style={styles.badgeWrap}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Text style={styles.chevron}>{ICONS.chevron}</Text>
    </Pressable>
  );
}

// ─── Tela principal ───────────────────────────────────────────
export function ConsumerProfile({ dark = false }: ConsumerProfileProps) {
  const router = useRouter();

  // Tema dinâmico (suporte a dark mode futuro)
  const textColor = dark ? colors.n0      : colors.navy;
  const subColor  = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const bgMain    = dark ? '#0B0F22'      : colors.n50;
  const surface   = dark ? '#111638'      : colors.n0;
  const border    = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  const menuItems: MenuItem[] = [
    {
      icon: ICONS.orders,
      label: 'Meus pedidos',
      badge: 3,
      onPress: () => router.push('/(consumer)/meus-pedidos'),
    },
    {
      icon: ICONS.location,
      label: 'Endereços',
      onPress: () => router.push('/(consumer)/enderecos'),
    },
    {
      icon: ICONS.card,
      label: 'Formas de pagamento',
      onPress: () => router.push('/(consumer)/pagamento'),
    },
    {
      icon: ICONS.heart,
      label: 'Favoritos',
      onPress: () => router.push('/(consumer)/favoritos'),
    },
    {
      icon: ICONS.bell,
      label: 'Notificações',
      onPress: () => router.push('/(consumer)/notificacoes'),
    },
    {
      icon: ICONS.settings,
      label: 'Ajustes',
      onPress: () => router.push('/(consumer)/ajustes'),
    },
  ];

  const handleLogout = useCallback(() => {
    // TODO: limpar sessão / authStore
    router.replace('/(auth)/login');
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: bgMain }]}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}>
        <TouchableOpacity style={styles.btnBack} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={[styles.btnBackIcon, { color: textColor }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Perfil</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Card de perfil */}
        <View style={[styles.profileCard, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.profileRow}>
            <Avatar initials="MS" />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: textColor }]}>Mariana Sena</Text>
              <Text style={[styles.profileEmail, { color: subColor }]}>
                mariana.sena@email.com
              </Text>
              <View style={styles.clientBadge}>
                <Text style={styles.clientBadgeText}>{ICONS.zap} Cliente desde 2024</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.btnEdit, { backgroundColor: dark ? 'rgba(255,255,255,0.08)' : colors.n100 }]} activeOpacity={0.8}>
              <Text style={[styles.btnEditIcon, { color: textColor }]}>{ICONS.edit}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de menu */}
        <View style={[styles.menuSection, { backgroundColor: surface, borderColor: border }]}>
          {menuItems.map((item, index) => (
            <MenuRow
              key={item.label}
              {...item}
              isLast={index === menuItems.length - 1}
            />
          ))}
        </View>

        {/* Footer */}
        <Text style={[styles.footerText, { color: subColor }]}>
          Shopping Digital · v1.0 · by{' '}
          <Text style={{ color: colors.orange600, fontWeight: '600' }}>AjuLabs</Text>
        </Text>

        {/* Botão Sair */}
        <TouchableOpacity
          style={[styles.btnLogout, { borderColor: border }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.btnLogoutIcon}>{ICONS.logout}</Text>
          <Text style={styles.btnLogoutText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },

  // Header
  header:         { flexDirection: 'row', alignItems: 'center', gap: 10,
                    paddingHorizontal: 16, paddingVertical: 12,
                    borderBottomWidth: 1 },
  btnBack:        { width: 34, height: 34, borderRadius: 17,
                    backgroundColor: '#EEF0F7',
                    alignItems: 'center', justifyContent: 'center' },
  btnBackIcon:    { fontSize: 22, lineHeight: 28, marginTop: -2 },
  headerTitle:    { fontWeight: '600', fontSize: 18, letterSpacing: -0.3 },

  // Scroll
  scroll:         { paddingBottom: 16 },

  // Profile card
  profileCard:    { margin: 16, borderRadius: 20, padding: 18, borderWidth: 1,
                    shadowColor: '#000933', shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 },
  profileRow:     { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatar:         { backgroundColor: '#F2760F', alignItems: 'center', justifyContent: 'center' },
  avatarText:     { color: '#fff', fontWeight: '700' },
  profileInfo:    { flex: 1 },
  profileName:    { fontWeight: '700', fontSize: 18, letterSpacing: -0.3 },
  profileEmail:   { fontSize: 12, marginTop: 2 },
  clientBadge:    { marginTop: 6, alignSelf: 'flex-start',
                    backgroundColor: '#FFEAD4', paddingHorizontal: 10,
                    paddingVertical: 4, borderRadius: 99 },
  clientBadgeText:{ color: '#DE6708', fontSize: 11, fontWeight: '600' },
  btnEdit:        { width: 34, height: 34, borderRadius: 17,
                    alignItems: 'center', justifyContent: 'center' },
  btnEditIcon:    { fontSize: 16 },

  // Menu
  menuSection:    { marginHorizontal: 16, borderRadius: 20,
                    borderWidth: 1, overflow: 'hidden',
                    shadowColor: '#000933', shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.04, shadowRadius: 20, elevation: 2 },
  menuItem:       { flexDirection: 'row', alignItems: 'center',
                    gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#E4E7F1' },
  iconWrap:       { width: 36, height: 36, borderRadius: 10,
                    backgroundColor: '#FFEAD4',
                    alignItems: 'center', justifyContent: 'center' },
  iconEmoji:      { fontSize: 16 },
  menuLabel:      { flex: 1, fontSize: 14, fontWeight: '500', color: '#000933' },
  badgeWrap:      { width: 20, height: 20, borderRadius: 10,
                    backgroundColor: '#F2760F',
                    alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  badgeText:      { color: '#fff', fontSize: 10, fontWeight: '700' },
  chevron:        { color: '#9099B3', fontSize: 22, lineHeight: 24, marginTop: -2 },

  // Footer + Logout
  footerText:     { textAlign: 'center', marginTop: 22, marginBottom: 12,
                    fontSize: 12 },
  btnLogout:      { marginHorizontal: 16, height: 46, borderRadius: 12,
                    borderWidth: 1.5, flexDirection: 'row',
                    alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnLogoutIcon:  { fontSize: 16, color: '#6B7390' },
  btnLogoutText:  { fontSize: 14, fontWeight: '600', color: '#6B7390' },
});