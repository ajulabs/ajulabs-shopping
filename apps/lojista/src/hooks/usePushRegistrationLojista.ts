import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { PushService } from '@ajulabs/api-client';
import { useAuthLojistaStore } from '../features/lojista/auth/model/store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function obterExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    if (__DEV__) console.warn('[push-lojista] emuladores não recebem push');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Geral',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#000933',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    if (__DEV__) console.warn('[push-lojista] permissão negada');
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;

  if (!projectId) {
    if (__DEV__) console.warn('[push-lojista] expo projectId não encontrado');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (err) {
    if (__DEV__) console.warn('[push-lojista] falha ao obter token', err);
    return null;
  }
}

/**
 * Registra o device para push enquanto o lojista estiver logado.
 * Mesma lógica do hook do consumer, ajustado para o auth store do lojista.
 */
export function usePushRegistrationLojista(): void {
  const token = useAuthLojistaStore(s => s.token);
  const lojistaId = useAuthLojistaStore(s => s.lojistaId);
  const tokenRegistradoRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token || !lojistaId) {
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
          appTipo: 'lojista',
        });
        tokenRegistradoRef.current = expoToken;
      } catch (err) {
        if (__DEV__) console.warn('[push-lojista] falha ao registrar token', err);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token, lojistaId]);
}
