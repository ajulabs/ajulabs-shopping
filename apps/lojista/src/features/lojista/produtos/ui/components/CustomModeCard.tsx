import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../../../theme';
import { useTheme } from '../../../../../shared/hooks';

export function CustomModeCard({
  customTipo,
  customVars,
  novaVariacao,
  onChangeTipo,
  onChangeNovaVariacao,
  onAddVariacao,
  onRemoveVariacao,
}: {
  customTipo: string;
  customVars: string[];
  novaVariacao: string;
  onChangeTipo: (text: string) => void;
  onChangeNovaVariacao: (text: string) => void;
  onAddVariacao: () => void;
  onRemoveVariacao: (v: string) => void;
}) {
  const theme = useTheme();
  const inp = { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text };
  return (
    <View style={styles.customSection}>
      <View
        style={[styles.customCard, { backgroundColor: theme.surf2, borderColor: theme.border }]}
      >
        <View style={styles.customTitleRow}>
          <MaterialCommunityIcons name="pencil-outline" size={15} color={colors.orange} />
          <Text style={[styles.customTitle, { color: theme.text }]}>Produto personalizado</Text>
        </View>
        <Text style={[styles.customHint, { color: theme.textSec }]}>
          Descreva o tipo de produto e adicione as variações que ele possui.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={[styles.sectionLabel, { color: theme.textMut }]}>Tipo de produto</Text>
          <TextInput
            style={[styles.customInput, inp]}
            value={customTipo}
            onChangeText={onChangeTipo}
            placeholder="Ex: Artesanato, Plantas, Serviços, Bijuterias…"
            placeholderTextColor={theme.textMut}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.sectionLabel, { color: theme.textMut }]}>
            Variações <Text style={styles.optionalHint}>(opcional)</Text>
          </Text>
          {customVars.length > 0 && (
            <View style={styles.chipsWrap}>
              {customVars.map((v) => (
                <TouchableOpacity
                  key={v}
                  style={styles.customVarChip}
                  onPress={() => onRemoveVariacao(v)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.customVarText}>{v}</Text>
                  <Ionicons
                    name="close"
                    size={11}
                    color={colors.orange600}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.addVarRow}>
            <TextInput
              style={[styles.addVarInput, inp]}
              value={novaVariacao}
              onChangeText={onChangeNovaVariacao}
              onSubmitEditing={onAddVariacao}
              placeholder="Ex: Azul, G, 500ml…"
              placeholderTextColor={theme.textMut}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addVarBtn, !novaVariacao.trim() && { opacity: 0.4 }]}
              onPress={onAddVariacao}
              activeOpacity={0.75}
              disabled={!novaVariacao.trim()}
            >
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  customSection: { gap: 0 },
  customCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n50,
    padding: 14,
    gap: 12,
  },
  customTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  customTitle: { fontSize: 13, fontWeight: '700', color: colors.navy },
  customHint: { fontSize: 12, color: colors.n600, lineHeight: 17, marginTop: -4 },
  fieldGroup: { gap: 6 },
  optionalHint: { fontSize: 10, fontWeight: '400', color: colors.n500, textTransform: 'none' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customInput: {
    backgroundColor: colors.n0,
    borderWidth: 1.5,
    borderColor: colors.n200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.navy,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  addVarRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addVarInput: {
    flex: 1,
    backgroundColor: colors.n0,
    borderWidth: 1.5,
    borderColor: colors.n200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.navy,
  },
  addVarBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customVarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.orange100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
  },
  customVarText: { fontSize: 12, fontWeight: '600', color: colors.orange600 },
});
