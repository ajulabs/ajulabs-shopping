import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemCarrinho } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../hooks';

interface Props {
  item: ItemCarrinho;
  onAumentar: (produtoId: string, variacaoId?: string) => void;
  onDiminuir: (produtoId: string, variacaoId?: string) => void;
}

function Thumb({ uri, alt, isDark }: { uri: string; alt: string; isDark: boolean }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.orange100,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.orange600 }}>
          {alt.charAt(0)}
        </Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={styles.thumb} onError={() => setError(true)} />;
}

export function CartItemRow({ item, onAumentar, onDiminuir }: Props) {
  const { isDark, text, textSec, surf } = useTheme();
  const border = isDark ? 'rgba(255,255,255,0.12)' : colors.n200;
  const qtdBg = surf;

  return (
    <View style={styles.row}>
      <Thumb uri={item.produto.imagem} alt={item.produto.nome} isDark={isDark} />
      <View style={styles.info}>
        <Text style={[styles.nome, { color: text }]} numberOfLines={2}>
          {item.produto.nome}
        </Text>
        {item.variacaoNome ? (
          <Text style={[styles.padrao, { color: textSec as string }]}>{item.variacaoNome}</Text>
        ) : null}
        <Text style={[styles.preco, { color: text }]}>
          R$ {item.produto.preco.toFixed(2).replace('.', ',')}
        </Text>
      </View>

      <View style={[styles.qtdBox, { borderColor: border, backgroundColor: qtdBg }]}>
        <TouchableOpacity
          onPress={() => onDiminuir(item.produto.id, item.variacaoId)}
          style={styles.btnMenos}
          activeOpacity={0.7}
        >
          <Ionicons name="remove-outline" size={14} color={textSec as string} />
        </TouchableOpacity>
        <Text style={[styles.qtd, { color: text }]}>{item.quantidade}</Text>
        <TouchableOpacity
          onPress={() => onAumentar(item.produto.id, item.variacaoId)}
          style={styles.btnMais}
          activeOpacity={0.85}
        >
          <Text style={styles.btnMaisTxt}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  thumb: { width: 64, height: 64, borderRadius: 10 },
  info: { flex: 1 },
  nome: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
  padrao: { fontSize: 11, marginTop: 1 },
  preco: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  qtdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 8,
  },
  btnMenos: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  qtd: { fontSize: 13, fontWeight: '600', minWidth: 12, textAlign: 'center' },
  btnMais: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnMaisTxt: { color: colors.n0, fontSize: 14, fontWeight: '700', lineHeight: 16 },
});
