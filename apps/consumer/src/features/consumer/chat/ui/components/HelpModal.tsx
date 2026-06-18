import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../../shared/hooks';
import { AjuCapabilities } from './AjuCapabilities';

export function HelpModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { isDark, text, borderL } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: isDark ? colors.surfDark : colors.n0 }]}>
          <Text style={[styles.helpTitle, { color: text }]}> O que Aju pode fazer?</Text>
          <View style={[styles.divider, { backgroundColor: borderL }]} />

          <AjuCapabilities />

          <TouchableOpacity
            onPress={onClose}
            style={[styles.primaryBtn, { backgroundColor: colors.navy }]}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnTxt}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  helpTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  divider: { height: 1, marginVertical: 14 },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: colors.orange,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnTxt: { fontSize: 15, fontWeight: '700', color: colors.n0 },
});
