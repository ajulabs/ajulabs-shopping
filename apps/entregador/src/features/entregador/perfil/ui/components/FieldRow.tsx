import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export function FieldRow({
  label,
  value,
  onChange,
  placeholder,
  keyboard = 'default',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboard?: any;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}
    >
      <Text style={sr.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9099B3"
        keyboardType={keyboard}
        style={[sr.input, focused && sr.inputFocused]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

const sr = StyleSheet.create({
  label: { width: 70, fontSize: 13, fontWeight: '600', color: '#9099B3' },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#000933',
    textAlign: 'right',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  inputFocused: { backgroundColor: 'rgba(242,118,15,0.06)' },
});
