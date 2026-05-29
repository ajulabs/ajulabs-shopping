import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EstoqueService } from '@ajulabs/api-client';
import { Produto } from '@ajulabs/types';

const C = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  sub: '#64748B',
  mute: '#94A3B8',
  orange: '#F2760F',
};

type TipoAjuste = 'entrada_manual' | 'saida_manual' | 'ajuste_inventario' | 'devolucao';

const TIPOS: {
  tipo: TipoAjuste;
  label: string;
  desc: string;
  icon: string;
  color: string;
}[] = [
  {
    tipo: 'entrada_manual',
    label: 'Entrada',
    desc: 'Adicionar unidades',
    icon: 'arrow-down-circle',
    color: '#10B981',
  },
  {
    tipo: 'saida_manual',
    label: 'Saída',
    desc: 'Remover unidades',
    icon: 'arrow-up-circle',
    color: '#F43F5E',
  },
  {
    tipo: 'ajuste_inventario',
    label: 'Inventário',
    desc: 'Definir total exato',
    icon: 'calculator',
    color: '#A78BFA',
  },
  {
    tipo: 'devolucao',
    label: 'Devolução',
    desc: 'Retorno de produto',
    icon: 'return-up-back',
    color: '#60A5FA',
  },
];

interface Props {
  visible: boolean;
  produto: Produto;
  lojaId: string;
  token: string;
  onClose: () => void;
  onSaved: (produto: Produto) => void;
}

