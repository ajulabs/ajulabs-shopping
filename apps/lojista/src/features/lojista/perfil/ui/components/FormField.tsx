import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../../../../../theme';

export function FormField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  dark,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
  dark: boolean;
}) {
  const textColor = dark ? colors.n0 : colors.navy;
  const subColor = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const inputBg = dark ? 'rgba(255,255,255,0.05)' : colors.n50;
  const border = dark ? 'rgba(255,255,255,0.08)' : colors.n200;

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: subColor }]}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          { backgroundColor: inputBg, borderColor: border, color: textColor },
          multiline && { minHeight: 70, textAlignVertical: 'top' },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={subColor}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 5 },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});
