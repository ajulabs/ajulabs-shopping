import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StepProps, TRANSPORTES } from '../../model/constants';

export function StepTransporte({ data, up, erros }: StepProps & { erros: Record<string, string> }) {
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

const s = StyleSheet.create({
  fieldError: { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },
  stepDesc: { fontSize: 13, color: '#9099B3', lineHeight: 19, marginBottom: 18 },
  transporteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  transporteBtnActive: { borderColor: '#F2760F', backgroundColor: 'rgba(242,118,15,0.05)' },
  transporteIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transporteLabel: { fontSize: 15, fontWeight: '600', color: '#000933', marginBottom: 2 },
  transporteDesc: { fontSize: 11.5, color: '#9099B3' },
});
