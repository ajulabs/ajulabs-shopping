import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ConsumerTicketService } from '@ajulabs/api-client';
import { useTicketRealtime } from '@ajulabs/realtime';
import { useAuthStore } from '../../../../store';
import { TicketConsumidor, mapTicketConsumidor } from './data';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export function useTicketDetalhe(onMensagemEnviada?: () => void) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);

  const [ticket, setTicket] = useState<TicketConsumidor | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [avaliando, setAvaliando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    setTicket(null);
    setLoading(true);
  }, [id]);

  const carregar = useCallback(async () => {
    if (!token || !id) return;
    const raw = await ConsumerTicketService.buscar(id, token);
    if (raw) setTicket(mapTicketConsumidor(raw));
    setLoading(false);
  }, [token, id]);

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 60_000);
    return () => clearInterval(interval);
  }, [carregar]);

  useTicketRealtime({
    apiUrl: API_URL,
    ticketId: id ?? null,
    roomId: userId,
    roomType: 'usuario',
    enabled: !!userId && !!id,
    onMensagem: (m) => {
      if (m.remetente === 'consumidor') return;
      setTicket((t) =>
        t
          ? {
              ...t,
              mensagens: [
                ...t.mensagens,
                {
                  id: m.id,
                  remetente: m.remetente as 'consumidor' | 'lojista',
                  texto: m.texto,
                  criadoEm: m.criadoEm,
                },
              ],
            }
          : t,
      );
    },
    onStatus: (payload) => {
      setTicket((t) => (t ? { ...t, status: payload.status as any } : t));
    },
  });

  async function enviarMensagem() {
    if (!msg.trim() || !token || !ticket) return;
    setSending(true);
    try {
      const nova = await ConsumerTicketService.enviarMensagem(ticket.id, msg.trim(), token);
      setTicket((t) =>
        t
          ? {
              ...t,
              mensagens: [
                ...t.mensagens,
                {
                  id: nova.id,
                  remetente: 'consumidor',
                  texto: nova.texto,
                  criadoEm: nova.criadoEm ?? nova.criado_em,
                },
              ],
            }
          : t,
      );
      setMsg('');
      onMensagemEnviada?.();
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível enviar.');
    }
    setSending(false);
  }

  function cancelarTicket() {
    if (!token || !ticket) return;
    Alert.alert('Cancelar ticket', 'Tem certeza que deseja cancelar esta reclamação?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Cancelar ticket',
        style: 'destructive',
        onPress: async () => {
          setCancelando(true);
          try {
            await ConsumerTicketService.cancelar(ticket.id, token);
            setTicket((t) => (t ? { ...t, status: 'cancelado' } : t));
          } catch (e: any) {
            Alert.alert('Erro', e.message ?? 'Não foi possível cancelar.');
          }
          setCancelando(false);
        },
      },
    ]);
  }

  async function avaliarTicket(nota: number) {
    if (!token || !ticket) return;
    setAvaliando(true);
    try {
      await ConsumerTicketService.avaliar(ticket.id, nota, token);
      setTicket((t) => (t ? { ...t, avaliacaoConsumidor: nota } : t));
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível avaliar.');
    }
    setAvaliando(false);
  }

  return {
    ticket,
    loading,
    msg,
    setMsg,
    sending,
    avaliando,
    cancelando,
    enviarMensagem,
    cancelarTicket,
    avaliarTicket,
  };
}
