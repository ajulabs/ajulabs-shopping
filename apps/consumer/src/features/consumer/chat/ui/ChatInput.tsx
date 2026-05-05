// src/features/consumer/chat/ui/ChatInput.tsx

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Mic, MicOff } from 'lucide-react-native';
import { Audio } from 'expo-av';

const PLACEHOLDERS = [
  'Tênis preto até R$200...',
  'Fone bluetooth bom e barato...',
  'Presente pra mamãe...',
  'Camisa social tamanho M...',
  'Bolo de aniversário...',
];

interface Props {
  onSend: (texto: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [gravando, setGravando] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Placeholder rotativo
  useEffect(() => {
    if (isFocused) return;
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0, duration: 300, useNativeDriver: true,
      }).start(() => {
        setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }).start();
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [isFocused]);

  function handleSend() {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  }

  async function handleMicPress() {
    if (gravando) {
      await pararGravacao();
    } else {
      await iniciarGravacao();
    }
  }

  async function iniciarGravacao() {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permissão negada', 'Precisamos de acesso ao microfone.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setGravando(true);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível iniciar a gravação.');
    }
  }

  async function pararGravacao() {
    try {
      setGravando(false);
      await recordingRef.current?.stopAndUnloadAsync();
      const uri = recordingRef.current?.getURI();
      recordingRef.current = null;

      if (uri) {
        // Por enquanto preenche o input com placeholder de voz
        // Quando integrar Whisper/Speech-to-text, processa o uri aqui
        setValue('🎤 Áudio gravado — transcrição em breve');
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível parar a gravação.');
    }
  }

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 24,
      marginHorizontal: 16,
      marginBottom: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: gravando ? 2 : 0,
      borderColor: gravando ? '#f97316' : 'transparent',
    }}>

      {/* Placeholder animado */}
      {!value && !isFocused && (
        <Animated.Text style={{
          position: 'absolute',
          left: 16,
          opacity: fadeAnim,
          color: '#9ca3af',
          fontSize: 15,
          pointerEvents: 'none',
        }}>
          {gravando ? '🎤 Gravando...' : PLACEHOLDERS[placeholderIndex]}
        </Animated.Text>
      )}

      <TextInput
        style={{ flex: 1, fontSize: 15, color: '#1f2937' }}
        value={value}
        onChangeText={setValue}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={handleSend}
        returnKeyType="send"
        editable={!disabled && !gravando}
        placeholder=""
      />

      <TouchableOpacity
        onPress={gravando ? handleMicPress : (value.trim() ? handleSend : handleMicPress)}
        disabled={disabled}
        style={{
          marginLeft: 8,
          backgroundColor: gravando ? '#fff7ed' : 'transparent',
          borderRadius: 20,
          padding: 4,
        }}
      >
        {gravando
          ? <MicOff size={22} color="#f97316" />
          : <Mic size={22} color="#f97316" />
        }
      </TouchableOpacity>

    </View>
  );
}