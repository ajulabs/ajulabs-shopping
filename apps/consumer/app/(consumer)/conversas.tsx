import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import { PedidoChatService } from '@ajulabs/api-client';
import { useTheme } from '../../src/hooks';
import { useAuthStore } from '../../src/store';

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function ConversasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const { bg, surf, border, borderL, text, textSec, backBtn } = useTheme();

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
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: surf, borderBottomColor: borderL, paddingTop: insets.top + 12 },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.navigate('/(consumer)/perfil')}
          style={[styles.btnBack, { backgroundColor: backBtn }]}
        >
          <Ionicons name="chevron-back" size={20} color={text} />
        </TouchableOpacity>
        <Text style={[styles.titulo, { color: text }]}>Conversas</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.orange} />
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={48} color={textSec as string} />
          <Text style={[styles.emptyTxt, { color: textSec as string }]}>
            Nenhuma conversa ainda
          </Text>
          <Text style={[styles.emptyHint, { color: textSec as string }]}>
            Suas conversas com lojas e entregadores aparecem aqui
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {chats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={[styles.chatItem, { backgroundColor: surf, borderColor: border }]}
              onPress={() => router.push(`/(consumer)/chat-pedido/${chat.pedidoId}`)}
              activeOpacity={0.75}
            >
              <View style={[styles.avatar, { backgroundColor: colors.orange + '22' }]}>
                <Text style={styles.avatarEmoji}>🏪</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.chatHeader}>
                  <Text style={[styles.lojaName, { color: text }]} numberOfLines={1}>
                    {chat.lojaNome ?? 'Loja'}
                  </Text>
                  {chat.ultimaMensagem && (
                    <Text style={[styles.tempo, { color: textSec as string }]}>
                      {tempoRelativo(chat.ultimaMensagem.criadoEm)}
                    </Text>
                  )}
                </View>
                <Text style={[styles.ultimaMsg, { color: textSec as string }]} numberOfLines={1}>
                  {chat.ultimaMensagem?.conteudo ?? 'Nenhuma mensagem'}
                </Text>
              </View>
              {!!chat.naoLidas && (
                <View style={styles.badge}>
                  <Text style={styles.badgeTxt}>{chat.naoLidas > 9 ? '9+' : chat.naoLidas}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  btnBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: 20, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTxt: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptyHint: { fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
  scroll: { padding: 16, gap: 10, paddingBottom: 40 },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 22 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lojaName: { fontSize: 14, fontWeight: '700', flex: 1 },
  tempo: { fontSize: 11 },
  ultimaMsg: { fontSize: 13, marginTop: 2 },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
});
