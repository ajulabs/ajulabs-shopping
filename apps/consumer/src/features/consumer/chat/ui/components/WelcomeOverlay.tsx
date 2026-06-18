import { Animated, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../../shared/hooks';
import { AjuCapabilities } from './AjuCapabilities';

export function WelcomeOverlay({
  opacity,
  onDismiss,
}: {
  opacity: Animated.Value;
  onDismiss: () => void;
}) {
  const { isDark, text, textSec } = useTheme();
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity }]}>
      <View style={[styles.card, { backgroundColor: isDark ? colors.surfDark : colors.n0 }]}>
        <Text style={[styles.welcomeTitle, { color: text }]}>👋 Bem-vindo ao Aju</Text>
        <Text style={[styles.welcomeSub, { color: textSec as string }]}>
          Sua personal shopper de Aracaju
        </Text>

        <AjuCapabilities />

        <TouchableOpacity onPress={onDismiss} style={styles.primaryBtn} activeOpacity={0.85}>
          <Text style={styles.primaryBtnTxt}>Entendi!</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 100,
  },
  card: { borderRadius: 24, padding: 24, width: '100%', maxWidth: 360 },
  welcomeTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  welcomeSub: { fontSize: 13, marginBottom: 20 },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: colors.orange,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnTxt: { fontSize: 15, fontWeight: '700', color: colors.n0 },
});
