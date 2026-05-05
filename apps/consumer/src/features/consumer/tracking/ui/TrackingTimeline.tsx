import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusPedido } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';

const STEPS = [
  { key: 'confirmado', label: 'Pedido recebido', desc: 'Recebemos seu pedido e repassamos pra loja' },
  { key: 'preparando', label: 'Loja preparando', desc: 'A loja confirmou e está separando os itens' },
  { key: 'saiu_entrega', label: 'Saiu pra entrega', desc: 'Motoboy a caminho do seu endereço' },
  { key: 'entregue', label: 'Entregue', desc: 'Pedido entregue com sucesso' },
] as const;

const STATUS_TO_IDX: Record<StatusPedido, number> = {
  aguardando: -1,
  confirmado: 0,
  preparando: 1,
  saiu_entrega: 2,
  entregue: 3,
  cancelado: -1,
};

interface Props {
  status: StatusPedido;
}

export function TrackingTimeline({ status }: Props) {
  const currentIdx = STATUS_TO_IDX[status];

  return (
    <View style={styles.container}>
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const pending = i > currentIdx;
        const isLast = i === STEPS.length - 1;

        return (
          <View key={step.key} style={styles.row}>
            {/* Linha vertical */}
            {!isLast && (
              <View style={[
                styles.line,
                { backgroundColor: done ? colors.orange : colors.n200 },
              ]} />
            )}

            {/* Bolinha */}
            <View style={[
              styles.dot,
              done && styles.dotDone,
              active && styles.dotActive,
            ]}>
              {done && <Ionicons name="checkmark" size={10} color="#fff" />}
              {active && <View style={styles.dotPulse} />}
            </View>

            {/* Texto */}
            <View style={styles.textBox}>
              <Text style={[
                styles.label,
                (done || active) && { color: colors.navy, fontWeight: '600' },
              ]}>
                {step.label}
              </Text>
              {active && (
                <Text style={styles.desc}>{step.desc}</Text>
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

  line:      { position: 'absolute', left: 9, top: 20, bottom: 0, width: 2,
               backgroundColor: colors.n200, borderRadius: 1 },

  dot:       { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.n100,
               alignItems: 'center', justifyContent: 'center', zIndex: 1,
               borderWidth: 3, borderColor: '#FAFBFE' },
  dotDone:   { backgroundColor: colors.orange, borderColor: '#FAFBFE' },
  dotActive: { backgroundColor: colors.orange, borderColor: 'rgba(242,118,15,0.25)',
               borderWidth: 3 },
  dotPulse:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },

  textBox:   { flex: 1, paddingTop: 1 },
  label:     { fontSize: 13, fontWeight: '500', color: colors.n500 },
  desc:      { fontSize: 11.5, color: colors.n600, marginTop: 2, lineHeight: 16 },
});