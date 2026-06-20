import { useState, useRef } from 'react';
import { ScrollView, Alert } from 'react-native';
import { LojistaService } from '@ajulabs/api-client';
import { useTicketRealtime } from '@ajulabs/realtime';
import { useAuthLojistaStore } from '../../../../store';
import { Ticket, STATUS_META, STATUS_NEXT, STATUS_NEXT_LABEL, mapTicket } from './data';
import { API_URL } from '../lib/constants';

interface Params {
  ticket: Ticket;
  token: string;
  onUpdate: (t: Ticket) => void;
}

export function useTicketDetail({ ticket, token, onUpdate }: Params) {
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const [nota, setNota] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [addingNota, setAddingNota] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useTicketRealtime({
    apiUrl: API_URL,
    ticketId: ticket.id,
    roomId: lojaId,
    roomType: 'lojista',
    enabled: !!lojaId,
    onMensagem: (msg) => {
      if (msg.remetente === 'lojista') return;
      onUpdate({
        ...ticket,
        mensagens: [
          ...ticket.mensagens,
          {
            id: msg.id,
            remetente: msg.remetente as 'consumidor' | 'lojista',
            texto: msg.texto,
            criadoEm: msg.criadoEm,
          },
        ],
      });
    },
  });

  const proximoStatus = STATUS_NEXT[ticket.status];
  const proximoLabel = STATUS_NEXT_LABEL[ticket.status];
  const meta = STATUS_META[ticket.status];

  async function avancarStatus() {
    if (!proximoStatus) return;
    setSaving(true);
    try {
      await LojistaService.atualizarStatusTicket(ticket.id, proximoStatus, token);
      const raw = await LojistaService.buscarTicket(ticket.id, token);
      if (raw) onUpdate(mapTicket(raw));
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    }
    setSaving(false);
  }

  async function toggleUrgente() {
    setSaving(true);
    try {
      await LojistaService.toggleUrgenteTicket(ticket.id, !ticket.urgente, token);
      onUpdate({ ...ticket, urgente: !ticket.urgente });
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o ticket.');
    }
    setSaving(false);
  }

  async function enviarMensagem() {
    if (!msg.trim()) return;
    setSendingMsg(true);
    try {
      const nova = await LojistaService.enviarMensagemTicket(ticket.id, msg.trim(), token);
      onUpdate({
        ...ticket,
        mensagens: [
          ...ticket.mensagens,
          {
            id: nova.id,
            remetente: 'lojista',
            texto: nova.texto,
            criadoEm: nova.criadoEm ?? nova.criado_em,
          },
        ],
      });
      setMsg('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
    }
    setSendingMsg(false);
  }

  async function enviarNota() {
    if (!nota.trim()) return;
    setAddingNota(true);
    try {
      const novaNota = await LojistaService.adicionarNotaTicket(ticket.id, nota.trim(), token);
      onUpdate({
        ...ticket,
        notas: [
          ...ticket.notas,
          {
            id: novaNota.id,
            texto: novaNota.texto,
            criadoEm: novaNota.criadoEm ?? novaNota.criado_em,
          },
        ],
      });
      setNota('');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a nota.');
    }
    setAddingNota(false);
  }

  return {
    nota,
    setNota,
    msg,
    setMsg,
    saving,
    addingNota,
    sendingMsg,
    scrollRef,
    proximoStatus,
    proximoLabel,
    meta,
    avancarStatus,
    toggleUrgente,
    enviarMensagem,
    enviarNota,
  };
}
