import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../../shared/hooks';

interface Props {
  steps: { id: string; label: string }[];
  stepIdx: number;
}

export function DeliveryTimeline({ steps, stepIdx }: Props) {
  const theme = useTheme();
  return (
    <View style={[s.timelineCard, { backgroundColor: theme.surf, borderColor: theme.border }]}>
      <Text style={[s.timelineTitle, { color: theme.text }]}>Status</Text>
      {steps.map((step, i) => {
        const done = i <= stepIdx;
        const active = i === stepIdx;
        return (
          <View key={step.id} style={s.stepRow}>
            {i < steps.length - 1 && (
              <View
                style={[s.stepLine, { backgroundColor: i < stepIdx ? '#DE6708' : theme.border }]}
              />
            )}
            <View
              style={[
                s.stepDot,
                done ? s.stepDotDone : [s.stepDotPending, { backgroundColor: theme.border }],
                active && s.stepDotActive,
              ]}
            >
              {done && !active && <Ionicons name="checkmark" size={10} color="#fff" />}
              {active && <View style={s.stepDotInner} />}
            </View>
            <Text
              style={[
                s.stepLabel,
                done
                  ? [s.stepLabelDone, { color: theme.text }]
                  : [s.stepLabelPending, { color: theme.textMut }],
              ]}
            >
              {step.label}
            </Text>
            {active && (
              <View style={s.nowBadge}>
                <Text style={s.nowBadgeText}>Agora</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  timelineCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  timelineTitle: { fontSize: 16, fontWeight: '700', color: '#000933', marginBottom: 14 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    position: 'relative',
  },
  stepLine: { position: 'absolute', left: 9, top: 28, width: 2, height: 24 },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepDotDone: { backgroundColor: '#DE6708' },
  stepDotPending: { backgroundColor: '#E4E7F1' },
  stepDotActive: {
    shadowColor: '#DE6708',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  stepDotInner: { width: 6, height: 6, borderRadius: 99, backgroundColor: '#fff' },
  stepLabel: { flex: 1, fontSize: 13.5 },
  stepLabelDone: { fontWeight: '600', color: '#000933' },
  stepLabelPending: { color: '#9099B3' },
  nowBadge: {
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  nowBadgeText: { fontSize: 11, fontWeight: '700', color: '#DE6708' },
});
