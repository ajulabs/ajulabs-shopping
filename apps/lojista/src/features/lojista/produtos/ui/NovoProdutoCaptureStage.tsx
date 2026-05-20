import { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export function CaptureStage({ onCapture }: { onCapture: (uri: string) => void }) {
  const handleCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para fotografar o produto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onCapture(result.assets[0].uri);
    }
  }, [onCapture]);

  const handleGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onCapture(result.assets[0].uri);
    }
  }, [onCapture]);

  return (
    <View style={styles.content}>
      <View style={styles.iaCard}>
        <View style={styles.iaDecoCircle} />
        <View style={styles.iaDecoCircle2} />
        <View style={styles.iaBadge}>
          <Text style={styles.iaBadgeText}>Cadastro com IA</Text>
        </View>
        <Text style={styles.iaTitle}>{'Tire uma foto.\nA IA faz o resto.'}</Text>
        <Text style={styles.iaDesc}>
          Nome, categoria, descrição e tags — tudo preenchido automaticamente. Você só confirma.
        </Text>
      </View>

      <TouchableOpacity style={styles.photoArea} onPress={handleCamera} activeOpacity={0.85}>
        <View style={styles.photoIcon}>
          <Ionicons name="camera-outline" size={28} color="#F2760F" />
        </View>
        <Text style={styles.photoTitle}>Tirar foto do produto</Text>
        <Text style={styles.photoSub}>ou toque para escolher da galeria</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.galleryBtn} onPress={handleGallery} activeOpacity={0.8}>
        <Text style={styles.galleryBtnText}>Escolher da galeria</Text>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>O que a IA vai preencher</Text>
      <View style={styles.stagesList}>
        {[
          'Nome do produto',
          'Categoria e subcategoria',
          'Descrição otimizada para busca',
          'Tags de busca sugeridas',
          'Sugestão de preço baseada no mercado',
        ].map(item => (
          <View key={item} style={styles.stageRow}>
            <View style={styles.stageDot} />
            <Text style={styles.stageText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content:        { padding: 16, gap: 14 },
  iaCard:         { backgroundColor: '#000933', borderRadius: 18, padding: 18,
                    overflow: 'hidden', position: 'relative' },
  iaDecoCircle:   { position: 'absolute', top: -20, right: -20, width: 100, height: 100,
                    borderRadius: 50, backgroundColor: 'rgba(242,118,15,0.1)' },
  iaDecoCircle2:  { position: 'absolute', bottom: -30, right: 20, width: 70, height: 70,
                    borderRadius: 35, backgroundColor: 'rgba(242,118,15,0.06)' },
  iaBadge:        { alignSelf: 'flex-start', backgroundColor: 'rgba(242,118,15,0.25)',
                    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, marginBottom: 10 },
  iaBadgeText:    { color: '#FFA05C', fontSize: 11, fontWeight: '600' },
  iaTitle:        { fontSize: 22, fontWeight: '700', color: '#fff',
                    lineHeight: 28, letterSpacing: -0.4 },
  iaDesc:         { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 8, lineHeight: 19 },
  photoArea:      { borderWidth: 2, borderColor: '#F2760F', borderStyle: 'dashed',
                    borderRadius: 18, backgroundColor: '#fff',
                    paddingVertical: 36, paddingHorizontal: 20,
                    alignItems: 'center', gap: 10 },
  photoIcon:      { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFEAD4',
                    alignItems: 'center', justifyContent: 'center' },
  photoTitle:     { fontSize: 17, fontWeight: '600', color: '#000933' },
  photoSub:       { fontSize: 13, color: '#6B7390' },
  galleryBtn:     { height: 44, borderRadius: 12, borderWidth: 1.5,
                    borderColor: '#E4E7F1', alignItems: 'center', justifyContent: 'center' },
  galleryBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7390' },
  sectionLabel:   { fontSize: 11, fontWeight: '600', color: '#6B7390',
                    textTransform: 'uppercase', letterSpacing: 0.5 },
  stagesList:     { gap: 8 },
  stageRow:       { flexDirection: 'row', alignItems: 'center', gap: 10,
                    padding: 10, paddingHorizontal: 14,
                    backgroundColor: '#fff', borderRadius: 12,
                    borderWidth: 1, borderColor: '#E4E7F1' },
  stageDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F2760F' },
  stageText:      { fontSize: 13, color: '#6B7390' },
});
