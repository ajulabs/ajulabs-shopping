import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { EntregadorService } from '@ajulabs/api-client';
import { useAuthEntregadorStore } from '../../auth/model/store';

export type PerfilNavDestino =
  | 'documentos'
  | 'veiculo'
  | 'dados-bancarios'
  | 'notificacoes'
  | 'avaliacoes'
  | 'seguranca'
  | 'conversas';

interface ProfileScreenProps {
  onLogout: () => void;
  onNavigate: (dest: PerfilNavDestino) => void;
}

export function ProfileScreen({ onLogout, onNavigate }: ProfileScreenProps) {
  const token = useAuthEntregadorStore((s) => s.token);
  const nomeStore = useAuthEntregadorStore((s) => s.nome);
  const fotoUrl = useAuthEntregadorStore((s) => s.fotoUrl);
  const setFotoUrl = useAuthEntregadorStore((s) => s.setFotoUrl);

  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [ganhos, setGanhos] = useState<any>(null);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [photoExpanded, setPhotoExpanded] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    Promise.all([EntregadorService.buscarPerfil(token), EntregadorService.buscarGanhos(token)])
      .then(([p, g]) => {
        setPerfil(p);
        setGanhos(g);
        // Sync fotoUrl: usa o retorno da API como fonte de verdade
        const apiFoto = p?.entregador?.fotoUrl ?? null;
        if (apiFoto && apiFoto !== fotoUrl) setFotoUrl(apiFoto);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleTrocarFoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para trocar a foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    if (!token) return;
    try {
      const url = await EntregadorService.atualizarFoto(token, result.assets[0].uri);
      await setFotoUrl(url);
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a foto. Tente novamente.');
    }
  }, [token, setFotoUrl]);

  const handleMenuPress = useCallback(
    (label: string) => {
      switch (label) {
        case 'Documentos':
          onNavigate('documentos');
          break;
        case 'Veículo':
          onNavigate('veiculo');
          break;
        case 'Dados bancários':
          onNavigate('dados-bancarios');
          break;
        case 'Notificações':
          onNavigate('notificacoes');
          break;
        case 'Avaliações':
          onNavigate('avaliacoes');
          break;
        case 'Segurança':
          onNavigate('seguranca');
          break;
        case 'Conversas':
          onNavigate('conversas');
          break;
        case 'Ajuda e suporte':
          Alert.alert('Ajuda e suporte', 'Entre em contato com nossa equipe:', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'WhatsApp', onPress: () => Linking.openURL('https://wa.me/5579999999999') },
            { text: 'Email', onPress: () => Linking.openURL('mailto:suporte@ajulabs.com') },
          ]);
          break;
      }
    },
    [perfil, onNavigate],
  );

  const menuItems = [
    { icon: 'chatbubbles', label: 'Conversas' },
    {
      icon: 'document-text',
      label: 'Documentos',
      extra: perfil?.onboarding?.documentosAprovados ? 'Verificado' : undefined,
      extraColor: '#039855',
    },
    {
      icon: 'car-sport',
      label: 'Veículo',
      extra: perfil?.entregador?.veiculo ? perfil.entregador.veiculo.modelo : undefined,
      extraColor: '#9099B3',
    },
    { icon: 'wallet', label: 'Dados bancários' },
    { icon: 'star', label: 'Avaliações' },
    { icon: 'notifications', label: 'Notificações' },
    { icon: 'shield-checkmark', label: 'Segurança' },
    { icon: 'help-circle', label: 'Ajuda e suporte' },
  ] as const;

  const nome = perfil?.entregador?.nome ?? nomeStore ?? 'Entregador';
  const initials = nome
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const veiculo = perfil?.entregador?.veiculo;
  const tipoTransporte = (perfil?.entregador?.tipoTransporte ?? 'moto') as
    | 'moto'
    | 'carro'
    | 'bike';
  const veiculoLabel = veiculo
    ? veiculo.placa !== 'BICICLETA'
      ? `${veiculo.modelo} · ${veiculo.placa}`
      : 'Bicicleta'
    : null;

  // Foto: prefer API data (synced to store), fallback to store
  const fotoPerfil = fotoUrl ?? perfil?.entregador?.fotoUrl ?? null;
  const totalEntregas = ganhos?.allTime?.corridas ?? 0;
  const ganhoTotal = ganhos?.allTime?.total
    ? `R$${Number(ganhos.allTime.total).toFixed(0)}`
    : 'R$0';
  const corridasSemana = ganhos?.semana?.corridas ?? 0;

  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.hero}>
          <View style={s.heroRow}>
            <TouchableOpacity
              style={s.avatar}
              onPress={fotoPerfil ? () => setPhotoExpanded(true) : handleTrocarFoto}
              activeOpacity={0.8}
            >
              {fotoPerfil ? (
                <Image source={{ uri: fotoPerfil }} style={s.avatarImg} />
              ) : (
                <Text style={s.avatarText}>{initials}</Text>
              )}
              <TouchableOpacity style={s.avatarEdit} onPress={handleTrocarFoto} activeOpacity={0.8}>
                <Ionicons name="camera" size={10} color="#FFFFFF" />
              </TouchableOpacity>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.heroName}>{nome}</Text>
              {veiculoLabel ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  {tipoTransporte === 'moto' ? (
                    <MaterialCommunityIcons
                      name="motorbike"
                      size={13}
                      color="rgba(255,255,255,0.7)"
                    />
                  ) : (
                    <Ionicons
                      name={tipoTransporte === 'bike' ? 'bicycle' : 'car'}
                      size={12}
                      color="rgba(255,255,255,0.7)"
                    />
                  )}
                  <Text style={s.heroTransporte}>{veiculoLabel}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {loading ? (
            <View style={[s.statsBox, { justifyContent: 'center', paddingVertical: 20 }]}>
              <ActivityIndicator color="#F2760F" />
            </View>
          ) : (
            <View style={s.statsBox}>
              <View style={s.statCol}>
                <Text style={s.statVal}>{totalEntregas}</Text>
                <Text style={s.statLabel}>Entregas</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statCol}>
                <Text style={s.statVal}>{corridasSemana}</Text>
                <Text style={s.statLabel}>Esta semana</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statCol}>
                <Text style={s.statVal}>{ganhoTotal}</Text>
                <Text style={s.statLabel}>Total ganho</Text>
              </View>
            </View>
          )}
        </View>

        <View style={s.menuCard}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[
                s.menuRow,
                i < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#E4E7F1' },
              ]}
              onPress={() => handleMenuPress(item.label)}
              activeOpacity={0.7}
            >
              <View style={s.menuIcon}>
                <Ionicons name={item.icon as any} size={18} color="#000933" />
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              {'extra' in item && item.extra && (
                <View style={[s.extraBadge, { backgroundColor: 'rgba(3,152,85,0.1)' }]}>
                  <Text style={[s.extraText, { color: (item as any).extraColor }]}>
                    {item.extra}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color="#9099B3" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={s.logoutBtn}
          onPress={() => setLogoutVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={s.logoutText}>Sair</Text>
        </TouchableOpacity>

        <Text style={s.version}>AjuLabs · Entregador v1.0</Text>
      </ScrollView>

      <Modal
        visible={photoExpanded}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoExpanded(false)}
      >
        <View style={s.photoOverlay}>
          <TouchableOpacity
            style={s.photoClose}
            onPress={() => setPhotoExpanded(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          {fotoPerfil && (
            <Image source={{ uri: fotoPerfil }} style={s.photoFull} resizeMode="contain" />
          )}
          <TouchableOpacity
            style={s.photoTrocarBtn}
            onPress={() => {
              setPhotoExpanded(false);
              handleTrocarFoto();
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={16} color="#FFFFFF" />
            <Text style={s.photoTrocarText}>Trocar foto</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        visible={logoutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalIconWrap}>
              <Ionicons name="log-out-outline" size={28} color="#E14B3C" />
            </View>
            <Text style={s.modalTitle}>Sair da conta</Text>
            <Text style={s.modalMsg}>Tem certeza que deseja sair da sua conta?</Text>
            <TouchableOpacity
              style={s.modalBtnSair}
              onPress={() => {
                setLogoutVisible(false);
                onLogout();
              }}
              activeOpacity={0.8}
            >
              <Text style={s.modalBtnSairText}>Sim, quero sair</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.modalBtnCancel}
              onPress={() => setLogoutVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={s.modalBtnCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7FB' },
  scroll: { flex: 1 },
  content: { paddingBottom: 32 },
  hero: {
    backgroundColor: '#000933',
    padding: 20,
    paddingBottom: 24,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F2760F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F2760F',
  },
  avatarImg: { width: 64, height: 64, borderRadius: 32 },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F2760F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000933',
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  heroName: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  heroTransporte: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  statsBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statCol: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', lineHeight: 26 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' },
  menuCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#000933' },
  extraBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  extraText: { fontSize: 11, fontWeight: '600' },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
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
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#000933', marginBottom: 6 },
  modalMsg: {
    fontSize: 13,
    color: '#9099B3',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 19,
  },
  modalBtnSair: {
    width: '100%',
    backgroundColor: '#E14B3C',
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
    borderColor: '#E4E7F1',
  },
  modalBtnCancelText: { fontSize: 14, fontWeight: '600', color: '#000933' },
  photoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoClose: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  photoFull: {
    width: '100%',
    height: '65%',
  },
  photoTrocarBtn: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2760F',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 30,
  },
  photoTrocarText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
