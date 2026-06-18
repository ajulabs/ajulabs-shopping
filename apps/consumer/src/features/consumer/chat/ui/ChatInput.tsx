import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Mic, MicOff, Send } from 'lucide-react-native';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../shared/hooks';

const PLACEHOLDERS = [
  'Tênis preto até R$200...',
  'Fone bluetooth bom e barato...',
  'Presente pra mamãe...',
  'Camisa social tamanho M...',
  'Bolo de aniversário...',
];

interface Props {
  value: string;
  onChangeValue: (v: string) => void;
  onSend: () => void;
  onMicPress: () => void;
  gravando: boolean;
  transcrevendo: boolean;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChangeValue,
  onSend,
  onMicPress,
  gravando,
  transcrevendo,
  disabled,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { isDark, surf } = useTheme();
  const inputText = isDark ? colors.n0 : '#1f2937';
  const placeholder = isDark ? 'rgba(255,255,255,0.35)' : '#9ca3af';

  useEffect(() => {
    if (isFocused) return;
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [isFocused]);

  const isProcessing = gravando || transcrevendo;
  const canSend = !!value.trim() && !disabled && !isProcessing;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: surf,
        borderRadius: 24,
        marginHorizontal: 16,
        marginBottom: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.4 : 0.08,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: isProcessing ? 2 : 0,
        borderColor: isProcessing ? '#f97316' : 'transparent',
      }}
    >
      {!value && !isFocused && (
        <Animated.Text
          style={{
            position: 'absolute',
            left: 16,
            opacity: fadeAnim,
            color: placeholder,
            fontSize: 15,
            pointerEvents: 'none',
          }}
        >
          {gravando
            ? ' Gravando...'
            : transcrevendo
              ? ' Transcrevendo...'
              : PLACEHOLDERS[placeholderIndex]}
        </Animated.Text>
      )}

      <TextInput
        style={{ flex: 1, fontSize: 15, color: inputText }}
        value={value}
        onChangeText={onChangeValue}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={onSend}
        returnKeyType="send"
        editable={!disabled && !isProcessing}
        maxLength={1000}
        placeholder=""
      />

      <TouchableOpacity
        onPress={canSend || Platform.OS === 'web' ? onSend : onMicPress}
        disabled={disabled || transcrevendo || (!canSend && Platform.OS === 'web')}
        style={{
          marginLeft: 8,
          backgroundColor: canSend
            ? '#f97316'
            : gravando
              ? isDark
                ? 'rgba(242,118,15,0.15)'
                : '#fff7ed'
              : 'transparent',
          borderRadius: 20,
          padding: 8,
          width: 38,
          height: 38,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {transcrevendo ? (
          <ActivityIndicator size="small" color="#f97316" />
        ) : canSend ? (
          <Send size={20} color="#fff" />
        ) : Platform.OS !== 'web' && gravando ? (
          <MicOff size={22} color="#f97316" />
        ) : Platform.OS !== 'web' ? (
          <Mic size={22} color="#f97316" />
        ) : null}
      </TouchableOpacity>
    </View>
  );
}
