import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../theme';
import { formatarHora, type HorarioDia } from '../../lib/horarios';
import { Toggle } from './Toggle';

export function HorarioGrid({
  horarios,
  onChange,
  dark,
}: {
  horarios: HorarioDia[];
  onChange: (index: number, updated: HorarioDia) => void;
  dark: boolean;
}) {
  const [sel, setSel] = useState(0);
  const h = horarios[sel];

  const textColor = dark ? colors.n0 : colors.navy;
  const subColor = dark ? 'rgba(255,255,255,0.45)' : colors.n500;
  const inputBg = dark ? 'rgba(255,255,255,0.07)' : colors.n0;
  const inputBorder = dark ? 'rgba(255,255,255,0.14)' : colors.n200;
  const panelDiv = dark ? 'rgba(255,255,255,0.08)' : colors.n100;

  return (
    <View>
      {/* ── Strip de dias ───────────────────────── */}
      <View style={styles.weekStrip}>
        {horarios.map((day, i) => {
          const isSelected = sel === i;
          return (
            <TouchableOpacity
              key={day.dia}
              style={[
                styles.dayPill,
                day.ativo && !isSelected && styles.dayPillActive,
                isSelected && styles.dayPillSelected,
              ]}
              onPress={() => setSel(i)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayPillText,
                  day.ativo && !isSelected && styles.dayPillTextActive,
                  isSelected && styles.dayPillTextSelected,
                ]}
              >
                {day.abreviacao}
              </Text>
              <View
                style={[
                  styles.dayPillDot,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(255,255,255,0.55)'
                      : day.ativo
                        ? colors.orange
                        : colors.n300,
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Painel de edição ────────────────────── */}
      <View style={[styles.dayEditPanel, { borderTopColor: panelDiv }]}>
        {/* Cabeçalho: nome + toggle */}
        <View style={styles.dayEditHead}>
          <View style={{ gap: 3 }}>
            <Text style={[styles.dayEditName, { color: textColor }]}>{h.dia}</Text>
            <View style={styles.dayEditStatusRow}>
              <View
                style={[
                  styles.dayEditDot,
                  { backgroundColor: h.ativo ? colors.orange : colors.n300 },
                ]}
              />
              <Text style={[styles.dayEditStatus, { color: h.ativo ? colors.orange : subColor }]}>
                {h.ativo ? 'Aberto neste dia' : 'Fechado neste dia'}
              </Text>
            </View>
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

        {/* Inputs de horário ou mensagem fechado */}
        {h.ativo ? (
          <View style={styles.dayEditTimes}>
            <View style={styles.dayTimeSlot}>
              <Text style={[styles.dayTimeSlotLabel, { color: subColor }]}>ABERTURA</Text>
              <TextInput
                style={[
                  styles.dayTimeSlotInput,
                  { backgroundColor: inputBg, borderColor: inputBorder, color: textColor },
                ]}
                value={h.abertura}
                onChangeText={(v) => onChange(sel, { ...h, abertura: formatarHora(v) })}
                keyboardType="numeric"
                maxLength={5}
                placeholder="00:00"
                placeholderTextColor={subColor}
              />
            </View>

            <View style={styles.dayTimeArrow}>
              <View style={[styles.dayTimeArrowLine, { backgroundColor: panelDiv }]} />
              <Ionicons name="arrow-forward-outline" size={16} color={subColor} />
              <View style={[styles.dayTimeArrowLine, { backgroundColor: panelDiv }]} />
            </View>

            <View style={styles.dayTimeSlot}>
              <Text style={[styles.dayTimeSlotLabel, { color: subColor }]}>FECHAMENTO</Text>
              <TextInput
                style={[
                  styles.dayTimeSlotInput,
                  { backgroundColor: inputBg, borderColor: inputBorder, color: textColor },
                ]}
                value={h.fechamento}
                onChangeText={(v) => onChange(sel, { ...h, fechamento: formatarHora(v) })}
                keyboardType="numeric"
                maxLength={5}
                placeholder="00:00"
                placeholderTextColor={subColor}
              />
            </View>
          </View>
        ) : (
          <View style={styles.dayClosedMsg}>
            <Ionicons name="moon-outline" size={22} color={subColor} />
            <Text style={[styles.dayClosedTxt, { color: subColor }]}>
              Sem horário configurado para este dia
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  weekStrip: { flexDirection: 'row', padding: 12, gap: 5 },
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

  dayEditPanel: { borderTopWidth: 1, padding: 16, gap: 18 },
  dayEditHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayEditName: { fontSize: 17, fontWeight: '800' },
  dayEditStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dayEditDot: { width: 7, height: 7, borderRadius: 3.5 },
  dayEditStatus: { fontSize: 12, fontWeight: '600' },

  dayEditTimes: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  dayTimeSlot: { flex: 1, gap: 8 },
  dayTimeSlotLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dayTimeSlotInput: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  dayTimeArrow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingBottom: 17 },
  dayTimeArrowLine: { width: 10, height: 1.5, borderRadius: 1 },

  dayClosedMsg: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  dayClosedTxt: { fontSize: 13, flex: 1 },
});
