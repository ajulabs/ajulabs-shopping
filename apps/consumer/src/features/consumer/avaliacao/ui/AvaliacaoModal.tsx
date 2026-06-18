import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import { ItemPedido, TAGS_AVALIACAO_LOJA, TAGS_AVALIACAO_ENTREGADOR } from '@ajulabs/types';
import { useTheme } from '../../../../shared/hooks';
import { useAvaliacaoForm, AvaliacaoPayload } from '../model/useAvaliacaoForm';
import { StarRow } from './components/StarRow';
import { ComentarioInput } from './components/ComentarioInput';
import { TagsSelector } from './components/TagsSelector';

interface Props {
  visible: boolean;
  lojaNome: string;
  entregadorNome?: string | null;
  itens: ItemPedido[];
  enviando: boolean;
  onEnviar: (dados: AvaliacaoPayload) => void;
  onFechar: () => void;
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

  const {
    notaLoja,
    setNotaLoja,
    comentarioLoja,
    setComentarioLoja,
    tagsLoja,
    toggleTagLoja,
    notaEntregador,
    setNotaEntregador,
    comentarioEntregador,
    setComentarioEntregador,
    tagsEntregador,
    toggleTagEntregador,
    notasProdutos,
    setNotaProduto,
    comentariosProdutos,
    setComentarioProduto,
    produtosUnicos,
    tudoPreenchido,
    handleEnviar,
    handleFechar,
  } = useAvaliacaoForm(itens, onEnviar, onFechar);

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
                      onChange={(n) => setNotaProduto(item.produto.id, n)}
                      noBorder
                    />
                    <ComentarioInput
                      placeholder="Comentar este produto (opcional)"
                      value={comentariosProdutos[item.produto.id] ?? ''}
                      onChange={(v) => setComentarioProduto(item.produto.id, v)}
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
                onToggle={toggleTagEntregador}
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
                onToggle={toggleTagLoja}
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
                  { backgroundColor: tudoPreenchido ? colors.orange : '#E5E7EB' },
                ]}
                onPress={handleEnviar}
                disabled={!tudoPreenchido || enviando}
                activeOpacity={0.85}
              >
                {enviando ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text
                    style={[styles.btnEnviarTxt, { color: tudoPreenchido ? '#fff' : '#9CA3AF' }]}
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', paddingBottom: 0 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  titulo: { fontSize: 17, fontWeight: '800', flex: 1 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: 20, paddingBottom: 12 },
  secaoTitulo: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  divider: { height: 1, marginVertical: 12 },
  footer: { padding: 16, borderTopWidth: 1 },
  btnEnviar: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnEnviarTxt: { fontSize: 15, fontWeight: '700' },
});
