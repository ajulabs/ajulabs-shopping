import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { LojistaService } from '@ajulabs/api-client';
import { useTicketRealtime } from '@ajulabs/realtime';
import { useAuthLojistaStore } from '../../../../store';
import { Ticket, TicketStatus, mapTicket } from './data';
import { API_URL } from '../lib/constants';

export function useTickets() {
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const lojaNome = useAuthLojistaStore((s) => s.lojaNome);
  const { autoTicketId } = useLocalSearchParams<{ autoTicketId?: string }>();
  const autoSelectHandled = useRef<string | undefined>(undefined);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | TicketStatus>('todos');
  const [selected, setSelected] = useState<Ticket | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!lojaId || !token) {
      setLoading(false);
      return;
    }
    try {
      const raw = await LojistaService.listarTickets(lojaId, token);
      setTickets(raw.map(mapTicket));
    } catch (err) {
      console.error('fetch error:', err);
    }
    setLoading(false);
  }, [lojaId, token]);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 60000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  useEffect(() => {
    if (!autoTicketId || autoSelectHandled.current === autoTicketId || tickets.length === 0) return;
    const ticket = tickets.find((t) => t.id === autoTicketId);
    if (ticket) {
      autoSelectHandled.current = autoTicketId;
      setSelected(ticket);
    }
  }, [autoTicketId, tickets]);

  useTicketRealtime({
    apiUrl: API_URL,
    ticketId: null,
    roomId: lojaId ?? null,
    roomType: 'lojista',
    enabled: !!lojaId,
    onNovo: fetchTickets,
    onMensagem: fetchTickets,
    onStatus: fetchTickets,
  });

  const handleTicketUpdate = useCallback((updated: Ticket) => {
    setTickets((ts) => ts.map((t) => (t.id === updated.id ? updated : t)));
    setSelected(updated);
  }, []);

  const list = filter === 'todos' ? tickets : tickets.filter((t) => t.status === filter);

  const countFor = (id: 'todos' | TicketStatus) =>
    id === 'todos' ? tickets.length : tickets.filter((t) => t.status === id).length;

  const abertos = tickets.filter((t) => t.status === 'aberto').length;

  return {
    token,
    lojaNome,
    tickets,
    loading,
    filter,
    setFilter,
    selected,
    setSelected,
    fetchTickets,
    handleTicketUpdate,
    list,
    countFor,
    abertos,
  };
}
