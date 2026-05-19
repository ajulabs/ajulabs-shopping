import { useState, useRef } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import { TranscricaoService } from '@ajulabs/api-client';
import { useAuthStore } from '../../../../store';

export function useTranscricao() {
  const [gravando, setGravando] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const token = useAuthStore((s) => s.token) ?? '';

  async function toggleGravacao(onTexto: (texto: string) => void) {
    if (gravando) {
      await pararGravacao(onTexto);
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

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      recordingRef.current = recording;
      setGravando(true);
    } catch {
      Alert.alert('Erro', 'Não foi possível iniciar a gravação.');
    }
  }

  async function pararGravacao(onTexto: (texto: string) => void) {
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
        const texto = await TranscricaoService.transcrever(uri, token);
        onTexto(texto);
      } catch {
        Alert.alert('Erro ao transcrever', 'Não consegui entender o áudio. Tente falar novamente ou digite sua mensagem.');
      } finally {
        setTranscrevendo(false);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível processar o áudio.');
      setTranscrevendo(false);
    }
  }

  return { gravando, transcrevendo, toggleGravacao };
}
