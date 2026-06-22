import { useRef, useCallback, useEffect } from 'react';
import { Platform, Vibration } from 'react-native';

/**
 * Toca o alerta sonoro + vibração quando uma nova corrida é ofertada com o app
 * aberto (foreground). Loop enquanto a oferta está na tela, como apps de corrida
 * (iFood/Uber). Para automaticamente quando a oferta some.
 *
 * O som via push notification (app fechado/background) é tratado pelo canal
 * Android 'ride-alerts' em notificationChannels.ts — este hook cobre só o
 * foreground, onde a notificação não dispara.
 */
const VIBRATION_PATTERN = [0, 400, 200, 400, 200, 400];

export function useRideAlert() {
  const soundRef = useRef<any>(null);
  const loopingRef = useRef(false);

  const stop = useCallback(async () => {
    loopingRef.current = false;
    Vibration.cancel();
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {
        // ignore
      }
      soundRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (loopingRef.current) return; // já tocando
    loopingRef.current = true;

    // Vibração em loop (o padrão repete enquanto não for cancelado)
    if (Platform.OS !== 'web') {
      Vibration.vibrate(VIBRATION_PATTERN, true);
    }

    try {
      if (Platform.OS === 'web') {
        // Web: sem som custom (apps de corrida rodam em mobile); vibração já basta
        return;
      }
      const { Audio } = await import('expo-av');
      // Toca mesmo em modo silencioso (iOS) e em volume cheio
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
      }).catch(() => {});

      const { sound } = await Audio.Sound.createAsync(require('../../assets/corrida_alert.mp3'), {
        shouldPlay: true,
        volume: 1.0,
        isLooping: true,
      });
      soundRef.current = sound;
    } catch (e) {
      console.warn('[useRideAlert] erro ao tocar alerta:', e);
    }
  }, []);

  // Garante limpeza ao desmontar
  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  return { start, stop };
}
