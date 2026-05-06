import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '@ajulabs/theme';

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string;
  autoCapitalize?: 'none' | 'words' | 'sentences';
}

export function Field({
  label, value, onChange, placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  autoCapitalize = 'none',
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          focused && styles.fieldInputFocused,
          error ? styles.fieldInputError : undefined,
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.n600}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field:             { marginBottom: 14 },
  fieldLabel:        { fontSize: 11, fontWeight: '700', color: colors.n600,
                       textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 },
  fieldInput:        { height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.n200,
                       backgroundColor: colors.n50, paddingHorizontal: 14,
                       fontSize: 14, color: colors.navy },
  fieldInputFocused: { borderColor: colors.orange },
  fieldInputError:   { borderColor: '#E24B4A' },
  errorText:         { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },
});
