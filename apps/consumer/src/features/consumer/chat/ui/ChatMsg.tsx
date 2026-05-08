import { useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MensagemChat, ProdutoCard, Loja } from '@ajulabs/types';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useCartStore } from '../../cart/model/store';

interface Props {
  mensagens: MensagemChat[];
  sugestoes: string[];
  onSugestao: (texto: string) => void;
  carregando: boolean;
}

export function ChatMsg({ mensagens, sugestoes, onSugestao, carregando }: Props) {
  const flatRef = useRef<FlatList>(null);
  const adicionar = useCartStore(s => s.adicionar);
  const cachearLoja = useCartStore(s => s.cachearLoja);
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [mensagens, carregando]);

  const handleAdicionar = (card: ProdutoCard) => {
    const [minStr, maxStr] = card.tempoEntrega.replace(' min', '').split('–');
    const loja: Loja = {
      id: card.lojaId,
      nome: card.loja.split(' — ')[0],
      descricao: '',
      categoria: '',
      imagem: '',
      endereco: { rua: '', numero: '', bairro: '', cidade: 'Aracaju', cep: '' },
      avaliacao: 0,
      totalAvaliacoes: 0,
      tempoEntregaMin: parseInt(minStr) || 30,
      tempoEntregaMax: parseInt(maxStr) || 60,
      taxaEntrega: 0,
      aberta: true,
    };
    cachearLoja(loja);
    adicionar({
      id: card.id,
      lojaId: card.lojaId,
      nome: card.nome,
      descricao: '',
      preco: card.preco,
      imagem: card.imagemUrl,
      categoria: '',
      disponivel: true,
    });
    router.push('/(consumer)/carrinho');
  };

  const renderItem = ({ item: msg }: { item: MensagemChat }) => {
    const isAju = msg.remetente === 'aju';
    return (
      <View
        style={{
          alignSelf: isAju ? 'flex-start' : 'flex-end',
          width: msg.resposta?.produtos ? '100%' : 'auto',
          maxWidth: msg.resposta?.produtos ? '100%' : '85%',
          marginBottom: 12,
        }}
      >
        <View
          style={{
            alignSelf: isAju ? 'flex-start' : 'flex-end',
            maxWidth: '85%',
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

        {msg.resposta?.produtos && (
          <FlatList
            horizontal
            data={msg.resposta.produtos}
            keyExtractor={(p) => p.id}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={170}
            snapToAlignment="start"
            style={{ marginTop: 10 }}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
            renderItem={({ item: produto }) => (
              <View
                style={{
                  width: 160,
                  backgroundColor: '#fff',
                  borderRadius: 14,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: '#f3f4f6',
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOpacity: 0.07,
                  shadowRadius: 4,
                }}
              >
                <View style={{
                  height: 100,
                  backgroundColor: '#f3f4f6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ionicons name="bag-outline" size={28} color="#9ca3af" />
                  <View style={{
                    position: 'absolute', bottom: 6, left: 6,
                    backgroundColor: '#000000aa',
                    borderRadius: 6,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                  }}>
                    <Ionicons name="time-outline" size={10} color="#fff" />
                    <Text style={{ fontSize: 10, color: '#fff' }}>{produto.tempoEntrega}</Text>
                  </View>
                </View>

                <View style={{ padding: 10 }}>
                  <Text
                    style={{ fontWeight: '600', fontSize: 13, color: '#111827', lineHeight: 17 }}
                    numberOfLines={2}
                  >
                    {produto.nome}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {produto.loja}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
                    <Text style={{ fontWeight: '700', fontSize: 15, color: '#111827' }}>
                      R$ {produto.preco.toFixed(2)}
                    </Text>
                    {produto.precoOriginal && (
                      <Text style={{ fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through' }}>
                        R$ {produto.precoOriginal.toFixed(2)}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleAdicionar(produto)}
                    activeOpacity={0.8}
                    style={{
                      marginTop: 8,
                      backgroundColor: '#111827',
                      borderRadius: 8,
                      paddingVertical: 7,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>+ Adicionar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        {msg.resposta?.sugestoes && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, paddingHorizontal: 4 }}>
            {msg.resposta.sugestoes.map((s) => (
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
      </View>
    );
  };

  return (
    <FlatList
      ref={flatRef}
      data={mensagens}
      keyExtractor={(m) => m.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
      ListFooterComponent={
        <>
          {carregando && (
            <View style={{ alignSelf: 'flex-start', marginBottom: 12 }}>
              <View style={{
                backgroundColor: '#fff',
                borderRadius: 18,
                borderBottomLeftRadius: 4,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}>
                <ActivityIndicator size="small" color="#f97316" />
              </View>
            </View>
          )}
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
        </>
      }
    />
  );
}
