import { useRef, useCallback, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_KEY = 'lojista_notification_sound';

export type SomTipo = 'padrao' | 'rappi' | 'shopee' | 'suave';

export const SONS: { id: SomTipo; label: string; descricao: string }[] = [
  { id: 'padrao',  label: 'Padrao',  descricao: '3 bipes curtos — estilo iFood' },
  { id: 'rappi',   label: 'Urgente', descricao: '5 bipes rapidos crescentes' },
  { id: 'shopee',  label: 'Duplo',   descricao: 'Bipe duplo repetido' },
  { id: 'suave',   label: 'Suave',   descricao: 'Tom longo e chamativo' },
];

function tocarWebSom(tipo: SomTipo) {
  const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();

  const bip = (start: number, freq: number, dur: number, vol: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle'; // mais natural que square
    osc.frequency.value = freq;
    // envelope ADSR simples
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(vol, start + 0.01);
    gain.gain.setValueAtTime(vol, start + dur - 0.03);
    gain.gain.linearRampToValueAtTime(0, start + dur);
    osc.start(start);
    osc.stop(start + dur + 0.01);
  };

  const t = ctx.currentTime;

  if (tipo === 'padrao') {
    // iFood: 3 bipes iguais, curtos, agudos
    bip(t + 0.00, 1050, 0.12, 0.9);
    bip(t + 0.18, 1050, 0.12, 0.9);
    bip(t + 0.36, 1050, 0.18, 0.9);

  } else if (tipo === 'rappi') {
    // Urgente: 5 bipes crescendo em frequência
    bip(t + 0.00, 800,  0.10, 0.7);
    bip(t + 0.14, 900,  0.10, 0.8);
    bip(t + 0.28, 1000, 0.10, 0.9);
    bip(t + 0.42, 1100, 0.10, 1.0);
    bip(t + 0.56, 1200, 0.20, 1.0);

  } else if (tipo === 'shopee') {
    // Duplo: par de bipes repetido 2x
    bip(t + 0.00, 1000, 0.10, 0.9);
    bip(t + 0.14, 1200, 0.10, 0.9);
    bip(t + 0.40, 1000, 0.10, 0.9);
    bip(t + 0.54, 1200, 0.15, 0.9);

  } else if (tipo === 'suave') {
    // Tom descendente suave mas audivel
    bip(t + 0.00, 1100, 0.25, 0.8);
    bip(t + 0.35, 900,  0.25, 0.7);
    bip(t + 0.70, 750,  0.35, 0.6);
  }
}

export function usePedidoSound() {
  const soundRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const [somAtual, setSomAtual] = useState<SomTipo>('padrao');

  useEffect(() => {
    AsyncStorage.getItem(SOUND_KEY).then(v => {
      if (v) setSomAtual(v as SomTipo);
    }).catch(() => {});

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const salvarSom = useCallback(async (tipo: SomTipo) => {
    setSomAtual(tipo);
    await AsyncStorage.setItem(SOUND_KEY, tipo).catch(() => {});
  }, []);

  const tocarSom = useCallback(async (tipo?: SomTipo) => {
    const t = tipo ?? somAtual;
    try {
      if (Platform.OS === 'web') {
        // Toca imediatamente
        tocarWebSom(t);
        // Repete 3x com intervalo de 2s (como iFood)
        let count = 0;
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          count++;
          tocarWebSom(t);
          if (count >= 2) clearInterval(intervalRef.current);
        }, 2000);
      } else {
        const { Audio } = await import('expo-av');
        if (soundRef.current) {
          await soundRef.current.unloadAsync().catch(() => {});
        }
        const { sound } = await Audio.Sound.createAsync(
          require('../../../../../assets/notification.mp3'),
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
  }, [somAtual]);

  return { tocarSom, somAtual, salvarSom };
}