export function AjusteRapidoModal({ visible, produto, lojaId, token, onClose, onSaved }: Props) {
  const [tipo, setTipo] = useState<TipoAjuste>('entrada_manual');
  const [qty, setQty] = useState('');
  const [motivo, setMotivo] = useState('');
  const [minimo, setMinimo] = useState(String(produto.estoqueMinimo ?? 0));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMinimo(String(produto.estoqueMinimo ?? 0));
  }, [produto.id]);

  const cfg = TIPOS.find((t) => t.tipo === tipo)!;
  const isInvent = tipo === 'ajuste_inventario';
  const qtyNum = parseInt(qty, 10);
  const qtyValida = !isNaN(qtyNum) && qtyNum > 0;
  const atual = produto.estoque ?? 0;
  const novoEstoque = !qtyValida
    ? null
    : isInvent
      ? qtyNum
      : tipo === 'saida_manual'
        ? Math.max(0, atual - qtyNum)
        : atual + qtyNum;
  const delta = novoEstoque != null ? novoEstoque - atual : null;

  async function salvar() {
    if (!qtyValida) {
      const m = 'Informe uma quantidade válida.';
      Platform.OS === 'web' ? alert(m) : Alert.alert('Atenção', m);
      return;
    }
    setSaving(true);
    try {
      const minimoNum = parseInt(minimo, 10);
      const minimoValido = !isNaN(minimoNum) && minimoNum >= 0;
      const minimoChanged = minimoValido && minimoNum !== (produto.estoqueMinimo ?? 0);

      const [atualizado] = await Promise.all([
        EstoqueService.registrarMovimentacao(token, {
          produtoId: produto.id,
          lojaId,
          tipo,
          quantidade: qtyNum,
          motivo: motivo.trim() || undefined,
        }),
        minimoChanged
          ? EstoqueService.setEstoqueMinimo(produto.id, minimoNum, token)
          : Promise.resolve(),
      ]);
      setQty('');
      setMotivo('');
      onSaved(atualizado);
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Erro ao registrar';
      Platform.OS === 'web' ? alert(m) : Alert.alert('Erro', m);
    } finally {
      setSaving(false);
    }
  }

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
            {/* Tipo */}
            <View style={s.tipoRow}>
              {TIPOS.map((t) => {
                const active = tipo === t.tipo;
                return (
                  <TouchableOpacity
                    key={t.tipo}
                    style={[
                      s.tipoBtn,
                      active && { borderColor: t.color, backgroundColor: t.color + '12' },
                    ]}
                    onPress={() => setTipo(t.tipo)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[s.tipoBtnIcon, { backgroundColor: active ? t.color + '20' : C.bg }]}
                    >
                      <Ionicons name={t.icon as any} size={18} color={active ? t.color : C.mute} />
                    </View>
                    <Text style={[s.tipoBtnLabel, active && { color: t.color }]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quantidade */}
            <View style={s.qtyWrap}>
              <Text style={s.fieldLabel}>
                {isInvent ? 'Total correto em estoque' : 'Quantidade'}
              </Text>
              <View style={[s.qtyRow, { borderColor: cfg.color + '40' }]}>
                <TouchableOpacity
                  style={[s.qtyBtn, { backgroundColor: cfg.color + '12' }]}
                  onPress={() => setQty((v) => String(Math.max(1, (parseInt(v, 10) || 0) - 1)))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={22} color={cfg.color} />
                </TouchableOpacity>
                <TextInput
                  style={[s.qtyInput, { color: cfg.color }]}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={C.mute}
                  value={qty}
                  onChangeText={setQty}
                  textAlign="center"
                />
                <TouchableOpacity
                  style={[s.qtyBtn, { backgroundColor: cfg.color + '12' }]}
                  onPress={() => setQty((v) => String((parseInt(v, 10) || 0) + 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={22} color={cfg.color} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Preview */}
            {novoEstoque !== null && (
              <View style={s.preview}>
                <View style={s.previewBox}>
                  <Text style={s.previewLabel}>Atual</Text>
                  <Text style={s.previewNum}>{atual}</Text>
                </View>
                <View style={[s.previewArrow, { backgroundColor: cfg.color + '15' }]}>
                  <Ionicons name="arrow-forward" size={14} color={cfg.color} />
                </View>
                <View style={[s.previewBox, { borderColor: cfg.color + '40' }]}>
                  <Text style={s.previewLabel}>Novo</Text>
                  <Text style={[s.previewNum, { color: cfg.color }]}>{novoEstoque}</Text>
                </View>
                {delta !== null && (
                  <View style={[s.deltaChip, { backgroundColor: cfg.color + '15' }]}>
                    <Text style={[s.deltaText, { color: cfg.color }]}>
                      {delta > 0 ? `+${delta}` : delta < 0 ? String(delta) : '='}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Estoque mínimo */}
            <View style={s.minimoBox}>
              <View style={s.minimoHead}>
                <Ionicons name="alert-circle-outline" size={13} color={C.mute} />
                <Text style={s.minimoTitle}>Alerta de estoque mínimo</Text>
              </View>
              <View style={s.minimoCtrl}>
                <TouchableOpacity
                  style={s.minimoBtn}
                  onPress={() => setMinimo((v) => String(Math.max(0, (parseInt(v, 10) || 0) - 1)))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={16} color={C.sub} />
                </TouchableOpacity>
                <TextInput
                  style={s.minimoInput}
                  keyboardType="number-pad"
                  value={minimo}
                  onChangeText={setMinimo}
                  placeholder="0"
                  placeholderTextColor={C.mute}
                  textAlign="center"
                />
                <TouchableOpacity
                  style={s.minimoBtn}
                  onPress={() => setMinimo((v) => String((parseInt(v, 10) || 0) + 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color={C.sub} />
                </TouchableOpacity>
                <Text style={s.minimoUnit}>un.</Text>
              </View>
              <Text style={s.minimoHint}>Alerta ativo quando estoque cair abaixo deste valor.</Text>
            </View>

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
                (!qtyValida || saving) && s.saveBtnOff,
              ]}
              onPress={salvar}
              disabled={!qtyValida || saving}
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

  /* Tipo */
  tipoRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  tipoBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  tipoBtnIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipoBtnLabel: { fontSize: 11, fontWeight: '800', color: C.sub, textAlign: 'center' },

  /* Quantidade */
  qtyWrap: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 18,
    overflow: 'hidden',
  },
  qtyBtn: { width: 58, height: 64, alignItems: 'center', justifyContent: 'center' },
  qtyInput: { flex: 1, fontSize: 40, fontWeight: '800', letterSpacing: -1.5, textAlign: 'center' },

  /* Preview */
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 18,
  },
  previewBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.bg,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewNum: { fontSize: 26, fontWeight: '800', color: C.text },
  previewArrow: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deltaChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  deltaText: { fontSize: 18, fontWeight: '800' },

  /* Mínimo */
  minimoBox: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: C.bg,
    marginBottom: 18,
  },
  minimoHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  minimoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  minimoCtrl: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  minimoBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimoInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 9,
    paddingVertical: 5,
    backgroundColor: C.card,
  },
  minimoUnit: { fontSize: 12, color: C.mute, fontWeight: '600' },
  minimoHint: { fontSize: 11, color: C.mute, lineHeight: 16 },

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
});
