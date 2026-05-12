import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusPedido } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';

const STEPS = [
  { key: 'confirmado',   label: 'Pedido recebido',  desc: 'Recebemos seu pedido e repassamos pra loja' },
  { key: 'preparando',   label: 'Loja preparando',  desc: 'A loja confirmou e está separando os itens' },
  { key: 'saiu_entrega', label: 'Saiu pra entrega', desc: 'Motoboy a caminho do seu endereço' },
  { key: 'entregue',     label: 'Entregue',         desc: 'Pedido entregue com sucesso' },
] as const;

const STATUS_TO_IDX: Record<StatusPedido, number> = {
  aguardando:   -1,
  confirmado:    0,
  preparando:    1,
  pronto:        2,
  saiu_entrega:  2,
  entregue:      3,
  cancelado:    -1,
};

interface Props {
  status: StatusPedido;
  isDark?: boolean;
}

export function TrackingTimeline({ status, isDark = false }: Props) {
  const currentIdx = STATUS_TO_IDX[status];

  const dotBorder  = isDark ? colors.bgDark  : '#FAFBFE';
  const pendingDot = isDark ? 'rgba(255,255,255,0.12)' : colors.n100;
  const pendingLine= isDark ? 'rgba(255,255,255,0.10)' : colors.n200;
  const textActive = isDark ? colors.n0      : colors.navy;
  const textMuted  = isDark ? 'rgba(255,255,255,0.4)' : colors.n500;
  const descColor  = isDark ? 'rgba(255,255,255,0.55)' : colors.n600;

  return (
    <View style={styles.container}>
      {STEPS.map((step, i) => {
        const done    = i < currentIdx;
        const active  = i === currentIdx;
        const isLast  = i === STEPS.length - 1;

        return (
          <View key={step.key} style={styles.row}>
            {!isLast && (
              <View style={[
                styles.line,
                { backgroundColor: done ? colors.orange : pendingLine },
              ]} />
            )}

            <View style={[
              styles.dot,
              { backgroundColor: (done || active) ? colors.orange : pendingDot,
                borderColor: active ? 'rgba(242,118,15,0.25)' : dotBorder },
              active && styles.dotActive,
            ]}>
              {done   && <Ionicons name="checkmark" size={10} color="#fff" />}
              {active && <View style={styles.dotPulse} />}
            </View>

            <View style={styles.textBox}>
              <Text style={[
                styles.label,
                { color: (done || active) ? textActive : textMuted },
                (done || active) && { fontWeight: '600' },
              ]}>
                {step.label}
              </Text>
              {active && (
                <Text style={[styles.desc, { color: descColor }]}>{step.desc}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingLeft: 4 },
  row:       { flexDirection: 'row', gap: 12, position: 'relative', paddingBottom: 16 },
  line:      { position: 'absolute', left: 9, top: 20, bottom: 0, width: 2, borderRadius: 1 },
  dot:       { width: 20, height: 20, borderRadius: 10,
               alignItems: 'center', justifyContent: 'center', zIndex: 1, borderWidth: 3 },
  dotActive: { borderWidth: 3 },
  dotPulse:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  textBox:   { flex: 1, paddingTop: 1 },
  label:     { fontSize: 13, fontWeight: '500' },
  desc:      { fontSize: 11.5, marginTop: 2, lineHeight: 16 },
});
