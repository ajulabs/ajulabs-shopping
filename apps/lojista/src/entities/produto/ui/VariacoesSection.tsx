import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme';
import { useTheme } from '../../../shared/hooks';
import { VariacaoEstoque } from '../model/variacoes';

export function VariacoesSection({
  variacoes,
  precoBase,
  onChange,
  estoqueReadOnly = false,
}: {
  variacoes: VariacaoEstoque[];
  precoBase: string;
  onChange: (v: VariacaoEstoque[]) => void;
  /** No editar produto o estoque é gerenciado em "Ajustar estoque" (somente leitura aqui). */
  estoqueReadOnly?: boolean;
}) {
  const theme = useTheme();
  const dark = theme.isDark;
  // Card "laranja": no dark troca o creme claro por superfície escura + acentos laranja.
  const containerBg = dark ? theme.surf : '#FFFAF5';
  const containerBorder = dark ? 'rgba(242,118,15,0.35)' : '#FFD4A8';
  const headerBg = dark ? 'rgba(242,118,15,0.15)' : colors.orange100;
  const accentTxt = dark ? '#FDBA74' : colors.orange600;
  const inp = { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text };

  const totalEstoque = variacoes.reduce((s, v) => s + (v.estoque || 0), 0);

  const updateEstoque = (nome: string, raw: string) => {
    const val = parseInt(raw.replace(/[^0-9]/g, ''), 10);
    onChange(variacoes.map((v) => (v.nome === nome ? { ...v, estoque: isNaN(val) ? 0 : val } : v)));
  };

  const updatePreco = (nome: string, raw: string) => {
    const normalized = raw.replace(',', '.');
    const val = parseFloat(normalized);
    onChange(
      variacoes.map((v) =>
        v.nome === nome ? { ...v, preco: raw === '' ? undefined : isNaN(val) ? v.preco : val } : v,
      ),
    );
  };

  return (
    <View
      style={[varStyles.container, { backgroundColor: containerBg, borderColor: containerBorder }]}
    >
      <View
        style={[
          varStyles.headerRow,
          { backgroundColor: headerBg, borderBottomColor: containerBorder },
        ]}
      >
        <View style={varStyles.headerLeft}>
          <Ionicons name="grid-outline" size={14} color={accentTxt} />
          <Text style={[varStyles.title, { color: accentTxt }]}>Variações do produto</Text>
        </View>
        <View style={varStyles.totalBadge}>
          <Text style={varStyles.totalText}>Total: {totalEstoque} un.</Text>
        </View>
      </View>

      <View style={[varStyles.tableHeader, { borderBottomColor: theme.border }]}>
        <Text style={[varStyles.colLabel, { color: theme.textMut, flex: 1 }]}>Combinação</Text>
        <Text
          style={[varStyles.colLabel, { color: theme.textMut, width: 80, textAlign: 'center' }]}
        >
          Preço (R$)
        </Text>
        <Text style={[varStyles.colLabel, { color: theme.textMut, width: 72, textAlign: 'right' }]}>
          Estoque
        </Text>
      </View>

      {variacoes.map((v, idx) => (
        <View
          key={v.nome}
          style={[
            varStyles.row,
            idx % 2 === 0 && {
              backgroundColor: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
            },
          ]}
        >
          <Text style={[varStyles.nomeTxt, { color: theme.text }]} numberOfLines={1}>
            {v.nome}
          </Text>
          <TextInput
            style={[varStyles.precoInput, inp]}
            value={v.preco != null ? String(v.preco).replace('.', ',') : ''}
            onChangeText={(raw) => updatePreco(v.nome, raw)}
            placeholder={precoBase || '0,00'}
            placeholderTextColor={theme.textMut}
            keyboardType="decimal-pad"
            maxLength={8}
          />
          {estoqueReadOnly ? (
            <View style={[varStyles.estoqueReadonly, { backgroundColor: theme.surf2 }]}>
              <Text style={[varStyles.estoqueReadonlyTxt, { color: theme.textSec }]}>
                {v.estoque}
              </Text>
            </View>
          ) : (
            <TextInput
              style={[varStyles.estoqueInput, inp]}
              value={v.estoque === 0 ? '' : String(v.estoque)}
              onChangeText={(raw) => updateEstoque(v.nome, raw)}
              placeholder="0"
              placeholderTextColor={theme.textMut}
              keyboardType="number-pad"
              maxLength={5}
            />
          )}
        </View>
      ))}

      <Text style={[varStyles.hint, { color: theme.textMut }]}>
        {estoqueReadOnly
          ? 'O estoque de cada variação é gerenciado em "Ajustar estoque".'
          : 'Preço vazio usa o preço base. Estoque 0 = sem estoque para esta variação.'}
      </Text>
    </View>
  );
}

const varStyles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFD4A8',
    backgroundColor: '#FFFAF5',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.orange100,
    borderBottomWidth: 1,
    borderBottomColor: '#FFD4A8',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 13, fontWeight: '700', color: colors.orange600 },
  totalBadge: {
    backgroundColor: colors.orange600,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  totalText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  colLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.n500,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  rowAlt: { backgroundColor: 'rgba(0,0,0,0.015)' },
  nomeTxt: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.navy },
  precoInput: {
    width: 80,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: '#fff',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
  },
  estoqueInput: {
    width: 72,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
  },
  estoqueReadonly: {
    width: 72,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.n100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estoqueReadonlyTxt: { fontSize: 14, fontWeight: '700', color: colors.n600 },
  hint: {
    fontSize: 11,
    color: colors.n500,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
  },
});
