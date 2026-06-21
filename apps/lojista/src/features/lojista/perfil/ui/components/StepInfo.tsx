import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../theme';
import type { CategoriaItem } from '../../lib/horarios';

const CATEGORIAS: CategoriaItem[] = [
  { label: 'Alimentação', icone: 'restaurant-outline' },
  { label: 'Padaria e Confeitaria', icone: 'cafe-outline' },
  { label: 'Açougue e Peixaria', icone: 'fish-outline' },
  { label: 'Hortifrúti', icone: 'leaf-outline' },
  { label: 'Bebidas', icone: 'wine-outline' },
  { label: 'Calçados', icone: 'footsteps-outline' },
  { label: 'Roupas e Acessórios', icone: 'shirt-outline' },
  { label: 'Moda Infantil', icone: 'happy-outline' },
  { label: 'Moda Praia e Esporte', icone: 'water-outline' },
  { label: 'Bijuterias e Joias', icone: 'diamond-outline' },
  { label: 'Cosméticos e Beleza', icone: 'color-palette-outline' },
  { label: 'Farmácia', icone: 'medkit-outline' },
  { label: 'Eletrônicos', icone: 'phone-portrait-outline' },
  { label: 'Móveis e Decoração', icone: 'bed-outline' },
  { label: 'Papelaria e Livraria', icone: 'book-outline' },
  { label: 'Pet Shop', icone: 'paw-outline' },
  { label: 'Esportes e Lazer', icone: 'football-outline' },
  { label: 'Serviços', icone: 'build-outline' },
  { label: 'Outros', icone: 'storefront-outline' },
];

export function StepInfo({
  categoria,
  descricao,
  onCategoria,
  onDescricao,
}: {
  categoria: string;
  descricao: string;
  onCategoria: (v: string) => void;
  onDescricao: (v: string) => void;
}) {
  const [catOpen, setCatOpen] = useState(false);
  const selected = CATEGORIAS.find((c) => c.label === categoria);

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Sobre sua loja</Text>
      <Text style={styles.stepSub}>
        Escolha a categoria e descreva o que sua loja vende para os clientes encontrarem você.
      </Text>

      <Text style={styles.fieldLabel}>CATEGORIA</Text>
      <TouchableOpacity
        style={styles.catSelector}
        onPress={() => setCatOpen(true)}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
          {selected ? (
            <>
              <Ionicons name={selected.icone as any} size={18} color={colors.navy} />
              <Text style={styles.catSelectorText}>{selected.label}</Text>
            </>
          ) : (
            <Text style={[styles.catSelectorText, { color: colors.n600 }]}>
              Selecione uma categoria
            </Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={16} color={colors.n600} />
      </TouchableOpacity>

      <Text style={[styles.fieldLabel, { marginTop: 18 }]}>DESCRIÇÃO</Text>
      <TextInput
        style={styles.textarea}
        value={descricao}
        onChangeText={onDescricao}
        placeholder="Ex: Loja de calçados com as melhores marcas nacionais e importadas. Atendemos Aracaju e região."
        placeholderTextColor={colors.n600}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Modal
        visible={catOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCatOpen(false)}
      >
        <View style={styles.catModal}>
          <View style={styles.catModalHeader}>
            <Text style={styles.catModalTitle}>Categoria da loja</Text>
            <TouchableOpacity onPress={() => setCatOpen(false)}>
              <Ionicons name="close" size={22} color={colors.navy} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={CATEGORIAS}
            keyExtractor={(item) => item.label}
            contentContainerStyle={{ paddingBottom: 32 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.catItem, item.label === categoria && styles.catItemSelected]}
                onPress={() => {
                  onCategoria(item.label);
                  setCatOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icone as any}
                  size={20}
                  color={item.label === categoria ? colors.orange : colors.n600}
                  style={styles.catItemIcone}
                />
                <Text
                  style={[
                    styles.catItemLabel,
                    item.label === categoria && { color: colors.orange, fontWeight: '700' },
                  ]}
                >
                  {item.label}
                </Text>
                {item.label === categoria && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.orange} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  stepContent: { padding: 20 },
  stepTitle: { fontSize: 18, fontWeight: '800', color: colors.navy, marginBottom: 6 },
  stepSub: { fontSize: 13, color: colors.n600, lineHeight: 19, marginBottom: 20 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  catSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n50,
    paddingHorizontal: 14,
  },
  catSelectorText: { fontSize: 14, color: colors.navy, flex: 1 },
  textarea: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n50,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: colors.navy,
    minHeight: 100,
  },
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
