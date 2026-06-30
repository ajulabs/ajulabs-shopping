import { useState } from 'react';
import { View, TextInput, TextInputProps, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KB } from '../../model/constants';
import { useMemo } from 'react';
import { useTheme } from '../../../../../shared/hooks';
import type { Theme } from '../../../../../shared/hooks/useTheme';

export function Input({
  value,
  onChange,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect,
  autoComplete,
  textContentType,
  maxLength,
  onBlur: onBlurProp,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KB;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  autoCorrect?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  maxLength?: number;
  onBlur?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={[s.input, focused && s.inputFocused]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.textMut}
        secureTextEntry={secureTextEntry && !shown}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        autoComplete={autoComplete}
        textContentType={textContentType}
        maxLength={maxLength}
        style={s.inputInner}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlurProp?.();
        }}
      />
      {secureTextEntry && (
        <TouchableOpacity onPress={() => setShown((v) => !v)} hitSlop={10} style={s.eyeBtn}>
          <Ionicons
            name={shown ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={theme.textMut}
          />
        </TouchableOpacity>
      )}
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
    eyeBtn: { paddingLeft: 8 },
  });
}
