import { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MotivoCancelamento } from './CancelCorridaModal';
import { useMemo } from 'react';
import { useTheme } from '../../../../../shared/hooks';
import type { Theme } from '../../../../../shared/hooks/useTheme';

const MOTIVO_LABELS: Record<MotivoCancelamento, string> = {
  area_risco: 'Área de risco',
  pneu_furou: 'Pneu furou',
  acidente: 'Acidente',
};

interface Props {
  visible: boolean;
  motivo: MotivoCancelamento | null;
  onClose: () => void;
}

export function CancelamentoCorridaOverlay({ visible, motivo, onClose }: Props) {
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

  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={s.backdrop}>
        <Animated.View
          style={[s.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}
        >
          <Animated.View style={[s.iconWrap, { transform: [{ scale: iconScale }] }]}>
            <Ionicons name="close" size={48} color="#fff" />
          </Animated.View>

          <Text style={s.title}>Corrida cancelada</Text>
          <Text style={s.subtitle}>
            A corrida voltou para a fila e está disponível para outros entregadores.
          </Text>

          {motivo && (
            <View style={s.motivoBox}>
              <Text style={s.motivoLabel}>Motivo registrado</Text>
              <Text style={s.motivoValue}>{MOTIVO_LABELS[motivo]}</Text>
            </View>
          )}

          <TouchableOpacity onPress={onClose} style={s.btn} activeOpacity={0.85}>
            <Text style={s.btnTxt}>OK</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,9,51,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
    },
    card: {
      width: '100%',
      backgroundColor: theme.surf,
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
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: '#9B1C1C',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      shadowColor: '#9B1C1C',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 18,
      elevation: 10,
    },
    title: { fontSize: 20, fontWeight: '800', color: theme.text, textAlign: 'center' },
    subtitle: {
      fontSize: 13,
      color: theme.textSec,
      textAlign: 'center',
      marginTop: 6,
      lineHeight: 19,
    },
    motivoBox: {
      width: '100%',
      marginTop: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: '#FEF2F2',
      borderWidth: 1,
      borderColor: '#FCA5A5',
    },
    motivoLabel: {
      fontSize: 10,
      color: '#9B1C1C',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    motivoValue: { fontSize: 14, fontWeight: '700', color: theme.text, marginTop: 4 },
    btn: {
      marginTop: 20,
      backgroundColor: '#F2760F',
      borderRadius: 12,
      paddingVertical: 14,
      width: '100%',
      alignItems: 'center',
    },
    btnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
  });
}
