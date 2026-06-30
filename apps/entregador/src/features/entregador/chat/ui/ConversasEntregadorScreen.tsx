import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConversasEntregador, tempoRelativo } from '../model/useConversasEntregador';
import { useMemo } from 'react';
import { useTheme } from '../../../../shared/hooks';
import type { Theme } from '../../../../shared/hooks/useTheme';

interface Props {
  onBack: () => void;
  onAbrirChat: (pedidoId: string) => void;
}

export function ConversasEntregadorScreen({ onBack, onAbrirChat }: Props) {
  const { chats, loading } = useConversasEntregador();

  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
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

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: theme.bg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titulo: { fontSize: 20, fontWeight: '700', color: theme.text },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    emptyTxt: { fontSize: 16, fontWeight: '600', color: theme.text, marginTop: 12 },
    emptyHint: { fontSize: 13, color: theme.textMut, textAlign: 'center', paddingHorizontal: 32 },
    scroll: { padding: 16, gap: 10, paddingBottom: 40 },
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 14,
      padding: 14,
      backgroundColor: theme.surf,
      borderWidth: 1,
      borderColor: theme.border,
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
    lojaNome: { fontSize: 14, fontWeight: '700', color: theme.text, flex: 1 },
    tempo: { fontSize: 11, color: theme.textMut },
    ultimaMsg: { fontSize: 13, color: theme.textMut, marginTop: 2 },
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
}
