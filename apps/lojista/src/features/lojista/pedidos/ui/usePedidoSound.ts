import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';

// Hook para tocar som de notificação de novo pedido
export function usePedidoSound() {
  const soundRef = useRef<any>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return; // web usa AudioContext diretamente

    // Native: carrega expo-av
    const loadSound = async () => {
      try {
        const { Audio } = await import('expo-av');
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        // Som gerado programaticamente (beep duplo)
        loadedRef.current = true;
      } catch (e) {
        console.warn('[usePedidoSound] Erro ao carregar audio:', e);
      }
    };

    loadSound();
    return () => {
      soundRef.current?.unloadAsync?.();
    };
  }, []);

  const tocarSom = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        // Web: gera beep com AudioContext
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        const tocarBeep = (startTime: number, duration: number, freq: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.3, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };

        // Dois beeps ascendentes
        tocarBeep(ctx.currentTime, 0.15, 880);
        tocarBeep(ctx.currentTime + 0.2, 0.2, 1100);
      } else {
        // Native: usa expo-av com som gerado
        const { Audio } = await import('expo-av');
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://www.soundjay.com/buttons/beep-01a.mp3' },
          { shouldPlay: true, volume: 1.0 }
        );
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) sound.unloadAsync();
        });
      }
    } catch (e) {
      console.warn('[usePedidoSound] Erro ao tocar som:', e);
    }
  }, []);

  return { tocarSom };
}