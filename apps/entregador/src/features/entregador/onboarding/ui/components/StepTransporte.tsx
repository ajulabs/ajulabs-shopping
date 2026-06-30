import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StepProps, TRANSPORTES } from '../../model/constants';
import { useMemo } from 'react';
import { useTheme } from '../../../../../shared/hooks';
import type { Theme } from '../../../../../shared/hooks/useTheme';

export function StepTransporte({ data, up, erros }: StepProps & { erros: Record<string, string> }) {
  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View>
      <Text style={s.stepDesc}>Qual meio de transporte você vai usar?</Text>
      {TRANSPORTES.map((t) => {
        const sel = data.transporte === t.id;
        return (
          <TouchableOpacity
            key={t.id}
            style={[s.transporteBtn, sel && s.transporteBtnActive]}
            onPress={() => up('transporte', t.id)}
            activeOpacity={0.85}
          >
            <View style={[s.transporteIcon, sel && { backgroundColor: '#F2760F' }]}>
              {t.lib === 'MaterialCommunityIcons' ? (
                <MaterialCommunityIcons
                  name={t.icon as any}
                  size={24}
                  color={sel ? '#FFFFFF' : '#2A3156'}
                />
              ) : (
                <Ionicons name={t.icon as any} size={24} color={sel ? '#FFFFFF' : '#2A3156'} />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[s.transporteLabel, sel && { color: '#F2760F' }]}>{t.label}</Text>
              <Text style={s.transporteDesc}>
                {t.rate} · {t.desc}
              </Text>
            </View>
            {sel && <Ionicons name="checkmark-circle" size={20} color="#F2760F" />}
          </TouchableOpacity>
        );
      })}
      {!!erros.transporte && <Text style={s.fieldError}>{erros.transporte}</Text>}
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    fieldError: { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },
    stepDesc: { fontSize: 13, color: theme.textMut, lineHeight: 19, marginBottom: 18 },
    transporteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.surf,
      marginBottom: 10,
    },
    transporteBtnActive: { borderColor: '#F2760F', backgroundColor: 'rgba(242,118,15,0.05)' },
    transporteIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    transporteLabel: { fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 2 },
    transporteDesc: { fontSize: 11.5, color: theme.textMut },
  });
}
