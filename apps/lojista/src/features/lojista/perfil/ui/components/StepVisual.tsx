import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../theme';
import { StoreAvatar } from './StoreAvatar';

export function StepVisual({
  lojaNome,
  logoUri,
  bannerUri,
  uploading,
  onPickLogo,
  onPickBanner,
}: {
  lojaNome: string;
  logoUri: string | null;
  bannerUri: string | null;
  uploading: 'logo' | 'banner' | null;
  onPickLogo: () => void;
  onPickBanner: () => void;
}) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Identidade visual</Text>
      <Text style={styles.stepSub}>
        Adicione o logo e uma foto de capa para sua loja aparecer com destaque no app.
      </Text>

      <Text style={styles.fieldLabel}>FOTO DE CAPA (BANNER)</Text>
      <TouchableOpacity
        style={styles.bannerPicker}
        onPress={onPickBanner}
        disabled={uploading !== null}
        activeOpacity={0.8}
      >
        {bannerUri ? (
          <Image source={{ uri: bannerUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
        <View
          style={[
            styles.bannerOverlay,
            bannerUri ? { backgroundColor: 'rgba(0,0,0,0.35)' } : undefined,
          ]}
        >
          {uploading === 'banner' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="image-outline" size={28} color="#fff" />
              <Text style={styles.bannerOverlayText}>
                {bannerUri ? 'Alterar capa' : 'Adicionar capa'}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      <Text style={[styles.fieldLabel, { marginTop: 20 }]}>LOGO DA LOJA</Text>
      <View style={styles.logoRow}>
        <TouchableOpacity
          style={styles.logoBtn}
          onPress={onPickLogo}
          disabled={uploading !== null}
          activeOpacity={0.8}
        >
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logoImg} />
          ) : (
            <StoreAvatar nome={lojaNome} size={72} />
          )}
          <View style={styles.logoCamBtn}>
            {uploading === 'logo' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera-outline" size={14} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.logoHint}>
          <Text style={styles.logoHintTitle}>Adicione o logo da sua loja</Text>
          <Text style={styles.logoHintSub}>
            Recomendado: imagem quadrada,{'\n'}mínimo 200×200px
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepContent: { padding: 20 },
  stepTitle: { fontSize: 18, fontWeight: '800', color: colors.navy, marginBottom: 6 },
  stepSub: { fontSize: 13, color: colors.n600, lineHeight: 19, marginBottom: 20 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  bannerPicker: { height: 140, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.navy },
  bannerOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  bannerOverlayText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  logoBtn: { position: 'relative' },
  logoImg: { width: 72, height: 72, borderRadius: 18, borderWidth: 2, borderColor: colors.n200 },
  logoCamBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  logoHint: { flex: 1 },
  logoHintTitle: { fontSize: 14, fontWeight: '600', color: colors.navy },
  logoHintSub: { fontSize: 12, color: colors.n600, marginTop: 4, lineHeight: 17 },
});
