import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

export function PlainInput({
  value,
  onChange,
  placeholder,
  keyboard = 'default',
  maxLength,
  autoCapitalize = 'none',
  autoCorrect = false,
  hasError = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboard?: any;
  maxLength?: number;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  autoCorrect?: boolean;
  hasError?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[s.input, focused && s.inputFocused, hasError && s.inputError]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9099B3"
        keyboardType={keyboard}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        style={s.inputInner}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#F6F7FB',
  },
  inputInner: { flex: 1, fontSize: 15, color: '#000933' },
  inputFocused: { borderColor: '#F2760F' },
  inputError: { borderColor: '#E14B3C', backgroundColor: '#FFF5F5' },
});
