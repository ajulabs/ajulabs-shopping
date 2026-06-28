import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Produto } from '@ajulabs/types';
import { colors } from '../../../../theme';
import { useTheme } from '../../../../shared/hooks';
import { VariacoesSection } from '../../../../entities/produto';
import { useEditProdutoForm } from '../model/useEditProdutoForm';
import { TipoProdutoSelector } from './TipoProdutoSelector';
import { OrangeToggle } from './components/OrangeToggle';
import { FotoGrid } from './components/FotoGrid';
import { PrecoField } from './components/PrecoField';
import { SolicitacaoPrecoModal } from './components/SolicitacaoPrecoModal';

export type { EditForm } from '../lib/types';

export function EditProdutoScreen({
  produto,
  token,
  onVoltar,
  onSalvo,
}: {
  produto: Produto;
  token: string;
  onVoltar: () => void;
  onSalvo: () => void;
}) {
  const insets = useSafeAreaInsets();
  const {
    form,
    set,
    saving,
    discardAlertVisible,
    toastAnim,
    hasChanges,
    slots,
    pickImage,
    removeSlot,
    handleSalvar,
    handleDescartar,
    handleVoltar,
    canEditPrices,
    isGerente,
    solicitacaoModal,
    setSolicitacaoModal,
    precoSolicitado,
    setPrecoSolicitado,
    justificativa,
    setJustificativa,
    enviandoSolicitacao,
    handleSubmeterSolicitacao,
  } = useEditProdutoForm({ produto, token, onVoltar, onSalvo });
  const theme = useTheme();
  const inp = { backgroundColor: theme.surf, borderColor: theme.border, color: theme.text };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surf,
            borderBottomColor: theme.border,
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.backBtn }]}
          onPress={handleVoltar}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Editar produto</Text>
          <Text
            style={[
              styles.headerSub,
              { color: theme.textMut },
              hasChanges && { color: colors.orange },
            ]}
          >
            {hasChanges ? '● Alterações não salvas' : 'Altere os dados e salve'}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.editContent}>
        <FotoGrid slots={slots} onPick={pickImage} onRemove={removeSlot} />

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: theme.textSec }]}>Nome</Text>
          <TextInput
            style={[styles.input, inp]}
            value={form.nome}
            onChangeText={(v) => set('nome', v)}
            placeholder="Nome do produto"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: theme.textSec }]}>Tipo de produto</Text>
          <TipoProdutoSelector value={form.tipoProduto} onChange={(v) => set('tipoProduto', v)} />
          {!form.tipoProduto && (
            <TextInput
              style={[styles.input, inp, { marginTop: 8 }]}
              value={form.categoria}
              onChangeText={(v) => set('categoria', v)}
              placeholder="Ou informe a categoria manualmente"
            />
          )}
          {/* Hint variações: aparece quando há tipo selecionado mas ainda sem variações geradas */}
          {form.tipoProduto && form.variacoesEstoque.length === 0 && (
            <View style={styles.varHint}>
              <Ionicons name="color-palette-outline" size={14} color={colors.orange} />
              <Text style={styles.varHintText}>
                Para adicionar variações (cor, tamanho…), selecione{' '}
                <Text style={styles.varHintBold}>2 ou mais valores</Text> nas opções acima.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: theme.textSec }]}>Descrição</Text>
          <TextInput
            style={[styles.input, inp, styles.inputMultiline]}
            value={form.descricao}
            onChangeText={(v) => set('descricao', v)}
            placeholder="Descrição do produto"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Price field: editable for admin/owner, hidden for gerente, read-only for funcionario */}
        {!isGerente && (
          <PrecoField
            preco={form.preco}
            canEditPrices={canEditPrices}
            onChangePreco={(v) => set('preco', v)}
            onSolicitar={() => setSolicitacaoModal(true)}
          />
        )}

        {form.variacoesEstoque.length > 0 && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSec }]}>Variações</Text>
            <VariacoesSection
              variacoes={form.variacoesEstoque}
              precoBase={form.preco}
              onChange={(v) => set('variacoesEstoque', v)}
              estoqueReadOnly
            />
          </View>
        )}

        <View style={styles.switchRow}>
          <View>
            <Text style={[styles.fieldLabel, { color: theme.textSec }]}>Disponível</Text>
            <Text style={styles.switchSub}>Produto aparece na vitrine</Text>
          </View>
          <OrangeToggle value={form.disponivel} onValueChange={(v) => set('disponivel', v)} />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, (saving || discardAlertVisible) && { opacity: 0.7 }]}
          onPress={handleSalvar}
          activeOpacity={0.85}
          disabled={saving || discardAlertVisible}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Salvar alterações</Text>
          )}
        </TouchableOpacity>

        {hasChanges && (
          <TouchableOpacity
            style={styles.discardBtn}
            onPress={handleDescartar}
            activeOpacity={0.75}
            disabled={saving}
          >
            <Text style={styles.discardBtnText}>Descartar alterações</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal: solicitar mudança de preço (funcionario only) */}
      <SolicitacaoPrecoModal
        visible={solicitacaoModal}
        precoSolicitado={precoSolicitado}
        justificativa={justificativa}
        enviando={enviandoSolicitacao}
        onChangePreco={setPrecoSolicitado}
        onChangeJustificativa={setJustificativa}
        onEnviar={handleSubmeterSolicitacao}
        onClose={() => setSolicitacaoModal(false)}
      />

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 60,
          left: 24,
          right: 24,
          backgroundColor: '#16a34a',
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          opacity: toastAnim,
          transform: [
            { translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) },
          ],
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        }}
      >
        <Ionicons name="checkmark-circle" size={22} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Alterações salvas!</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.n50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: colors.n0,
    borderBottomWidth: 1,
    borderBottomColor: colors.n200,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.navy, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: colors.n500, marginTop: 2 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.n100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },

  editContent: { padding: 16, gap: 14 },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  input: {
    backgroundColor: colors.n0,
    borderWidth: 1.5,
    borderColor: colors.n200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.navy,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.n0,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.n200,
  },
  switchSub: { fontSize: 12, color: colors.n600, marginTop: 2 },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  discardBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.n300,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  discardBtnText: { fontSize: 14, fontWeight: '600', color: colors.n600 },

  varHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 10,
    backgroundColor: colors.orange100,
    borderWidth: 1,
    borderColor: colors.orange + '40',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  varHintText: { flex: 1, fontSize: 12, color: colors.orange600, lineHeight: 17 },
  varHintBold: { fontWeight: '700' },
});
