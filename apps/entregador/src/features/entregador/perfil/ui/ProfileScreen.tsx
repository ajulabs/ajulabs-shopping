import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile, type PerfilNavDestino } from '../model/useProfile';
import { ProfileHero } from './components/ProfileHero';
import { ProfileMenu } from './components/ProfileMenu';
import { PhotoModal, LogoutModal } from './components/ProfileModals';
import { useTheme } from '../../../../shared/hooks';
import { useThemeStore } from '../../../../store';

export type { PerfilNavDestino };

interface ProfileScreenProps {
  onLogout: () => void;
  onNavigate: (dest: PerfilNavDestino) => void;
}

export function ProfileScreen({ onLogout, onNavigate }: ProfileScreenProps) {
  const {
    loading,
    logoutVisible,
    setLogoutVisible,
    photoExpanded,
    setPhotoExpanded,
    handleTrocarFoto,
    handleMenuPress,
    menuItems,
    nome,
    initials,
    tipoTransporte,
    veiculoLabel,
    fotoPerfil,
    totalEntregas,
    ganhoTotal,
    corridasSemana,
  } = useProfile(onNavigate);
  const theme = useTheme();
  const isDark = useThemeStore((st) => st.isDark);
  const toggleDark = useThemeStore((st) => st.toggleDark);

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: theme.bg }]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHero
          loading={loading}
          nome={nome}
          initials={initials}
          fotoPerfil={fotoPerfil}
          tipoTransporte={tipoTransporte}
          veiculoLabel={veiculoLabel}
          totalEntregas={totalEntregas}
          corridasSemana={corridasSemana}
          ganhoTotal={ganhoTotal}
          onTrocarFoto={handleTrocarFoto}
          onExpandPhoto={() => setPhotoExpanded(true)}
        />

        <ProfileMenu items={menuItems} onPress={handleMenuPress} />

        <View style={[s.themeRow, { backgroundColor: theme.surf, borderColor: theme.border }]}>
          <View style={[s.themeIcon, { backgroundColor: theme.iconBg }]}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color="#F2760F" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.themeLabel, { color: theme.text }]}>Modo escuro</Text>
            <Text style={[s.themeSub, { color: theme.textMut }]}>
              {isDark ? 'Ativado' : 'Desativado'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleDark}
            trackColor={{ true: '#F2760F', false: '#E4E7F1' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <TouchableOpacity
          style={[s.logoutBtn, { backgroundColor: theme.surf, borderColor: theme.border }]}
          onPress={() => setLogoutVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={s.logoutText}>Sair</Text>
        </TouchableOpacity>

        <Text style={[s.version, { color: theme.textMut }]}>AjuLabs · Entregador v1.0</Text>
      </ScrollView>

      <PhotoModal
        visible={photoExpanded}
        fotoPerfil={fotoPerfil}
        onClose={() => setPhotoExpanded(false)}
        onTrocarFoto={handleTrocarFoto}
      />

      <LogoutModal
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
        onConfirm={() => {
          setLogoutVisible(false);
          onLogout();
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7FB' },
  scroll: { flex: 1 },
  content: { paddingBottom: 32 },
  logoutBtn: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    alignItems: 'center',
    marginBottom: 16,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  themeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeLabel: { fontSize: 14, fontWeight: '600' },
  themeSub: { fontSize: 11, marginTop: 1 },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#E14B3C' },
  version: { textAlign: 'center', fontSize: 10, color: '#9099B3', letterSpacing: 0.5 },
});
