import { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../../shared/hooks';

interface Props {
  visible: boolean;
  orderId: string | null;
  onClose: () => void;
}

export function CancelamentoSucessoOverlay({ visible, orderId, onClose }: Props) {
  const theme = useTheme();
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const iconScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      cardOpacity.setValue(0);
      cardScale.setValue(0.9);
      iconScale.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 6 }),
    ]).start();
    Animated.sequence([
      Animated.delay(120),
      Animated.spring(iconScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 12,
      }),
    ]).start();
  }, [visible, cardOpacity, cardScale, iconScale]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={s.backdrop}>
        <Animated.View
          style={[
            s.card,
            { backgroundColor: theme.surf },
            { opacity: cardOpacity, transform: [{ scale: cardScale }] },
          ]}
        >
          <Animated.View style={[s.iconWrap, { transform: [{ scale: iconScale }] }]}>
            <Ionicons name="checkmark" size={52} color="#fff" />
          </Animated.View>

          <Text style={[s.title, { color: theme.text }]}>Pedido cancelado</Text>
          <Text style={[s.subtitle, { color: theme.textSec }]}>
            {orderId
              ? `O pedido ${orderId} foi cancelado e o estoque retornou ao catálogo.`
              : 'O pedido foi cancelado e o estoque retornou ao catálogo.'}
          </Text>

          <TouchableOpacity onPress={onClose} style={s.btn} activeOpacity={0.85}>
            <Text style={s.btnTxt}>OK</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,9,51,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 26,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 14,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#39FF89',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#39FF89',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#000933', textAlign: 'center' },
  subtitle: {
    fontSize: 13,
    color: '#6B7390',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  btn: {
    marginTop: 22,
    backgroundColor: '#F2760F',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  btnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
