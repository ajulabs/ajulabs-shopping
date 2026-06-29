import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useTheme } from '../../../../../shared/hooks';
import type { Theme } from '../../../../../shared/hooks/useTheme';

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
  const theme = useTheme();
  const sr = useMemo(() => makeStyles(theme), [theme]);
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
        placeholderTextColor={theme.textMut}
        keyboardType={keyboard}
        style={[sr.input, focused && sr.inputFocused]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    label: { width: 70, fontSize: 13, fontWeight: '600', color: theme.textMut },
    input: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
      textAlign: 'right',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    inputFocused: { backgroundColor: 'rgba(242,118,15,0.06)' },
  });
}
