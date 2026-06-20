import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../theme';
import { formatarHora, type HorarioDia } from '../../lib/horarios';
import { Toggle } from './Toggle';

export function StepHorarios({
  horarios,
  onChange,
}: {
  horarios: HorarioDia[];
  onChange: (i: number, h: HorarioDia) => void;
}) {
  const [sel, setSel] = useState(0);
  const h = horarios[sel];

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Horário de funcionamento</Text>
      <Text style={styles.stepSub}>
        Configure quando sua loja estará aberta. Você pode alterar isso a qualquer momento em
        Perfil.
      </Text>

      <View style={styles.weekStrip}>
        {horarios.map((day, i) => (
          <TouchableOpacity
            key={day.dia}
            style={[
              styles.dayPill,
              day.ativo && sel !== i && styles.dayPillActive,
              sel === i && styles.dayPillSelected,
            ]}
            onPress={() => setSel(i)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dayPillText,
                day.ativo && sel !== i && styles.dayPillTextActive,
                sel === i && styles.dayPillTextSelected,
              ]}
            >
              {day.abreviacao}
            </Text>
            <View
              style={[
                styles.dayPillDot,
                {
                  backgroundColor:
                    sel === i ? 'rgba(255,255,255,0.55)' : day.ativo ? colors.orange : colors.n300,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.dayPanel}>
        <View style={styles.dayPanelHead}>
          <View>
            <Text style={styles.dayPanelName}>{h.dia}</Text>
            <Text style={[styles.dayPanelStatus, { color: h.ativo ? colors.orange : colors.n500 }]}>
              {h.ativo ? 'Aberto neste dia' : 'Fechado neste dia'}
            </Text>
          </View>
          <Toggle
            value={h.ativo}
            onValueChange={(v) =>
              onChange(sel, {
                ...h,
                ativo: v,
                abertura: v ? '08:00' : '--:--',
                fechamento: v ? '18:00' : '--:--',
              })
            }
          />
        </View>

        {h.ativo ? (
          <View style={styles.dayTimes}>
            <View style={styles.dayTimeSlot}>
              <Text style={styles.dayTimeLabel}>ABERTURA</Text>
              <TextInput
                style={styles.dayTimeInput}
                value={h.abertura}
                onChangeText={(v) => onChange(sel, { ...h, abertura: formatarHora(v) })}
                keyboardType="numeric"
                maxLength={5}
                placeholder="00:00"
                placeholderTextColor={colors.n500}
              />
            </View>
            <Ionicons
              name="arrow-forward-outline"
              size={18}
              color={colors.n400}
              style={{ marginTop: 24 }}
            />
            <View style={styles.dayTimeSlot}>
              <Text style={styles.dayTimeLabel}>FECHAMENTO</Text>
              <TextInput
                style={styles.dayTimeInput}
                value={h.fechamento}
                onChangeText={(v) => onChange(sel, { ...h, fechamento: formatarHora(v) })}
                keyboardType="numeric"
                maxLength={5}
                placeholder="00:00"
                placeholderTextColor={colors.n500}
              />
            </View>
          </View>
        ) : (
          <View style={styles.dayClosed}>
            <Ionicons name="moon-outline" size={20} color={colors.n500} />
            <Text style={styles.dayClosedText}>Sem horário configurado para este dia</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepContent: { padding: 20 },
  stepTitle: { fontSize: 18, fontWeight: '800', color: colors.navy, marginBottom: 6 },
  stepSub: { fontSize: 13, color: colors.n600, lineHeight: 19, marginBottom: 20 },
  weekStrip: { flexDirection: 'row', gap: 5, marginBottom: 4 },
  dayPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.n100,
  },
  dayPillActive: { backgroundColor: colors.orange100 },
  dayPillSelected: { backgroundColor: colors.navy },
  dayPillText: { fontSize: 11, fontWeight: '800', color: colors.n500 },
  dayPillTextActive: { color: colors.orange600 },
  dayPillTextSelected: { color: '#fff' },
  dayPillDot: { width: 5, height: 5, borderRadius: 2.5 },
  dayPanel: { marginTop: 12, backgroundColor: colors.n50, borderRadius: 14, padding: 16, gap: 16 },
  dayPanelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayPanelName: { fontSize: 16, fontWeight: '800', color: colors.navy },
  dayPanelStatus: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  dayTimes: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dayTimeSlot: { flex: 1, gap: 8 },
  dayTimeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dayTimeInput: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.navy,
  },
  dayClosed: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  dayClosedText: { fontSize: 13, color: colors.n500, flex: 1 },
});
