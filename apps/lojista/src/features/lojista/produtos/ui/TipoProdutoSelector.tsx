import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { TipoProdutoValue, getCatNome, getSubcatNome } from '../model/tipoProdutos';
import { useTipoProdutoState } from '../model/useTipoProdutoState';
import { CategoriaGrid } from './components/CategoriaGrid';
import { CustomModeCard } from './components/CustomModeCard';
import { useTheme } from '../../../../shared/hooks';

interface Props {
  value: TipoProdutoValue | null;
  onChange: (v: TipoProdutoValue | null) => void;
  missingSpecs?: string[];
  onSpecLayout?: (positions: Record<string, number>) => void;
}

export function TipoProdutoSelector({ value, onChange, missingSpecs = [], onSpecLayout }: Props) {
  const {
    novaVariacao,
    setNovaVariacao,
    customInputs,
    setCustomInputs,
    specsSectionY,
    specGroupYs,
    reportPositions,
    cat,
    subcat,
    selectCat,
    selectSubcat,
    toggleSpec,
    addCustomSpec,
    setCustomTipo,
    addVariacaoCustom,
    removeVariacaoCustom,
    customTipo,
    customVars,
    isCustom,
    hasSelection,
  } = useTipoProdutoState({ value, onChange, onSpecLayout });
  const theme = useTheme();

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
              {!isCustom && value!.subcatId
                ? ` · ${getSubcatNome(value!.catId, value!.subcatId)}`
                : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => onChange(null)} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color={theme.textMut} />
          </TouchableOpacity>
        </View>
      )}

      {/* Grid de categorias */}
      <CategoriaGrid selectedCatId={value?.catId} onSelect={selectCat} />

      {/* Subcategorias — categorias normais */}
      {cat && !isCustom && (
        <View style={styles.subcatSection}>
          <Text style={[styles.sectionLabel, { color: theme.textMut }]}>Subcategoria</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subcatRow}
          >
            {cat.subcats.map((s) => {
              const selected = value?.subcatId === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.subcatChip,
                    { backgroundColor: theme.surf, borderColor: theme.border },
                    selected && styles.subcatChipSelected,
                  ]}
                  onPress={() => selectSubcat(s.id)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.subcatText,
                      { color: theme.textSec },
                      selected && styles.subcatTextSelected,
                    ]}
                  >
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
        <CustomModeCard
          customTipo={customTipo}
          customVars={customVars}
          novaVariacao={novaVariacao}
          onChangeTipo={setCustomTipo}
          onChangeNovaVariacao={setNovaVariacao}
          onAddVariacao={addVariacaoCustom}
          onRemoveVariacao={removeVariacaoCustom}
        />
      )}

      {/* Especificações — categorias normais */}
      {subcat && subcat.specs.length > 0 && (
        <View
          style={styles.specsSection}
          onLayout={(e) => {
            specsSectionY.current = e.nativeEvent.layout.y;
            reportPositions();
          }}
        >
          {subcat.specs.map((spec) => {
            const tipoSelecionado = value?.specs['tipo']?.[0];
            if (
              spec.hideForTipos &&
              tipoSelecionado &&
              spec.hideForTipos.includes(tipoSelecionado)
            ) {
              return null;
            }
            const selected = value?.specs[spec.id] ?? [];
            return (
              <View
                key={spec.id}
                style={styles.specGroup}
                onLayout={(e) => {
                  specGroupYs.current[spec.id] = e.nativeEvent.layout.y;
                  reportPositions();
                }}
              >
                <View style={styles.specHeaderRow}>
                  <Text
                    style={[
                      styles.sectionLabel,
                      { color: theme.textMut },
                      missingSpecs.includes(spec.id) && styles.sectionLabelError,
                    ]}
                  >
                    {spec.label}
                    {missingSpecs.includes(spec.id) ? ' *' : ''}
                  </Text>
                  <Text style={[styles.specHint, { color: theme.textMut }]}>
                    {spec.multiplo ? 'Selecione um ou mais' : 'Escolha um'}
                  </Text>
                </View>
                <View style={styles.chipsWrap}>
                  {spec.opcoes.map((opt) => {
                    const isSelected = selected.includes(opt);
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.chip,
                          { backgroundColor: theme.surf2, borderColor: theme.border },
                          isSelected && styles.chipSelected,
                        ]}
                        onPress={() => toggleSpec(spec.id, opt)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: theme.text },
                            isSelected && styles.chipTextSelected,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {selected
                    .filter((v) => !spec.opcoes.includes(v))
                    .map((v) => (
                      <TouchableOpacity
                        key={v}
                        style={[styles.chip, styles.chipSelected, styles.chipCustom]}
                        onPress={() => toggleSpec(spec.id, v)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.chipText, styles.chipTextSelected]}>{v}</Text>
                        <Ionicons name="close" size={11} color="#fff" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    ))}
                  <View style={styles.chipInputWrap}>
                    <TextInput
                      style={[
                        styles.chipInput,
                        {
                          width: Math.max(68, (customInputs[spec.id]?.length ?? 0) * 9 + 28),
                          backgroundColor: theme.surf,
                          borderColor: theme.border,
                          color: theme.text,
                        },
                      ]}
                      value={customInputs[spec.id] ?? ''}
                      onChangeText={(v) => setCustomInputs((prev) => ({ ...prev, [spec.id]: v }))}
                      onSubmitEditing={() => addCustomSpec(spec.id)}
                      onBlur={() => addCustomSpec(spec.id)}
                      placeholder="+ outro"
                      placeholderTextColor={theme.textMut}
                      returnKeyType="done"
                      blurOnSubmit={false}
                    />
                    {!!customInputs[spec.id]?.trim() && (
                      <TouchableOpacity
                        style={styles.chipInputConfirm}
                        onPress={() => addCustomSpec(spec.id)}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="checkmark" size={13} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {subcat && subcat.specs.length === 0 && (
        <View style={styles.noSpecsHint}>
          <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
          <Text style={styles.noSpecsText}>
            Nenhuma especificação necessária para esta categoria
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },

  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.orange100,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  summaryText: { fontSize: 13, fontWeight: '600', color: colors.orange600 },

  subcatSection: { gap: 6 },
  subcatRow: { gap: 8, paddingVertical: 2 },
  subcatChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n0,
  },
  subcatChipSelected: { borderColor: colors.orange, backgroundColor: '#FFF3E8' },
  subcatText: { fontSize: 13, fontWeight: '600', color: colors.n600 },
  subcatTextSelected: { color: colors.orange600 },

  chipInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipInput: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.n200,
    borderStyle: 'dashed',
    backgroundColor: colors.n0,
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
  },
  chipInputConfirm: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },

  specsSection: { gap: 12 },
  specGroup: { gap: 6 },
  specHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  specHint: { fontSize: 11, color: colors.n500 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n50,
  },
  chipSelected: { borderColor: colors.navy, backgroundColor: colors.navy },
  chipCustom: {
    borderColor: colors.orange600,
    backgroundColor: colors.orange600,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.navy },
  chipTextSelected: { color: '#fff' },

  noSpecsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
  },
  noSpecsText: { fontSize: 12, color: '#15803D', flex: 1 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLabelError: { color: '#DC2626' },
});
