import { View, Text, TouchableOpacity, Image, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../theme';
import { ImageSlot } from '../../lib/types';

const SLOT_SIZE = (Dimensions.get('window').width - 16 * 2 - 10 * 3) / 4;

export function FotoGrid({
  slots,
  onPick,
  onRemove,
}: {
  slots: ImageSlot[];
  onPick: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>
        Fotos do produto <Text style={styles.fieldLabelHint}>(até 4)</Text>
      </Text>
      <View style={styles.photoGrid}>
        {slots.map((slot, i) => (
          <View key={i} style={styles.photoSlotWrap}>
            {slot.type !== 'empty' ? (
              <View style={styles.photoSlot}>
                <Image
                  source={{ uri: slot.type === 'existing' ? slot.url : slot.uri }}
                  style={styles.photoSlotImg}
                  resizeMode="cover"
                />
                {i === 0 && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>Principal</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.photoRemoveBtn}
                  onPress={() => onRemove(i)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.photoSlotEmpty}
                onPress={() => onPick(i)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={22} color={colors.n500} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
      <Text style={styles.photoHint}>
        Toque em um slot vazio para adicionar foto. A primeira é a principal.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldLabelHint: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.n500,
    textTransform: 'none',
    letterSpacing: 0,
  },
  photoGrid: { flexDirection: 'row', gap: 10 },
  photoSlotWrap: { flex: 1 },
  photoSlot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  photoSlotImg: { width: '100%', height: '100%' },
  photoSlotEmpty: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.n300,
    borderStyle: 'dashed',
    backgroundColor: colors.n50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,9,51,0.6)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  mainBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  photoHint: { fontSize: 11, color: colors.n500, marginTop: 4 },
});
