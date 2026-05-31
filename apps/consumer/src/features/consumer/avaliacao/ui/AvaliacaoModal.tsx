import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import {
  ItemPedido,
  TAGS_AVALIACAO_LOJA,
  TAGS_AVALIACAO_ENTREGADOR,
  type TagAvaliacao,
} from '@ajulabs/types';
import { useTheme } from '../../../../hooks';

interface NotasProdutos {
  [produtoId: string]: number;
}

interface ComentariosProdutos {
  [produtoId: string]: string;
}

interface Props {
  visible: boolean;
  lojaNome: string;
  entregadorNome?: string | null;
  itens: ItemPedido[];
  enviando: boolean;
  onEnviar: (dados: {
    notaLoja: number;
    comentarioLoja?: string;
    tagsLoja: string[];
    notaEntregador: number;
    comentarioEntregador?: string;
    tagsEntregador: string[];
    avaliacoesProdutos: { produtoId: string; nota: number; comentario?: string }[];
  }) => void;
  onFechar: () => void;
}

function StarRow({
  label,
  sublabel,
  nota,
  onChange,
  iconName,
  noBorder,
}: {
  label: string;
  sublabel?: string;
  nota: number;
  onChange: (n: number) => void;
  iconName: keyof typeof Ionicons.glyphMap;
  noBorder?: boolean;
}) {
  const { text, textSec, borderL } = useTheme();

  return (
    <View
      style={[styles.starRow, !noBorder && { borderBottomColor: borderL, borderBottomWidth: 1 }]}
    >
      <View style={styles.starRowLeft}>
        <View style={[styles.starIconBox, { backgroundColor: `${colors.orange}18` }]}>
          <Ionicons name={iconName} size={18} color={colors.orange} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.starLabel, { color: text }]}>{label}</Text>
          {sublabel ? (
            <Text style={[styles.starSublabel, { color: textSec as string }]}>{sublabel}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7} hitSlop={6}>
            <Ionicons
              name={n <= nota ? 'star' : 'star-outline'}
              size={26}
              color={n <= nota ? '#F59E0B' : '#D1D5DB'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function ComentarioInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { text, textSec, border, borderL } = useTheme();

  return (
    <View
      style={[
        styles.comentarioWrap,
        { borderColor: borderL, backgroundColor: `${colors.orange}06` },
      ]}
    >
      <TextInput
        style={[styles.comentario, { color: text }]}
        placeholder={placeholder}
        placeholderTextColor={textSec as string}
        multiline
        maxLength={500}
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}

function TagsSelector({
  nota,
  catalogo,
  selected,
  onToggle,
}: {
  nota: number;
  catalogo: TagAvaliacao[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const { text, textSec, borderL } = useTheme();

  // Tags só aparecem depois que o usuário escolheu uma nota.
  // Sentimento varia com a nota: 4-5 → positivas, 1-3 → negativas.
  if (nota === 0) return null;
  const sentimento = nota >= 4 ? 'positiva' : 'negativa';
  const visiveis = catalogo.filter((t) => t.sentimento === sentimento);
  if (visiveis.length === 0) return null;

  return (
    <View style={styles.tagsSection}>
      <Text style={[styles.tagsHint, { color: textSec as string }]}>
        {sentimento === 'positiva' ? 'O que foi bom? (opcional)' : 'O que pode melhorar? (opcional)'}
      </Text>
      <View style={styles.tagsWrap}>
        {visiveis.map((tag) => {
          const ativo = selected.includes(tag.id);
          return (
            <TouchableOpacity
              key={tag.id}
              onPress={() => onToggle(tag.id)}
              activeOpacity={0.7}
              style={[
                styles.tagChip,
                {
                  backgroundColor: ativo ? colors.orange : 'transparent',
                  borderColor: ativo ? colors.orange : borderL,
                },
              ]}
            >
              <Text
                style={[
                  styles.tagChipTxt,
                  { color: ativo ? '#FFFFFF' : (text as string) },
                ]}
              >
                {tag.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function AvaliacaoModal({
  visible,
  lojaNome,
  entregadorNome,
  itens,
  enviando,
  onEnviar,
  onFechar,
}: Props) {
  const { surf, text, textSec, borderL } = useTheme();

  const [notaLoja, setNotaLoja] = useState(0);
  const [comentarioLoja, setComentarioLoja] = useState('');
  const [tagsLoja, setTagsLoja] = useState<string[]>([]);
  const [notaEntregador, setNotaEntregador] = useState(0);
  const [comentarioEntregador, setComentarioEntregador] = useState('');
  const [tagsEntregador, setTagsEntregador] = useState<string[]>([]);
  const [notasProdutos, setNotasProdutos] = useState<NotasProdutos>({});
  const [comentariosProdutos, setComentariosProdutos] = useState<ComentariosProdutos>({});

  // Quando o usuário muda a nota cruzando o limite positivo/negativo (4),
  // as tags antigas ficam inválidas (eram positivas pra nota baixa, ou
  // vice-versa) e seriam silenciosamente filtradas no backend. Aqui
  // limpamos pra que a UI espelhe o que vai ser enviado.
  const sentimentoLoja = notaLoja === 0 ? null : notaLoja >= 4 ? 'positiva' : 'negativa';
  const sentimentoEntregador =
    notaEntregador === 0 ? null : notaEntregador >= 4 ? 'positiva' : 'negativa';
  React.useEffect(() => {
    if (tagsLoja.length === 0 || sentimentoLoja === null) return;
    const validas = tagsLoja.filter((id) => {
      const tag = TAGS_AVALIACAO_LOJA.find((t) => t.id === id);
      return tag?.sentimento === sentimentoLoja;
    });
    if (validas.length !== tagsLoja.length) setTagsLoja(validas);
  }, [sentimentoLoja]);
  React.useEffect(() => {
    if (tagsEntregador.length === 0 || sentimentoEntregador === null) return;
    const validas = tagsEntregador.filter((id) => {
      const tag = TAGS_AVALIACAO_ENTREGADOR.find((t) => t.id === id);
      return tag?.sentimento === sentimentoEntregador;
    });
    if (validas.length !== tagsEntregador.length) setTagsEntregador(validas);
  }, [sentimentoEntregador]);

  const produtosUnicos = itens.filter(
    (item, idx, arr) => arr.findIndex((i) => i.produto.id === item.produto.id) === idx,
  );

  const tudo_preenchido =
    notaLoja > 0 &&
    notaEntregador > 0 &&
    produtosUnicos.every((item) => (notasProdutos[item.produto.id] ?? 0) > 0);

  function handleEnviar() {
    if (!tudo_preenchido) return;
    onEnviar({
      notaLoja,
      comentarioLoja: comentarioLoja.trim() || undefined,
      tagsLoja,
      notaEntregador,
      comentarioEntregador: comentarioEntregador.trim() || undefined,
      tagsEntregador,
      avaliacoesProdutos: produtosUnicos.map((item) => ({
        produtoId: item.produto.id,
        nota: notasProdutos[item.produto.id],
        comentario: (comentariosProdutos[item.produto.id] ?? '').trim() || undefined,
      })),
    });
  }

  function handleFechar() {
    setNotaLoja(0);
    setComentarioLoja('');
    setTagsLoja([]);
    setNotaEntregador(0);
    setComentarioEntregador('');
    setTagsEntregador([]);
    setNotasProdutos({});
    setComentariosProdutos({});
    onFechar();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: surf }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: borderL }]}>
              <Text style={[styles.titulo, { color: text }]}>Como foi sua experiência?</Text>
              <TouchableOpacity onPress={handleFechar} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── PRODUTOS ── */}
              <Text style={[styles.secaoTitulo, { color: textSec as string }]}>PRODUTOS</Text>

              {produtosUnicos.map((item, idx) => {
                const isLast = idx === produtosUnicos.length - 1;
                return (
                  <View key={item.produto.id}>
                    <StarRow
                      label={item.produto.nome}
                      sublabel={`${item.quantidade}x`}
                      iconName="bag-handle-outline"
                      nota={notasProdutos[item.produto.id] ?? 0}
                      onChange={(n) =>
                        setNotasProdutos((prev) => ({ ...prev, [item.produto.id]: n }))
                      }
                      noBorder
                    />
                    <ComentarioInput
                      placeholder="Comentar este produto (opcional)"
                      value={comentariosProdutos[item.produto.id] ?? ''}
                      onChange={(v) =>
                        setComentariosProdutos((prev) => ({ ...prev, [item.produto.id]: v }))
                      }
                    />
                    {!isLast && <View style={[styles.divider, { backgroundColor: borderL }]} />}
                  </View>
                );
              })}

              {/* ── ENTREGA ── */}
              <Text style={[styles.secaoTitulo, { color: textSec as string, marginTop: 20 }]}>
                ENTREGA
              </Text>

              <StarRow
                label="Entregador"
                sublabel={entregadorNome ?? undefined}
                iconName="bicycle-outline"
                nota={notaEntregador}
                onChange={setNotaEntregador}
                noBorder
              />
              <TagsSelector
                nota={notaEntregador}
                catalogo={TAGS_AVALIACAO_ENTREGADOR}
                selected={tagsEntregador}
                onToggle={(id) =>
                  setTagsEntregador((prev) =>
                    prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
                  )
                }
              />
              <ComentarioInput
                placeholder="Comentar a entrega (opcional)"
                value={comentarioEntregador}
                onChange={setComentarioEntregador}
              />

              {/* ── LOJA ── */}
              <Text style={[styles.secaoTitulo, { color: textSec as string, marginTop: 20 }]}>
                LOJA
              </Text>

              <StarRow
                label={lojaNome}
                sublabel="Agilidade, embalagem e atendimento"
                iconName="storefront-outline"
                nota={notaLoja}
                onChange={setNotaLoja}
                noBorder
              />
              <TagsSelector
                nota={notaLoja}
                catalogo={TAGS_AVALIACAO_LOJA}
                selected={tagsLoja}
                onToggle={(id) =>
                  setTagsLoja((prev) =>
                    prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
                  )
                }
              />
              <ComentarioInput
                placeholder="Comentar a loja (opcional)"
                value={comentarioLoja}
                onChange={setComentarioLoja}
              />
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: borderL }]}>
              <TouchableOpacity
                style={[
                  styles.btnEnviar,
                  { backgroundColor: tudo_preenchido ? colors.orange : '#E5E7EB' },
                ]}
                onPress={handleEnviar}
                disabled={!tudo_preenchido || enviando}
                activeOpacity={0.85}
              >
                {enviando ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text
                    style={[styles.btnEnviarTxt, { color: tudo_preenchido ? '#fff' : '#9CA3AF' }]}
                  >
                    Enviar avaliação
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 0,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  titulo: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: 20,
    paddingBottom: 12,
  },
  secaoTitulo: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 8,
  },
  starRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  starIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  starLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  starSublabel: {
    fontSize: 11,
    marginTop: 1,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  comentarioWrap: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 60,
  },
  comentario: {
    fontSize: 12,
    lineHeight: 18,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  tagsSection: {
    marginTop: 10,
    marginHorizontal: 4,
    gap: 8,
  },
  tagsHint: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1.5,
  },
  tagChipTxt: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  btnEnviar: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnEnviarTxt: {
    fontSize: 15,
    fontWeight: '700',
  },
});
