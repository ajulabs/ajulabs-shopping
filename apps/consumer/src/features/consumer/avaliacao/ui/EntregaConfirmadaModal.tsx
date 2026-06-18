import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../shared/hooks';

interface Props {
  visible: boolean;
  lojaNome: string;
  onAvaliar: () => void;
  onPular: () => void;
}

export function EntregaConfirmadaModal({ visible, lojaNome, onAvaliar, onPular }: Props) {
  const { bg, surf, text, textSec } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: surf }]}>
          <View style={styles.iconWrap}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
          </View>

          <Text style={[styles.titulo, { color: text }]}>Pedido entregue!</Text>
          <Text style={[styles.subtitulo, { color: textSec as string }]}>
            Seu pedido de <Text style={{ fontWeight: '700', color: text }}>{lojaNome}</Text> chegou.
            Como foi a experiência?
          </Text>

          <TouchableOpacity style={styles.btnAvaliar} onPress={onAvaliar} activeOpacity={0.85}>
            <Ionicons name="star" size={16} color="#fff" />
            <Text style={styles.btnAvaliarTxt}>Avaliar agora</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onPular} activeOpacity={0.7} style={styles.btnPular}>
            <Text style={[styles.btnPularTxt, { color: textSec as string }]}>Avaliar depois</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 0,
  },
  iconWrap: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  btnAvaliar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.orange,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  btnAvaliarTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  btnPular: {
    paddingVertical: 8,
  },
  btnPularTxt: {
    fontSize: 13,
    fontWeight: '500',
  },
});
