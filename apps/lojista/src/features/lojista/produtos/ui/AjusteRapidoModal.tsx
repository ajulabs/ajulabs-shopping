import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Produto } from '@ajulabs/types';
import { C, TIPOS } from '../lib/ajusteTipos';
import { useAjusteEstoque } from '../model/useAjusteEstoque';
import { TipoAjusteSelector } from './components/TipoAjusteSelector';
import { QtyInput } from './components/QtyInput';
import { PreviewEstoque } from './components/PreviewEstoque';
import { MinimoEstoque } from './components/MinimoEstoque';

interface Props {
  visible: boolean;
  produto: Produto;
  lojaId: string;
  token: string;
  onClose: () => void;
  onSaved: (produto: Produto) => void;
}

export function AjusteRapidoModal({ visible, produto, lojaId, token, onClose, onSaved }: Props) {
  const {
    variacoes,
    temVariacoes,
    variacaoSel,
    eixoVariacao,
    tipo,
    setTipo,
    qty,
    setQty,
    motivo,
    setMotivo,
    minimo,
    setMinimo,
    setVariacaoId,
    saving,
    done,
    toastAnim,
    isInvent,
    qtyNum,
    qtyValida,
    atual,
    estoqueInsuficiente,
    novoEstoque,
    delta,
    salvar,
  } = useAjusteEstoque({ produto, lojaId, token, onSaved });

  const cfg = TIPOS.find((t) => t.tipo === tipo)!;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />

          {/* Header */}
          <View style={s.head}>
            <View style={{ flex: 1 }}>
              <Text style={s.headTitle}>Ajuste de estoque</Text>
              <Text style={s.headSub} numberOfLines={1}>
                {produto.nome}
              </Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={16} color={C.sub} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Variação (apenas se o produto tiver variações) */}
            {temVariacoes && (
              <View style={s.varWrap}>
                <Text style={s.fieldLabel}>{eixoVariacao.label} a ajustar</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.varRow}
                  keyboardShouldPersistTaps="handled"
                >
                  {variacoes.map((v) => {
                    const active = variacaoSel?.id === v.id;
                    const nomeExibido = eixoVariacao.abrev
                      ? `${eixoVariacao.abrev} ${v.nome}`
                      : v.nome;
                    return (
                      <TouchableOpacity
                        key={v.id}
                        style={[
                          s.varChip,
                          active && { borderColor: cfg.color, backgroundColor: cfg.color + '12' },
                        ]}
                        onPress={() => setVariacaoId(v.id)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[s.varChipNome, active && { color: cfg.color }]}
                          numberOfLines={1}
                        >
                          {nomeExibido}
                        </Text>
                        <View style={[s.varChipBadge, active && { backgroundColor: cfg.color }]}>
                          <Text style={[s.varChipQty, active && { color: '#fff' }]}>
                            {v.estoque}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Tipo */}
            <TipoAjusteSelector tipo={tipo} onSelect={setTipo} />

            {/* Dica contextual do tipo selecionado */}
            <View
              style={[
                s.hintBox,
                { borderColor: cfg.color + '30', backgroundColor: cfg.color + '0C' },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={15}
                color={cfg.color}
                style={{ marginTop: 1 }}
              />
              <Text style={[s.hintText, { color: cfg.color }]}>{cfg.hint}</Text>
            </View>

            {/* Quantidade */}
            <QtyInput
              qty={qty}
              qtyNum={qtyNum}
              isInvent={isInvent}
              color={cfg.color}
              onChange={setQty}
            />

            {/* Preview */}
            {novoEstoque !== null && (
              <PreviewEstoque
                atual={atual}
                novoEstoque={novoEstoque}
                delta={delta}
                color={cfg.color}
              />
            )}

            {/* Aviso de estoque insuficiente para saída */}
            {estoqueInsuficiente && (
              <View style={s.erroBox}>
                <Ionicons name="warning" size={15} color="#DC2626" />
                <Text style={s.erroText}>
                  Estoque insuficiente. Disponível: {atual} un. Reduza a quantidade ou use
                  Inventário para zerar.
                </Text>
              </View>
            )}

            {/* Estoque mínimo */}
            <MinimoEstoque minimo={minimo} onChange={setMinimo} />

            {/* Motivo */}
            <View style={s.motivoWrap}>
              <Text style={s.fieldLabel}>
                Motivo <Text style={s.optional}>(opcional)</Text>
              </Text>
              <TextInput
                style={s.motivoInput}
                placeholder="Ex: reposição, quebra, inventário..."
                placeholderTextColor={C.mute}
                value={motivo}
                onChangeText={setMotivo}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Confirmar */}
            <TouchableOpacity
              style={[
                s.saveBtn,
                { backgroundColor: cfg.color },
                (!qtyValida || saving || estoqueInsuficiente) && s.saveBtnOff,
              ]}
              onPress={salvar}
              disabled={!qtyValida || saving || estoqueInsuficiente}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={s.saveBtnText}>Confirmar ajuste</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Confirmação de sucesso — card flutuante que aparece e some */}
          {done && (
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                s.toastWrap,
                {
                  opacity: toastAnim,
                  backgroundColor: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['rgba(15,23,42,0)', 'rgba(15,23,42,0.15)'],
                  }),
                },
              ]}
            >
              <Animated.View
                style={[
                  s.toastCard,
                  {
                    transform: [
                      {
                        scale: toastAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.85, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={44} color="#10B981" />
                <Text style={s.toastTitle}>Estoque atualizado</Text>
                <Text style={s.toastResumo}>{done.resumo}</Text>
              </Animated.View>
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 44,
    maxHeight: '94%',
    borderTopWidth: 1,
    borderColor: C.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 22,
  },

  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  headTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  headSub: { fontSize: 13, color: C.sub, marginTop: 3 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Variação */
  varWrap: { marginBottom: 18 },
  varRow: { gap: 8, paddingVertical: 2 },
  varChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  varChipNome: { fontSize: 13, fontWeight: '700', color: C.sub, maxWidth: 140 },
  varChipBadge: {
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: C.border,
    alignItems: 'center',
  },
  varChipQty: { fontSize: 12, fontWeight: '800', color: C.sub },

  /* Dica contextual */
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  hintText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '500' },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  /* Aviso estoque insuficiente */
  erroBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  erroText: { flex: 1, fontSize: 13, color: '#DC2626', fontWeight: '500', lineHeight: 18 },

  /* Motivo */
  motivoWrap: { marginBottom: 20 },
  optional: { fontWeight: '500', color: C.mute },
  motivoInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
    backgroundColor: C.bg,
    height: 70,
    textAlignVertical: 'top',
  },

  /* Confirmar */
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 18,
  },
  saveBtnOff: { opacity: 0.3 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  /* Sucesso — card flutuante */
  toastWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  toastCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 6,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  toastTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginTop: 2 },
  toastResumo: { fontSize: 15, fontWeight: '700', color: '#10B981', textAlign: 'center' },
});
