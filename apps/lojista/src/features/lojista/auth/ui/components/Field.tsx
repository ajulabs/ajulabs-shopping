import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../theme';

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  autoCorrect?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  isValid?: boolean;
  onBlur?: () => void;
  maxLength?: number;
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  autoCapitalize = 'none',
  autoCorrect,
  autoComplete,
  textContentType,
  isValid = false,
  onBlur,
  maxLength,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);

  const borderStyle = error
    ? styles.inputRowError
    : focused
      ? styles.inputRowFocused
      : isValid
        ? styles.inputRowValid
        : undefined;

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputRow, borderStyle]}>
        <TextInput
          style={styles.inputInner}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.n600}
          secureTextEntry={secureTextEntry && !shown}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          autoComplete={autoComplete}
          textContentType={textContentType}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
        />
        {isValid && !error && !secureTextEntry && !focused && (
          <Ionicons name="checkmark-circle" size={16} color="#16A34A" style={styles.validIcon} />
        )}
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
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 12 },
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
  inputRowError: { borderColor: '#E24B4A' },
  inputRowValid: { borderColor: '#16A34A' },
  inputInner: { flex: 1, fontSize: 14, color: colors.navy },
  validIcon: { marginLeft: 8 },
  eyeBtn: { paddingLeft: 8 },
  fieldError: { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },
});
