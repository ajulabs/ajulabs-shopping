import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Mic, MicOff, Send } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { TranscricaoService } from '@ajulabs/api-client';
import { colors } from '@ajulabs/theme';

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
  isDark?: boolean;
}

export function ChatInput({ onSend, disabled, isDark = false }: Props) {
  const [value, setValue] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);

  const surf        = isDark ? colors.surfDark : '#fff';
  const inputText   = isDark ? colors.n0       : '#1f2937';
  const placeholder = isDark ? 'rgba(255,255,255,0.35)' : '#9ca3af';

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
        Alert.alert('Permissão negada', 'Precisamos de acesso ao microfone para gravar sua mensagem.');
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
      console.error('Erro ao gravar:', e);
      Alert.alert('Erro', 'Não foi possível iniciar a gravação.');
    }
  }

  async function pararGravacao() {
    try {
      if (!recordingRef.current) return;

      setGravando(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        Alert.alert('Erro', 'Não foi possível salvar o áudio.');
        return;
      }

      setTranscrevendo(true);
      try {
        const texto = await TranscricaoService.transcrever(uri);
        setValue(texto);
      } catch (error) {
        console.error('Erro na transcrição:', error);
        Alert.alert(
          'Erro ao transcrever',
          'Não consegui entender o áudio. Tente falar novamente ou digite sua mensagem.'
        );
      } finally {
        setTranscrevendo(false);
      }

    } catch (e) {
      console.error('Erro ao parar gravação:', e);
      Alert.alert('Erro', 'Não foi possível processar o áudio.');
      setTranscrevendo(false);
    }
  }

  const isProcessing = gravando || transcrevendo;
  const canSend = value.trim() && !disabled && !isProcessing;

  return (
    <View style={{
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
    }}>

      {!value && !isFocused && (
        <Animated.Text style={{
          position: 'absolute',
          left: 16,
          opacity: fadeAnim,
          color: placeholder,
          fontSize: 15,
          pointerEvents: 'none',
        }}>
          {gravando
            ? ' Gravando...'
            : transcrevendo
            ? ' Transcrevendo...'
            : PLACEHOLDERS[placeholderIndex]
          }
        </Animated.Text>
      )}

      <TextInput
        style={{ flex: 1, fontSize: 15, color: inputText }}
        value={value}
        onChangeText={setValue}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={handleSend}
        returnKeyType="send"
        editable={!disabled && !isProcessing}
        placeholder=""
      />

      <TouchableOpacity
        onPress={canSend ? handleSend : handleMicPress}
        disabled={disabled || transcrevendo}
        style={{
          marginLeft: 8,
          backgroundColor: canSend
            ? '#f97316'
            : gravando
            ? isDark ? 'rgba(242,118,15,0.15)' : '#fff7ed'
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
        ) : gravando ? (
          <MicOff size={22} color="#f97316" />
        ) : (
          <Mic size={22} color="#f97316" />
        )}
      </TouchableOpacity>

    </View>
  );
}
