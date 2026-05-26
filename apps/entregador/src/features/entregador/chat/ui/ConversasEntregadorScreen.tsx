import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PedidoChatService } from '@ajulabs/api-client';
import { useAuthEntregadorStore } from '../../auth/model/store';

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

interface Props {
  onBack: () => void;
  onAbrirChat: (pedidoId: string) => void;
}

export function ConversasEntregadorScreen({ onBack, onAbrirChat }: Props) {
  const token = useAuthEntregadorStore((s) => s.token);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const lista = await PedidoChatService.buscarHistorico(token);
      setChats(lista);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#000933" />
        </TouchableOpacity>
        <Text style={s.titulo}>Conversas</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color="#F2760F" />
        </View>
      ) : chats.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="chatbubbles-outline" size={48} color="#9099B3" />
          <Text style={s.emptyTxt}>Nenhuma conversa</Text>
          <Text style={s.emptyHint}>Suas conversas com clientes e lojistas aparecem aqui</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {chats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={s.chatItem}
              onPress={() => onAbrirChat(chat.pedidoId)}
              activeOpacity={0.75}
            >
              <View style={s.avatar}>
                <Ionicons name="storefront-outline" size={20} color="#F2760F" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.chatHeader}>
                  <Text style={s.lojaNome} numberOfLines={1}>
                    {chat.lojaNome ?? 'Loja'}
                  </Text>
                  {chat.ultimaMensagem && (
                    <Text style={s.tempo}>{tempoRelativo(chat.ultimaMensagem.criadoEm)}</Text>
                  )}
                </View>
                <Text style={s.ultimaMsg} numberOfLines={1}>
                  {chat.ultimaMensagem?.conteudo ?? 'Nenhuma mensagem'}
                </Text>
              </View>
              {!!chat.naoLidas && (
                <View style={s.badge}>
                  <Text style={s.badgeTxt}>{chat.naoLidas > 9 ? '9+' : chat.naoLidas}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F6F7FB',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E4E7F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: 20, fontWeight: '700', color: '#000933' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTxt: { fontSize: 16, fontWeight: '600', color: '#000933', marginTop: 12 },
  emptyHint: { fontSize: 13, color: '#9099B3', textAlign: 'center', paddingHorizontal: 32 },
  scroll: { padding: 16, gap: 10, paddingBottom: 40 },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF0E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lojaNome: { fontSize: 14, fontWeight: '700', color: '#000933', flex: 1 },
  tempo: { fontSize: 11, color: '#9099B3' },
  ultimaMsg: { fontSize: 13, color: '#9099B3', marginTop: 2 },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F2760F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
});
