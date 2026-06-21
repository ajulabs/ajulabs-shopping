import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../theme';

interface LoginFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
}

export function LoginField({
  label,
  value,
  onChange,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
}: LoginFieldProps) {
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
        <TextInput
          style={styles.inputInner}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.n600}
          secureTextEntry={secureTextEntry && !shown}
          keyboardType={keyboardType}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShown((s) => !s)} hitSlop={10} style={styles.eyeBtn}>
            <Ionicons
              name={shown ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.n600}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  inputRow: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  inputRowFocused: { borderColor: colors.orange },
  inputInner: { flex: 1, fontSize: 14, color: colors.navy },
  eyeBtn: { paddingLeft: 8 },
});
