import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';

export interface Categoria {
  id: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const CATEGORIAS: Categoria[] = [
  { id: 'todos',       label: 'Todos',       icon: 'store' },
  { id: 'mercado',     label: 'Mercado',     icon: 'cart-outline' },
  { id: 'moda',        label: 'Moda',        icon: 'hanger' },
  { id: 'calcados',    label: 'Calçados',    icon: 'shoe-sneaker' },
  { id: 'farmacia',    label: 'Farmácia',    icon: 'pill' },
  { id: 'eletronicos', label: 'Eletrônicos', icon: 'cellphone' },
  { id: 'pet',         label: 'Pet',         icon: 'paw-outline' },
  { id: 'esportes',    label: 'Esportes',    icon: 'soccer' },
];

interface Props {
  categoriaSelecionada: string;
  onSelecionar: (id: string) => void;
  dark?: boolean;
}

export function CategoriasBar({ categoriaSelecionada, onSelecionar, dark = false }: Props) {
  const textColor = dark ? colors.n0 : colors.navy;
  const surface   = dark ? colors.surfDark : colors.n0;
  const border    = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.scroll}
    >
      {CATEGORIAS.map(cat => {
        const active = cat.id === categoriaSelecionada;
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onSelecionar(cat.id)}
            activeOpacity={0.75}
            style={[
              s.item,
              {
                backgroundColor: active ? colors.orange : surface,
                borderColor: active ? colors.orange : border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={cat.icon}
              size={18}
              color={active ? '#fff' : textColor}
            />
            <Text style={[s.label, { color: active ? '#fff' : textColor }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingVertical: 14, gap: 8, flexDirection: 'row' },
  item:   { alignItems: 'center', flexDirection: 'row', gap: 6,
            paddingHorizontal: 14, paddingVertical: 8,
            borderRadius: 99, borderWidth: 1 },
  label:  { fontSize: 12.5, fontWeight: '600' },
});