import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import {
  TIPOS_PRODUTO,
  TipoProdutoValue,
  getCatNome,
  getSubcatNome,
} from '../model/tipoProdutos';

interface Props {
  value: TipoProdutoValue | null;
  onChange: (v: TipoProdutoValue | null) => void;
}

export function TipoProdutoSelector({ value, onChange }: Props) {
  const [novaVariacao, setNovaVariacao] = useState('');

  const cat    = value ? TIPOS_PRODUTO.find(c => c.id === value.catId)                   : null;
  const subcat = cat && value?.subcatId && !cat.isCustom
    ? cat.subcats.find(s => s.id === value.subcatId)
    : null;

  const selectCat = (catId: string) => {
    if (value?.catId === catId) { onChange(null); return; }
    const cfg = TIPOS_PRODUTO.find(c => c.id === catId);
    onChange({ catId, subcatId: cfg?.isCustom ? '__custom__' : '', specs: {} });
  };

  const selectSubcat = (subcatId: string) => {
    if (!value) return;
    onChange({ catId: value.catId, subcatId, specs: {} });
  };

  const toggleSpec = (specId: string, opt: string, multiplo: boolean) => {
    if (!value || !value.subcatId) return;
    const current = value.specs[specId] ?? [];
    const next = multiplo
      ? current.includes(opt) ? current.filter(x => x !== opt) : [...current, opt]
      : current.includes(opt) ? [] : [opt];
    onChange({ ...value, specs: { ...value.specs, [specId]: next } });
  };

  const setCustomTipo = (text: string) => {
    if (!value) return;
    onChange({ ...value, specs: { ...value.specs, _tipo: text ? [text] : [] } });
  };

  const addVariacaoCustom = () => {
    const v = novaVariacao.trim();
    if (!v || !value) return;
    const current = value.specs['variacao'] ?? [];
    if (!current.includes(v)) {
      onChange({ ...value, specs: { ...value.specs, variacao: [...current, v] } });
    }
    setNovaVariacao('');
  };

  const removeVariacaoCustom = (v: string) => {
    if (!value) return;
    const next = (value.specs['variacao'] ?? []).filter(x => x !== v);
    onChange({ ...value, specs: { ...value.specs, variacao: next } });
  };

  const customTipo   = value?.specs['_tipo']?.[0] ?? '';
  const customVars   = value?.specs['variacao'] ?? [];
  const isCustom     = !!cat?.isCustom;
  const hasSelection = !!(value?.catId && value.subcatId);

  return (
    <View style={styles.container}>

      {/* Summary quando selecionado */}
      {hasSelection && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <MaterialCommunityIcons
              name={cat?.icon as any}
              size={14}
              color={colors.orange600}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.summaryText}>
              {getCatNome(value!.catId)}
              {isCustom && customTipo ? ` · ${customTipo}` : ''}
              {!isCustom && value!.subcatId ? ` · ${getSubcatNome(value!.catId, value!.subcatId)}` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => onChange(null)} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color={colors.n300} />
          </TouchableOpacity>
        </View>
      )}

      {/* Grid de categorias */}
      <View style={styles.catGrid}>
        {TIPOS_PRODUTO.map(c => {
          const selected = value?.catId === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              style={[styles.catCard, selected && styles.catCardSelected]}
              onPress={() => selectCat(c.id)}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name={c.icon as any}
                size={28}
                color={selected ? colors.orange : colors.n500}
              />
              <Text style={[styles.catNome, selected && styles.catNomeSelected]} numberOfLines={2}>
                {c.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Subcategorias — categorias normais */}
      {cat && !isCustom && (
        <View style={styles.subcatSection}>
          <Text style={styles.sectionLabel}>Subcategoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subcatRow}>
            {cat.subcats.map(s => {
              const selected = value?.subcatId === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.subcatChip, selected && styles.subcatChipSelected]}
                  onPress={() => selectSubcat(s.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.subcatText, selected && styles.subcatTextSelected]}>
                    {s.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Modo customizado — categoria "Outros" */}
      {isCustom && (
        <View style={styles.customSection}>
          <View style={styles.customCard}>
            <View style={styles.customTitleRow}>
              <MaterialCommunityIcons name="pencil-outline" size={15} color={colors.orange} />
              <Text style={styles.customTitle}>Produto personalizado</Text>
            </View>
            <Text style={styles.customHint}>
              Descreva o tipo de produto e adicione as variações que ele possui.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.sectionLabel}>Tipo de produto</Text>
              <TextInput
                style={styles.customInput}
                value={customTipo}
                onChangeText={setCustomTipo}
                placeholder="Ex: Artesanato, Plantas, Serviços, Bijuterias…"
                placeholderTextColor={colors.n500}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.sectionLabel}>Variações <Text style={styles.optionalHint}>(opcional)</Text></Text>
              {customVars.length > 0 && (
                <View style={styles.chipsWrap}>
                  {customVars.map(v => (
                    <TouchableOpacity
                      key={v}
                      style={styles.customVarChip}
                      onPress={() => removeVariacaoCustom(v)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.customVarText}>{v}</Text>
                      <Ionicons name="close" size={11} color={colors.orange600} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.addVarRow}>
                <TextInput
                  style={styles.addVarInput}
                  value={novaVariacao}
                  onChangeText={setNovaVariacao}
                  onSubmitEditing={addVariacaoCustom}
                  placeholder="Ex: Azul, G, 500ml…"
                  placeholderTextColor={colors.n500}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[styles.addVarBtn, !novaVariacao.trim() && { opacity: 0.4 }]}
                  onPress={addVariacaoCustom}
                  activeOpacity={0.75}
                  disabled={!novaVariacao.trim()}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Especificações — categorias normais */}
      {subcat && subcat.specs.length > 0 && (
        <View style={styles.specsSection}>
          {subcat.specs.map(spec => {
            const selected = value?.specs[spec.id] ?? [];
            return (
              <View key={spec.id} style={styles.specGroup}>
                <View style={styles.specHeaderRow}>
                  <Text style={styles.sectionLabel}>{spec.label}</Text>
                  {!spec.multiplo && <Text style={styles.specHint}>Escolha um</Text>}
                </View>
                <View style={styles.chipsWrap}>
                  {spec.opcoes.map(opt => {
                    const isSelected = selected.includes(opt);
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => toggleSpec(spec.id, opt, spec.multiplo)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {subcat && subcat.specs.length === 0 && (
        <View style={styles.noSpecsHint}>
          <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
          <Text style={styles.noSpecsText}>Nenhuma especificação necessária para esta categoria</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },

  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.orange100,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  summaryText: { fontSize: 13, fontWeight: '600', color: colors.orange600 },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catCard: {
    width: '31%', borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.n200,
    backgroundColor: colors.n0,
    paddingVertical: 14, paddingHorizontal: 6,
    alignItems: 'center', gap: 8,
  },
  catCardSelected: { borderColor: colors.orange, backgroundColor: '#FFF3E8' },
  catNome: { fontSize: 11, fontWeight: '600', color: colors.n600, textAlign: 'center' },
  catNomeSelected: { color: colors.orange600 },

  subcatSection: { gap: 6 },
  subcatRow: { gap: 8, paddingVertical: 2 },
  subcatChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 99, borderWidth: 1.5, borderColor: colors.n200,
    backgroundColor: colors.n0,
  },
  subcatChipSelected: { borderColor: colors.orange, backgroundColor: '#FFF3E8' },
  subcatText: { fontSize: 13, fontWeight: '600', color: colors.n600 },
  subcatTextSelected: { color: colors.orange600 },

  // Modo customizado
  customSection: { gap: 0 },
  customCard: {
    borderRadius: 14, borderWidth: 1.5, borderColor: colors.n200,
    backgroundColor: colors.n50, padding: 14, gap: 12,
  },
  customTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  customTitle: { fontSize: 13, fontWeight: '700', color: colors.navy },
  customHint: { fontSize: 12, color: colors.n600, lineHeight: 17, marginTop: -4 },
  fieldGroup: { gap: 6 },
  optionalHint: { fontSize: 10, fontWeight: '400', color: colors.n500, textTransform: 'none' },
  customInput: {
    backgroundColor: colors.n0, borderWidth: 1.5, borderColor: colors.n200,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: colors.navy,
  },
  addVarRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addVarInput: {
    flex: 1, backgroundColor: colors.n0, borderWidth: 1.5, borderColor: colors.n200,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: colors.navy,
  },
  addVarBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: colors.orange,
    alignItems: 'center', justifyContent: 'center',
  },
  customVarChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.orange100,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 99,
  },
  customVarText: { fontSize: 12, fontWeight: '600', color: colors.orange600 },

  specsSection: { gap: 12 },
  specGroup: { gap: 6 },
  specHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  specHint: { fontSize: 11, color: colors.n500 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1.5, borderColor: colors.n200,
    backgroundColor: colors.n50,
  },
  chipSelected: { borderColor: colors.navy, backgroundColor: colors.navy },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.navy },
  chipTextSelected: { color: '#fff' },

  noSpecsHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: 10, backgroundColor: '#F0FDF4', borderRadius: 10,
  },
  noSpecsText: { fontSize: 12, color: '#15803D', flex: 1 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.n500,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
});
