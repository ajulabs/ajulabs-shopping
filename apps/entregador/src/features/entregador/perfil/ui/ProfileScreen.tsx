import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile, type PerfilNavDestino } from '../model/useProfile';
import { ProfileHero } from './components/ProfileHero';
import { ProfileMenu } from './components/ProfileMenu';
import { PhotoModal, LogoutModal } from './components/ProfileModals';

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

  return (
    <SafeAreaView style={s.safeArea}>
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

        <TouchableOpacity
          style={s.logoutBtn}
          onPress={() => setLogoutVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={s.logoutText}>Sair</Text>
        </TouchableOpacity>

        <Text style={s.version}>AjuLabs · Entregador v1.0</Text>
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
  logoutText: { fontSize: 14, fontWeight: '600', color: '#E14B3C' },
  version: { textAlign: 'center', fontSize: 10, color: '#9099B3', letterSpacing: 0.5 },
});
