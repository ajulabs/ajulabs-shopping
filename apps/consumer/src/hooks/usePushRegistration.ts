import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { PushService } from '@ajulabs/api-client';
import { useAuthStore } from '../store';

// Como as notificações se comportam quando o app está em foreground.
// Setamos uma vez no módulo — chamar em todo render é desnecessário.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function obterExpoPushToken(): Promise<string | null> {
  // Push web requer VAPID key configurada em app.json. Até lá, silencia
  // no web pra não poluir o console com erros nada actionable.
  if (Platform.OS === 'web') return null;

  // Push real só funciona em device físico.
  if (!Device.isDevice) {
    if (__DEV__) console.warn('[push] emuladores não recebem push, ignorando');
    return null;
  }

  if (Platform.OS === 'android') {
    // Canal default obrigatório no Android 8+ para notificações com som/heads-up.
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Geral',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B00',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    if (__DEV__) console.warn('[push] permissão negada');
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;

  if (!projectId) {
    if (__DEV__) console.warn('[push] expo projectId não encontrado, abortando');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (err) {
    if (__DEV__) console.warn('[push] falha ao obter token', err);
    return null;
  }
}

/**
 * Registra o device para receber push notifications enquanto o usuário
 * estiver logado. Idempotente: chama o backend uma única vez por token.
 * No logout, desregistra o token.
 */
export function usePushRegistration(): void {
  const token = useAuthStore(s => s.token);
  const userId = useAuthStore(s => s.userId);
  const tokenRegistradoRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token || !userId) {
      // Logout: se havia token registrado, marca como inativo no backend
      // (best-effort — ignora falha).
      const tokenAnterior = tokenRegistradoRef.current;
      if (tokenAnterior && token) {
        PushService.unregister(token, tokenAnterior).catch(() => {});
      }
      tokenRegistradoRef.current = null;
      return;
    }

    let cancelado = false;
    (async () => {
      const expoToken = await obterExpoPushToken();
      if (cancelado || !expoToken) return;
      if (tokenRegistradoRef.current === expoToken) return;

      try {
        await PushService.register(token, {
          expoToken,
          plataforma: Platform.OS as 'ios' | 'android' | 'web',
          appTipo: 'consumer',
        });
        tokenRegistradoRef.current = expoToken;
      } catch (err) {
        if (__DEV__) console.warn('[push] falha ao registrar token no backend', err);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token, userId]);
}
