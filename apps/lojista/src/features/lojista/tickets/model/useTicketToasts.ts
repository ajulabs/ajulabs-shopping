import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTicketRealtime } from '@ajulabs/realtime';
import { useAuthLojistaStore } from '../../../../store';
import type { ToastData } from '../../../../shared/ui/NotificationToast';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/**
 * Realtime de tickets exibido como toast no shell do lojista.
 * Escuta novas mensagens/tickets do consumidor e leva à aba de tickets ao tocar.
 */
export function useTicketToasts() {
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const router = useRouter();
  const [toast, setToast] = useState<ToastData | null>(null);

  useTicketRealtime({
    apiUrl: API_URL,
    ticketId: null,
    roomId: lojaId ?? null,
    roomType: 'lojista',
    enabled: !!lojaId,
    onMensagem: (msg) => {
      if (msg.remetente !== 'consumidor') return;
      const nome = msg.remetenteNome ?? 'Consumidor';
      setToast({
        type: 'mensagem',
        title: `Nova mensagem de ${nome}`,
        body: msg.texto,
        onPress: () =>
          router.navigate({
            pathname: '/(lojista)/tickets',
            params: { autoTicketId: msg.ticketId },
          } as any),
      });
    },
    onNovo: (payload) => {
      const nome = payload.consumidorNome ?? 'Consumidor';
      setToast({
        type: 'novo',
        title: `Novo ticket de ${nome}`,
        body: payload.motivo,
        onPress: () =>
          router.navigate({
            pathname: '/(lojista)/tickets',
            params: { autoTicketId: payload.id },
          } as any),
      });
    },
  });

  return { toast, setToast };
}
