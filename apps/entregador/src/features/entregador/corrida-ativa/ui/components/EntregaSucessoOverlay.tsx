import { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brl } from '../../lib/formatters';

interface EntregaSucessoOverlayProps {
  visible: boolean;
  ganho: number;
  clienteNome: string;
  onClose: () => void;
}

export function EntregaSucessoOverlay({
  visible,
  ganho,
  clienteNome,
  onClose,
}: EntregaSucessoOverlayProps) {
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
          style={[s.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}
        >
          <Animated.View style={[s.iconWrap, { transform: [{ scale: iconScale }] }]}>
            <Ionicons name="checkmark" size={56} color="#fff" />
          </Animated.View>

          <Text style={s.title}>Entrega concluída!</Text>
          <Text style={s.subtitle}>Pedido entregue para {clienteNome}.</Text>

          <View style={s.ganhoBox}>
            <Text style={s.ganhoLabel}>Você ganhou</Text>
            <Text style={s.ganhoValue}>{brl(ganho)}</Text>
          </View>

          <TouchableOpacity onPress={onClose} style={s.btn} activeOpacity={0.85}>
            <Text style={s.btnTxt}>Concluir</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,9,51,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 14,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#39FF89',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#39FF89',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000933',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    color: '#9099B3',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  ganhoBox: {
    width: '100%',
    backgroundColor: '#F6F7FB',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  ganhoLabel: {
    fontSize: 11,
    color: '#9099B3',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ganhoValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F2760F',
    marginTop: 4,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F2760F',
    borderRadius: 12,
    paddingVertical: 16,
    width: '100%',
  },
  btnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
