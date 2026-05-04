// src/features/consumer/chat/ui/ChatMsg.tsx

import { useRef, useEffect } from 'react';
import { MensagemChat } from '../../../../types';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';


interface Props {
  mensagens: MensagemChat[];
  sugestoes: string[];
  onSugestao: (texto: string) => void;
  carregando: boolean;
}

export function ChatMsg({ mensagens, sugestoes, onSugestao, carregando }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Rola para o fim quando chega nova mensagem
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [mensagens, carregando]);

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
      showsVerticalScrollIndicator={false}
    >
      {mensagens.map((msg) => {
        const isAju = msg.remetente === 'aju';
        return (
          <View
            key={msg.id}
            style={{
              alignSelf: isAju ? 'flex-start' : 'flex-end',
              maxWidth: '80%',
              marginBottom: 12,
            }}
          >
            <View
              style={{
                backgroundColor: isAju ? '#fff' : '#f97316',
                borderRadius: 18,
                borderBottomLeftRadius: isAju ? 4 : 18,
                borderBottomRightRadius: isAju ? 18 : 4,
                paddingHorizontal: 16,
                paddingVertical: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <Text style={{ color: isAju ? '#1f2937' : '#fff', fontSize: 15, lineHeight: 21 }}>
                {msg.conteudo}
              </Text>
            </View>
          </View>
        );
      })}

      {/* Indicador de digitação da Aju */}
      {carregando && (
        <View style={{ alignSelf: 'flex-start', marginBottom: 12 }}>
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 18,
              borderBottomLeftRadius: 4,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <ActivityIndicator size="small" color="#f97316" />
          </View>
        </View>
      )}

      {/* Chips de sugestão */}
      {sugestoes.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {sugestoes.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => onSugestao(s)}
              style={{
                backgroundColor: '#fff7ed',
                borderWidth: 1,
                borderColor: '#fed7aa',
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: '#c2410c', fontSize: 13 }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}