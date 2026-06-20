import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../theme';
import type { CategoriaItem } from '../../lib/horarios';

export function CategoriaPicker({
  value,
  onChange,
  dark,
  categorias,
}: {
  value: string;
  onChange: (v: string) => void;
  dark: boolean;
  categorias: CategoriaItem[];
}) {
  const [open, setOpen] = useState(false);
  const textColor = dark ? colors.n0 : colors.navy;
  const subColor = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const inputBg = dark ? 'rgba(255,255,255,0.05)' : colors.n50;
  const border = dark ? 'rgba(255,255,255,0.08)' : colors.n200;
  const selected = categorias.find((c) => c.label === value);

  return (
    <>
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: subColor }]}>CATEGORIA</Text>
        <TouchableOpacity
          style={[
            styles.fieldInput,
            styles.catSelector,
            { backgroundColor: inputBg, borderColor: border },
          ]}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          {selected ? (
            <>
              <Ionicons
                name={selected.icone as any}
                size={18}
                color={textColor}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.catSelectorText, { color: textColor }]}>{selected.label}</Text>
            </>
          ) : (
            <Text style={[styles.catSelectorText, { color: subColor }]}>
              Selecione uma categoria
            </Text>
          )}
          <Ionicons name="chevron-down" size={16} color={subColor} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.catModal}>
          <View style={styles.catModalHeader}>
            <Text style={styles.catModalTitle}>Categoria da loja</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Ionicons name="close" size={22} color={colors.navy} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={categorias}
            keyExtractor={(item) => item.label}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.catItem, item.label === value && styles.catItemSelected]}
                onPress={() => {
                  onChange(item.label);
                  setOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icone as any}
                  size={20}
                  color={item.label === value ? colors.orange : colors.n600}
                  style={styles.catItemIcone}
                />
                <Text
                  style={[
                    styles.catItemLabel,
                    item.label === value && { color: colors.orange, fontWeight: '700' },
                  ]}
                >
                  {item.label}
                </Text>
                {item.label === value && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.orange} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: { gap: 5 },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  catSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    paddingHorizontal: 12,
  },
  catSelectorText: { fontSize: 14, flex: 1 },
  catModal: { flex: 1, backgroundColor: '#fff' },
  catModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.n200,
  },
  catModalTitle: { fontSize: 17, fontWeight: '700', color: colors.navy },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  catItemSelected: { backgroundColor: 'rgba(242,118,15,0.07)' },
  catItemIcone: { width: 28, textAlign: 'center' },
  catItemLabel: { flex: 1, fontSize: 15, color: colors.navy },
});
