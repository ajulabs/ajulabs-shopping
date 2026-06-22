import { useEffect, useState, useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { EntregadorService } from '../../../../shared/lib/authServices';
import { useAuthEntregadorStore } from '../../../../store';

export function useNovaCorrida(pedidoId: string | undefined) {
  const router = useRouter();
  const token = useAuthEntregadorStore((s) => s.token);

  const [countdown, setCountdown] = useState(15);
  const [aceitando, setAceitando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Countdown 15s → recusa automática
  useEffect(() => {
    if (countdown <= 0) {
      router.back();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router]);

  // Pulso visual no botão de aceitar enquanto countdown roda
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  const aceitar = useCallback(async () => {
    if (!token || !pedidoId || aceitando) return;
    setAceitando(true);
    try {
      await EntregadorService.aceitarCorrida(token, pedidoId);
      // Volta pra Home — o app vai detectar a corrida ativa e abrir a tela apropriada.
      router.replace('/');
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : 'Não foi possível aceitar a corrida. Tente novamente.',
      );
      setAceitando(false);
    }
  }, [token, pedidoId, aceitando, router]);

  const recusar = useCallback(() => {
    router.back();
  }, [router]);

  return { countdown, aceitando, erro, pulseAnim, aceitar, recusar };
}
