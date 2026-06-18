import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';

const STEPS = [
  { status: 'aberto', label: 'Ticket aberto', icon: 'alert-circle-outline' as const },
  { status: 'em_andamento', label: 'Em análise', icon: 'construct-outline' as const },
  { status: 'resolvido', label: 'Resolvido', icon: 'checkmark-circle' as const },
];

export function TicketTimeline({ status }: { status: string }) {
  const stepIdx = STEPS.findIndex((s) => s.status === status);
  if (status === 'cancelado') return null;
  return (
    <View style={tl.wrap}>
      {STEPS.map((step, i) => {
        const done = i <= stepIdx;
        const current = i === stepIdx;
        return (
          <View key={step.status} style={tl.row}>
            <View style={tl.iconCol}>
              <View style={[tl.dot, done && tl.dotDone, current && tl.dotCurrent]}>
                <Ionicons name={step.icon} size={14} color={done ? colors.n0 : colors.n300} />
              </View>
              {i < STEPS.length - 1 && (
                <View style={[tl.line, done && i < stepIdx && tl.lineDone]} />
              )}
            </View>
            <Text style={[tl.label, done && tl.labelDone]}>{step.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const tl = StyleSheet.create({
  wrap: { paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 40 },
  iconCol: { alignItems: 'center', marginRight: 12, width: 28 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.n200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.navy },
  dotCurrent: { backgroundColor: colors.orange },
  line: { width: 2, flex: 1, backgroundColor: colors.n200, marginVertical: 2 },
  lineDone: { backgroundColor: colors.navy },
  label: { fontSize: 13, color: colors.n500, paddingTop: 6 },
  labelDone: { color: colors.navy, fontWeight: '600' },
});
