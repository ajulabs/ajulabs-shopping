import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EnderecoSalvo } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';

const ENDERECOS_MOCK: EnderecoSalvo[] = [
  {
    id: 'addr-1',
    apelido: 'Casa',
    rua: 'R. Laranjeiras, 412',
    bairro: 'Atalaia, Aracaju',
    cep: '49.035-110',
    padrao: true,
  },
  {
    id: 'addr-2',
    apelido: 'Trabalho',
    rua: 'Av. Beira Mar, 1280',
    bairro: 'Atalaia, Aracaju',
    cep: '49.037-580',
    padrao: false,
  },
];

interface Props {
  enderecoId: string;
  onSelect: (id: string) => void;
}

export function StepEndereco({ enderecoId, onSelect }: Props) {
  return (
    <View>
      <Text style={styles.titulo}>Onde a gente entrega?</Text>

      {ENDERECOS_MOCK.map((addr) => {
        const selected = addr.id === enderecoId;
        return (
          <TouchableOpacity
            key={addr.id}
            style={[styles.card, selected && styles.cardSelected]}
            onPress={() => onSelect(addr.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
              <Ionicons
                name="location"
                size={18}
                color={selected ? '#fff' : colors.navy}
              />
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.apelido}>{addr.apelido}</Text>
                {addr.padrao && (
                  <View style={styles.badgePadrao}>
                    <Text style={styles.badgePadraoTxt}>Padrão</Text>
                  </View>
                )}
              </View>
              <Text style={styles.rua}>{addr.rua}</Text>
              <Text style={styles.bairro}>{addr.bairro} · {addr.cep}</Text>
            </View>

            {selected && (
              <View style={styles.check}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={styles.addBtn} activeOpacity={0.7}>
        <Ionicons name="add" size={18} color={colors.n500} />
        <Text style={styles.addTxt}>Adicionar novo endereço</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  titulo:         { fontSize: 17, fontWeight: '700', color: colors.navy, marginBottom: 12 },
  card:           { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14,
                    backgroundColor: colors.n0, borderRadius: 14, marginBottom: 10,
                    borderWidth: 1.5, borderColor: colors.n200 },
  cardSelected:   { borderColor: colors.orange },
  iconBox:        { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.n100,
                    alignItems: 'center', justifyContent: 'center' },
  iconBoxSelected:{ backgroundColor: colors.orange },
  apelido:        { fontSize: 14, fontWeight: '600', color: colors.navy },
  badgePadrao:    { backgroundColor: colors.orange100, paddingHorizontal: 8, paddingVertical: 2,
                    borderRadius: 99 },
  badgePadraoTxt: { fontSize: 10, fontWeight: '600', color: colors.orange600 },
  rua:            { fontSize: 13, color: colors.n600, marginTop: 2 },
  bairro:         { fontSize: 12, color: colors.n600 },
  check:          { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.orange,
                    alignItems: 'center', justifyContent: 'center' },
  addBtn:         { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14,
                    borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed',
                    borderColor: colors.n200 },
  addTxt:         { fontSize: 13, fontWeight: '500', color: colors.n500 },
});