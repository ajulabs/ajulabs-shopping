import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useTheme } from '../../../../../shared/hooks';
import type { Theme } from '../../../../../shared/hooks/useTheme';

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
  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={[s.input, focused && s.inputFocused, hasError && s.inputError]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.textMut}
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

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    input: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 13,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.bg,
    },
    inputInner: { flex: 1, fontSize: 15, color: theme.text },
    inputFocused: { borderColor: '#F2760F' },
    inputError: { borderColor: '#E14B3C', backgroundColor: '#FFF5F5' },
  });
}
