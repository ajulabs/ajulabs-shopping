import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { PushService } from '@ajulabs/api-client';
import { useAuthEntregadorStore } from '../store';
import { getCurrentChatPedido } from '../utils/currentChat';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Se a notificação é de chat e o usuário está nessa tela específica,
    // descarta (o socket já entrega em tempo real).
    const data = notification.request.content.data as
      | { type?: string; pedidoId?: string }
      | undefined;
    if (data?.type === 'chat:mensagem' && data.pedidoId === getCurrentChatPedido()) {
      return {
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

async function obterExpoPushToken(): Promise<string | null> {
  // Push web requer VAPID key configurada em app.json. Até lá, silencia
  // no web pra não poluir o console com erros nada actionable.
  if (Platform.OS === 'web') return null;

  if (!Device.isDevice) {
    if (__DEV__) console.warn('[push-entregador] emuladores não recebem push');
    return null;
  }

  if (Platform.OS === 'android') {
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
    if (__DEV__) console.warn('[push-entregador] permissão negada');
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;

  if (!projectId) {
    if (__DEV__) console.warn('[push-entregador] expo projectId não encontrado');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (err) {
    if (__DEV__) console.warn('[push-entregador] falha ao obter token', err);
    return null;
  }
}

/**
 * Registra o device para push enquanto o entregador estiver logado.
 * Mesma lógica do hook do consumer/lojista, ajustado para o auth store
 * do entregador.
 */
export function usePushRegistrationEntregador(): void {
  const router = useRouter();
  const token = useAuthEntregadorStore(s => s.token);
  const entregadorId = useAuthEntregadorStore(s => s.entregadorId);
  const tokenRegistradoRef = useRef<string | null>(null);

  // Listener: quando o entregador toca numa notificação de corrida,
  // navega para a tela full-screen. Funciona tanto se o app estava em
  // background (cold start tratado em getLastNotificationResponseAsync)
  // quanto se está aberto.
  useEffect(() => {
    if (Platform.OS === 'web') return;

    function handleResponse(response: Notifications.NotificationResponse) {
      const data = response.notification.request.content.data as {
        type?: string;
        pedidoId?: string;
      };
      if (data?.type === 'corrida:oferta' && data.pedidoId) {
        router.push(`/nova-corrida/${data.pedidoId}` as never);
      } else if (data?.type === 'chat:mensagem' && data.pedidoId) {
        // Entregador acessa o chat via CourierApp (state interno) ou via
        // tab Conversas. Empurra a rota raiz e o app resolve o estado.
        router.push(`/?openChatPedidoId=${data.pedidoId}` as never);
      }
    }

    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);

    // Caso o app tenha sido aberto a partir da notificação (cold start),
    // pega a última resposta de notificação e roteia.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleResponse(response);
      })
      .catch(() => {});

    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (!token || !entregadorId) {
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
          appTipo: 'entregador',
        });
        tokenRegistradoRef.current = expoToken;
      } catch (err) {
        if (__DEV__) console.warn('[push-entregador] falha ao registrar token', err);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token, entregadorId]);
}
