import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MensagemChat, ProdutoCard, PedidoCard, TicketCard } from '@ajulabs/types';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../shared/hooks';
import { ChatRastreioMap } from './ChatRastreioMap';

interface Props {
  mensagens: MensagemChat[];
  sugestoes: string[];
  onSugestao: (texto: string, pedidoSelecionadoId?: string) => void;
  carregando: boolean;
}

export function ChatMsg({ mensagens, sugestoes, onSugestao, carregando }: Props) {
  const flatRef = useRef<FlatList>(null);
  const router = useRouter();
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());

  const { isDark, bg, surf } = useTheme();

  const CORES_CHAT = [
    'preto',
    'branco',
    'azul',
    'vermelho',
    'verde',
    'amarelo',
    'rosa',
    'cinza',
    'marrom',
    'bege',
    'laranja',
    'roxo',
    'vinho',
    'dourado',
    'prata',
    'nude',
    'off-white',
    'creme',
  ];

  function corDoProduto(produto: ProdutoCard): string | null {
    const variacoes = produto.variacoes ?? [];
    // 1 variação → mostra o nome dela (ex: "Preto", "Cor: Rosa" → "Rosa")
    if (variacoes.length === 1) {
      return variacoes[0].nome.replace(/^(cor|color)[:\s]+/i, '').trim();
    }
    // Sem variações → tenta extrair cor do nome do produto (word boundary)
    if (variacoes.length === 0) {
      const nome = produto.nome.toLowerCase();
      const cor = CORES_CHAT.find((c) => new RegExp(`\\b${c}\\b`).test(nome));
      if (cor) return cor.charAt(0).toUpperCase() + cor.slice(1);
    }
    // Múltiplas variações → o botão "Ver opções" já cobre
    return null;
  }
  const bubbleAju = surf;
  const textAju = isDark ? colors.n0 : '#1f2937';
  const cardBg = surf;
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6';
  const cardText = isDark ? colors.n0 : '#111827';
  const cardSub = isDark ? 'rgba(255,255,255,0.45)' : '#9ca3af';
  const imgBg = isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6';
  const chipBg = isDark ? 'rgba(242,118,15,0.15)' : '#fff7ed';
  const chipBorder = isDark ? 'rgba(242,118,15,0.3)' : '#fed7aa';
  const chipText = isDark ? '#F2760F' : '#c2410c';

  // ID da última mensagem da Aju — só ela tem elementos interativos.
  // Mensagens anteriores são somente leitura para evitar re-disparar fluxos antigos.
  const ultimaMensagemAjuId = [...mensagens].reverse().find((m) => m.remetente === 'aju')?.id;

  useEffect(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [mensagens, carregando]);

  const statusLabel: Record<string, string> = {
    aguardando: 'Aguardando',
    confirmado: 'Confirmado',
    preparando: 'Preparando',
    pronto: 'Pronto',
    saiu_entrega: 'Saiu para entrega',
    entregue: 'Entregue',
    cancelado: 'Cancelado',
  };

  const renderPedidoCard = (
    pedido: PedidoCard,
    onPress: () => void,
    opts: { destaque?: boolean; cta?: string | null } = {},
  ) => {
    const { destaque = false, cta } = opts;
    const ctaLabel = cta ?? `Este pedido #${pedido.numero}`;
    return (
      <TouchableOpacity
        key={pedido.id}
        onPress={onPress}
        activeOpacity={0.75}
        style={{
          backgroundColor: destaque ? (isDark ? 'rgba(249,115,22,0.15)' : '#fff7ed') : cardBg,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: destaque ? '#f97316' : cardBorder,
          padding: 14,
          marginBottom: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {pedido.lojaImagem ? (
            <Image
              source={{ uri: pedido.lojaImagem }}
              style={{ width: 40, height: 40, borderRadius: 10 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="storefront-outline" size={20} color={cardSub} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', fontSize: 14, color: cardText }} numberOfLines={1}>
              {pedido.loja}
            </Text>
            <Text style={{ fontSize: 12, color: cardSub, marginTop: 2 }}>
              {pedido.data} · {statusLabel[pedido.status] ?? pedido.status}
            </Text>
          </View>
          <Text style={{ fontWeight: '700', fontSize: 14, color: '#f97316' }}>
            R$ {pedido.total.toFixed(2).replace('.', ',')}
          </Text>
        </View>

        <View style={{ marginTop: 8 }}>
          {pedido.itens.slice(0, 3).map((item, i) => (
            <Text key={i} style={{ fontSize: 12, color: cardSub, lineHeight: 18 }}>
              • {item}
            </Text>
          ))}
          {pedido.itens.length > 3 && (
            <Text style={{ fontSize: 12, color: cardSub }}>
              +{pedido.itens.length - 3} iten{pedido.itens.length - 3 > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {!destaque && cta !== null && (
          <View
            style={{
              marginTop: 10,
              backgroundColor: '#f97316',
              borderRadius: 8,
              paddingVertical: 7,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{ctaLabel}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item: msg }: { item: MensagemChat }) => {
    const isAju = msg.remetente === 'aju';
    const tipo = msg.resposta?.tipo;
    const isAtiva = msg.id === ultimaMensagemAjuId;

    return (
      <View
        style={{
          alignSelf: isAju ? 'flex-start' : 'flex-end',
          width:
            tipo === 'selecionarPedido' ||
            tipo === 'confirmarPedido' ||
            tipo === 'listarPedidos' ||
            tipo === 'verTickets' ||
            msg.resposta?.produtos ||
            msg.resposta?.rastreio
              ? '100%'
              : 'auto',
          maxWidth:
            tipo === 'selecionarPedido' ||
            tipo === 'confirmarPedido' ||
            tipo === 'listarPedidos' ||
            tipo === 'verTickets' ||
            msg.resposta?.produtos ||
            msg.resposta?.rastreio
              ? '100%'
              : '85%',
          marginBottom: 12,
        }}
      >
        <View
          style={{
            alignSelf: isAju ? 'flex-start' : 'flex-end',
            maxWidth: '85%',
            backgroundColor: isAju ? bubbleAju : '#f97316',
            borderRadius: 18,
            borderBottomLeftRadius: isAju ? 4 : 18,
            borderBottomRightRadius: isAju ? 18 : 4,
            paddingHorizontal: 16,
            paddingVertical: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.3 : 0.06,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <Text style={{ color: isAju ? textAju : '#fff', fontSize: 15, lineHeight: 21 }}>
            {msg.conteudo}
          </Text>
        </View>

        {/* Banner de aviso de strike */}
        {msg.resposta?.strikesCount != null && msg.resposta.strikesCount < 3 && (
          <View
            style={{
              marginTop: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: isDark ? 'rgba(234,179,8,0.15)' : '#fefce8',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(234,179,8,0.4)' : '#fde047',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Ionicons name="warning-outline" size={15} color="#ca8a04" />
            <Text style={{ fontSize: 12, color: isDark ? '#fde047' : '#854d0e', flex: 1 }}>
              Aviso {msg.resposta.strikesCount} de {msg.resposta.strikesMax ?? 3} — mais{' '}
              {(msg.resposta.strikesMax ?? 3) - msg.resposta.strikesCount} mensagem
              {(msg.resposta.strikesMax ?? 3) - msg.resposta.strikesCount > 1 ? 's' : ''} inadequada
              {(msg.resposta.strikesMax ?? 3) - msg.resposta.strikesCount > 1 ? 's' : ''} suspende o
              acesso por 1h.
            </Text>
          </View>
        )}

        {/* Cards de pedidos para seleção */}
        {tipo === 'selecionarPedido' && msg.resposta?.pedidos && (
          <View style={{ marginTop: 10, paddingHorizontal: 4 }}>
            {msg.resposta.pedidos.map((pedido) =>
              renderPedidoCard(
                pedido,
                isAtiva
                  ? () => onSugestao(`Pedido número ${pedido.numero} — ${pedido.loja}`, pedido.id)
                  : () => {},
                isAtiva ? {} : { destaque: false, cta: null },
              ),
            )}
          </View>
        )}

        {/* Lista de pedidos (informativa) — toque abre o rastreamento */}
        {tipo === 'listarPedidos' && msg.resposta?.pedidos && (
          <View style={{ marginTop: 10, paddingHorizontal: 4 }}>
            {msg.resposta.pedidos.map((pedido) =>
              renderPedidoCard(
                pedido,
                () => router.push(`/(consumer)/tracking/${pedido.id}` as any),
                { cta: 'Acompanhar' },
              ),
            )}
          </View>
        )}

        {/* Card de pedido selecionado para confirmação */}
        {tipo === 'confirmarPedido' && msg.resposta?.pedido && (
          <View style={{ marginTop: 10, paddingHorizontal: 4 }}>
            {renderPedidoCard(msg.resposta.pedido, () => {}, { destaque: true })}

            {isAtiva && (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={() => onSugestao('Sim, confirmar')}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    backgroundColor: '#22c55e',
                    borderRadius: 10,
                    paddingVertical: 11,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                    Sim, confirmar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onSugestao('Não, escolher outro pedido')}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
                    borderRadius: 10,
                    paddingVertical: 11,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: cardText, fontWeight: '600', fontSize: 14 }}>
                    Outro pedido
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Cards de produtos */}
        {msg.resposta?.produtos && msg.resposta.produtos.length > 0 && (
          <>
            <FlatList
              horizontal
              data={
                expandidas.has(msg.id) ? msg.resposta.produtos : msg.resposta.produtos.slice(0, 3)
              }
              keyExtractor={(p) => p.id}
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={170}
              getItemLayout={(_, i) => ({ length: 170, offset: 170 * i, index: i })}
              snapToAlignment="start"
              style={{ marginTop: 10 }}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              // "Ver mais" como último item do carrossel (não como pílula abaixo) —
              // mantém a ação dentro da faixa horizontal, longe dos chips de sugestão.
              ListFooterComponent={
                isAtiva && msg.resposta.produtos.length > 3 && !expandidas.has(msg.id) ? (
                  <TouchableOpacity
                    onPress={() => setExpandidas((prev) => new Set(prev).add(msg.id))}
                    activeOpacity={0.75}
                    style={{
                      width: 120,
                      height: 230,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: cardBorder,
                      backgroundColor: cardBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      paddingHorizontal: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: imgBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="arrow-forward" size={20} color={cardText} />
                    </View>
                    <Text
                      style={{
                        color: cardText,
                        fontSize: 13,
                        fontWeight: '700',
                        textAlign: 'center',
                      }}
                    >
                      Ver mais
                    </Text>
                    <Text style={{ color: cardSub, fontSize: 11, textAlign: 'center' }}>
                      +{msg.resposta.produtos.length - 3} produto
                      {msg.resposta.produtos.length - 3 > 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                ) : null
              }
              renderItem={({ item: produto, index }) => (
                <View
                  style={{
                    width: 160,
                    height: 230,
                    backgroundColor: cardBg,
                    borderRadius: 14,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: cardBorder,
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOpacity: isDark ? 0.4 : 0.07,
                    shadowRadius: 4,
                  }}
                >
                  <View
                    style={{
                      height: 100,
                      backgroundColor: imgBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {produto.imagemUrl ? (
                      <Image
                        source={{ uri: produto.imagemUrl }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons
                        name="bag-outline"
                        size={28}
                        color={isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af'}
                      />
                    )}
                    {/* Badge de posição — alinha o usuário com o AI ao referenciar "item 1, 2, 3" */}
                    <View
                      style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        backgroundColor: '#f97316',
                        borderRadius: 10,
                        width: 20,
                        height: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
                        {index + 1}
                      </Text>
                    </View>
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 6,
                        left: 6,
                        backgroundColor: '#000000aa',
                        borderRadius: 6,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <Ionicons name="time-outline" size={10} color="#fff" />
                      <Text style={{ fontSize: 10, color: '#fff' }}>{produto.tempoEntrega}</Text>
                    </View>
                  </View>

                  <View style={{ flex: 1, padding: 10, justifyContent: 'space-between' }}>
                    <View>
                      <Text
                        style={{ fontWeight: '600', fontSize: 13, color: cardText, lineHeight: 17 }}
                        numberOfLines={2}
                      >
                        {produto.nome}
                      </Text>
                      {(() => {
                        const cor = corDoProduto(produto);
                        return (
                          <Text
                            style={{ fontSize: 11, color: cardSub, marginTop: 2 }}
                            numberOfLines={1}
                          >
                            {produto.loja}
                            {cor ? ` · ${cor}` : ''}
                          </Text>
                        );
                      })()}
                    </View>

                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontWeight: '700', fontSize: 15, color: cardText }}>
                          R$ {produto.preco.toFixed(2).replace('.', ',')}
                        </Text>
                        {produto.precoOriginal && (
                          <Text
                            style={{
                              fontSize: 11,
                              color: cardSub,
                              textDecorationLine: 'line-through',
                            }}
                          >
                            R$ {produto.precoOriginal.toFixed(2).replace('.', ',')}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          router.push({
                            pathname: '/(consumer)/produto/[id]' as any,
                            params: {
                              id: produto.id,
                              ...(msg.resposta?.quantidade
                                ? { quantidade: String(msg.resposta.quantidade) }
                                : {}),
                            },
                          });
                        }}
                        activeOpacity={0.8}
                        style={{
                          marginTop: 6,
                          backgroundColor: isDark ? colors.orange : '#111827',
                          borderRadius: 8,
                          paddingVertical: 7,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                          {msg.resposta?.quantidade && msg.resposta.quantidade > 1
                            ? `Ver na loja · ${msg.resposta.quantidade}x`
                            : 'Ver na loja'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />
          </>
        )}

        {tipo === 'ticketCriado' && (
          <TouchableOpacity
            onPress={() => router.push('/(consumer)/tickets' as any)}
            activeOpacity={0.85}
            style={{
              marginTop: 10,
              backgroundColor: isDark ? 'rgba(220,38,38,0.15)' : '#fef2f2',
              borderWidth: 1.5,
              borderColor: isDark ? 'rgba(220,38,38,0.4)' : '#fca5a5',
              borderRadius: 14,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: '#DC2626',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="ticket" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#fca5a5' : '#991b1b' }}
              >
                Ver meus tickets
              </Text>
              <Text
                style={{
                  fontSize: 11.5,
                  color: isDark ? 'rgba(252,165,165,0.7)' : '#ef4444',
                  marginTop: 1,
                }}
              >
                Acompanhe o andamento em Pedidos
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#fca5a5' : '#ef4444'} />
          </TouchableOpacity>
        )}

        {tipo === 'ticketDuplicado' && (
          <TouchableOpacity
            onPress={() => router.push('/(consumer)/tickets' as any)}
            activeOpacity={0.85}
            style={{
              marginTop: 10,
              backgroundColor: isDark ? 'rgba(249,115,22,0.12)' : '#fff7ed',
              borderWidth: 1.5,
              borderColor: isDark ? 'rgba(249,115,22,0.35)' : '#fed7aa',
              borderRadius: 14,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: '#f97316',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="ticket-outline" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#fed7aa' : '#c2410c' }}
              >
                Ver reclamação aberta
              </Text>
              <Text
                style={{
                  fontSize: 11.5,
                  color: isDark ? 'rgba(253,215,170,0.7)' : '#f97316',
                  marginTop: 1,
                }}
              >
                Acompanhe o andamento do ticket existente
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#fed7aa' : '#f97316'} />
          </TouchableOpacity>
        )}

        {/* Cards de tickets consultados + botão de navegação */}
        {tipo === 'verTickets' && msg.resposta?.tickets && (
          <View style={{ marginTop: 10, paddingHorizontal: 4 }}>
            {msg.resposta.tickets.map((ticket: TicketCard) => {
              const ticketStatusLabel: Record<string, string> = {
                aberto: 'Aberto',
                em_andamento: 'Em andamento',
                resolvido: 'Resolvido',
                cancelado: 'Cancelado',
              };
              const ticketStatusColor: Record<string, string> = {
                aberto: '#DC2626',
                em_andamento: '#f97316',
                resolvido: '#22c55e',
                cancelado: '#9ca3af',
              };
              const cor = ticketStatusColor[ticket.status] ?? '#9ca3af';
              return (
                <View
                  key={ticket.protocolo}
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: cardBorder,
                    padding: 14,
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontWeight: '700', fontSize: 13, color: cardText }}>
                      {ticket.protocolo}
                    </Text>
                    <View
                      style={{
                        backgroundColor: cor + '22',
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '600', color: cor }}>
                        {ticketStatusLabel[ticket.status] ?? ticket.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: cardSub, marginTop: 6 }} numberOfLines={2}>
                    {ticket.motivo}
                  </Text>
                  {ticket.respostas && ticket.respostas.length > 0 && (
                    <View
                      style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTopWidth: 1,
                        borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: isDark ? '#fca5a5' : '#991b1b',
                          marginBottom: 2,
                        }}
                      >
                        Resposta da loja:
                      </Text>
                      <Text style={{ fontSize: 12, color: cardText }} numberOfLines={3}>
                        {ticket.respostas[0].texto}
                      </Text>
                      <Text style={{ fontSize: 11, color: cardSub, marginTop: 2 }}>
                        {new Date(ticket.respostas[0].criadoEm).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 11, color: cardSub, marginTop: 4 }}>
                    Aberto em {new Date(ticket.criadoEm).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              );
            })}
            <TouchableOpacity
              onPress={() => router.push('/(consumer)/tickets' as any)}
              activeOpacity={0.85}
              style={{
                backgroundColor: isDark ? 'rgba(220,38,38,0.15)' : '#fef2f2',
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(220,38,38,0.4)' : '#fca5a5',
                borderRadius: 14,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginTop: 4,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: '#DC2626',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="ticket" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#fca5a5' : '#991b1b' }}
                >
                  Gerenciar tickets
                </Text>
                <Text
                  style={{
                    fontSize: 11.5,
                    color: isDark ? 'rgba(252,165,165,0.7)' : '#ef4444',
                    marginTop: 1,
                  }}
                >
                  Ver todos os detalhes e respostas
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#fca5a5' : '#ef4444'} />
            </TouchableOpacity>
          </View>
        )}

        {/* Mini mapa de rastreio em tempo real */}
        {msg.resposta?.rastreio && <ChatRastreioMap rastreio={msg.resposta.rastreio} />}

        {isAtiva && msg.resposta?.sugestoes && msg.resposta.sugestoes.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 8,
              paddingHorizontal: 4,
            }}
          >
            {msg.resposta.sugestoes.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => onSugestao(s)}
                style={{
                  backgroundColor: chipBg,
                  borderWidth: 1,
                  borderColor: chipBorder,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: chipText, fontSize: 13 }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <FlatList
        ref={flatRef}
        data={mensagens}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 8, backgroundColor: bg }}
        style={{ backgroundColor: bg }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          <>
            {carregando && (
              <View style={{ alignSelf: 'flex-start', marginBottom: 12 }}>
                <View
                  style={{
                    backgroundColor: bubbleAju,
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
            {sugestoes.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {sugestoes.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => onSugestao(s)}
                    style={{
                      backgroundColor: chipBg,
                      borderWidth: 1,
                      borderColor: chipBorder,
                      borderRadius: 20,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: chipText, fontSize: 13 }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        }
      />
    </>
  );
}
