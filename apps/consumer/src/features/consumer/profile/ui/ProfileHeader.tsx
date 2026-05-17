import { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@ajulabs/theme';
import { PerfilService } from '@ajulabs/api-client';
import { useAuthStore } from '../../../../store';
import { useTheme } from '../../../../hooks';

function getIniciais(nome: string): string {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// Redimensiona a imagem para 200x200 via Canvas e retorna um data URI compacto
async function resizeParaDataUri(uri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img') as HTMLImageElement;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const SIZE = 200;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      canvas.getContext('2d')!.drawImage(img, 0, 0, SIZE, SIZE);
      resolve(canvas.toDataURL('image/jpeg', 0.65));
    };
    img.onerror = reject;
    img.src = uri;
  });
}

// Envia o avatar via PUT /perfil (rota já existente no backend)
async function atualizarAvatarWeb(token: string, uri: string): Promise<string> {
  const avatarUrl = await resizeParaDataUri(uri);
  const res = await fetch(`${API_URL}/perfil`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ avatarUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.error === 'string' ? err.error : `HTTP ${res.status}`);
  }
  const { usuario } = await res.json();
  return usuario.avatarUrl;
}

export function ProfileHeader() {
  const nome = useAuthStore(s => s.nome) ?? 'Usuário';
  const email = useAuthStore(s => s.email) ?? '';
  const token = useAuthStore(s => s.token);
  const avatarUrl = useAuthStore(s => s.avatarUrl);
  const setAvatarUrl = useAuthStore(s => s.setAvatarUrl);
  const iniciais = getIniciais(nome);
  const [uploading, setUploading] = useState(false);

  const { surf, border, text, textSec } = useTheme();

  const handlePickImage = async () => {
    if (!token) return;

    // No web o browser bloqueia o file picker se houver um await antes da chamada
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Permita o acesso à galeria para alterar a foto de perfil.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      let url: string;
      if (Platform.OS === 'web') {
        // Web: redimensiona com Canvas e salva via PUT /perfil (sem precisar do novo endpoint)
        url = await atualizarAvatarWeb(token, result.assets[0].uri);
      } else {
        // Native: usa o endpoint PATCH /perfil/avatar (requer backend atualizado)
        url = await PerfilService.atualizarAvatar(token, result.assets[0].uri);
      }
      setAvatarUrl(url);
    } catch (err: any) {
      const msg = err?.message ?? 'Erro desconhecido';
      console.error('[ProfileHeader] atualizarAvatar falhou:', msg, err);
      if (Platform.OS === 'web') {
        window.alert(`Não foi possível atualizar a foto:\n${msg}`);
      } else {
        Alert.alert('Erro ao atualizar foto', msg);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: surf, borderColor: border }]}>
      <TouchableOpacity onPress={handlePickImage} disabled={uploading} activeOpacity={0.8}>
        <View style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{iniciais}</Text>
            </View>
          )}
          <View style={styles.cameraBtn}>
            {uploading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="camera" size={11} color="#fff" />
            }
          </View>
        </View>
      </TouchableOpacity>

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

  avatarWrap: { position: 'relative', width: 64, height: 64 },
  avatar:     { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.orange,
                alignItems: 'center', justifyContent: 'center' },
  avatarImg:  { width: 64, height: 64, borderRadius: 32 },
  avatarTxt:  { color: '#fff', fontWeight: '700', fontSize: 26 },
  cameraBtn:  { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22,
                borderRadius: 11, backgroundColor: colors.orange600,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: '#fff' },

  nome:       { fontSize: 18, fontWeight: '700' },
  email:      { fontSize: 12, marginTop: 2 },

  badgeRow:   { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: colors.orange100, paddingHorizontal: 10, paddingVertical: 3,
                borderRadius: 99 },
  badgeTxt:   { fontSize: 11, fontWeight: '600', color: colors.orange600 },
});
