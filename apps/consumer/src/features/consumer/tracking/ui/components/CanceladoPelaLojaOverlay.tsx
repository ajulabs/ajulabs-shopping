import { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../../shared/hooks';

const MOTIVO_LABELS: Record<string, string> = {
  item_esgotado: 'Item esgotado no momento',
  problema_cozinha: 'Problema com estoque/produtos da loja',
  horario_encerramento: 'A loja estava no horário de encerramento',
  outro: 'Motivo não informado pela loja',
};

interface Props {
  visible: boolean;
  lojaNome?: string;
  motivo: string | null;
  onClose: () => void;
}

export function CanceladoPelaLojaOverlay({ visible, lojaNome, motivo, onClose }: Props) {
  const { surf, text, textSec } = useTheme();
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

  const motivoLabel = motivo ? (MOTIVO_LABELS[motivo] ?? motivo) : null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={s.backdrop}>
        <Animated.View
          style={[
            s.card,
            { backgroundColor: surf, opacity: cardOpacity, transform: [{ scale: cardScale }] },
          ]}
        >
          <Animated.View style={[s.iconWrap, { transform: [{ scale: iconScale }] }]}>
            <Ionicons name="close" size={48} color={colors.n0} />
          </Animated.View>

          <Text style={[s.title, { color: text }]}>Pedido cancelado pela loja</Text>
          <Text style={[s.subtitle, { color: textSec }]}>
            {lojaNome
              ? `A loja "${lojaNome}" cancelou o seu pedido.`
              : 'A loja cancelou o seu pedido.'}
          </Text>

          {motivoLabel && (
            <View style={s.motivoBox}>
              <Text style={s.motivoLabel}>Motivo</Text>
              <Text style={[s.motivoValue, { color: text }]}>{motivoLabel}</Text>
            </View>
          )}

          <Text style={[s.estornoTxt, { color: textSec }]}>
            O estoque dos itens voltou ao catálogo e nenhuma cobrança foi feita.
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
    backgroundColor: 'rgba(0,9,51,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
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
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 13.5, textAlign: 'center', marginTop: 6, lineHeight: 19 },
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
  motivoValue: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  estornoTxt: { fontSize: 12, textAlign: 'center', marginTop: 14, lineHeight: 17 },
  btn: {
    marginTop: 20,
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  btnTxt: { fontSize: 14, fontWeight: '700', color: colors.n0 },
});
