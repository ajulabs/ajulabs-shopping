// src/features/consumer/cart/ui/CartItemRow.tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ItemCarrinho } from '../../../../types';
import { colors } from '../../../../theme';

interface Props {
  item: ItemCarrinho;
  onAumentar: (produtoId: string) => void;
  onDiminuir: (produtoId: string) => void;
}

function Thumb({ uri, alt }: { uri: string; alt: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <View style={[styles.thumb, { backgroundColor: colors.orange100, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.orange600 }}>{alt.charAt(0)}</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={styles.thumb} onError={() => setError(true)} />;
}

export function CartItemRow({ item, onAumentar, onDiminuir }: Props) {
  return (
    <View style={styles.row}>
      <Thumb uri={item.produto.imagem} alt={item.produto.nome} />
      <View style={styles.info}>
        <Text style={styles.nome} numberOfLines={2}>{item.produto.nome}</Text>
        <Text style={styles.padrao}>Padrão</Text>
        <Text style={styles.preco}>
          R$ {item.produto.preco.toFixed(2).replace('.', ',')}
        </Text>
      </View>

      <View style={styles.qtdBox}>
        <TouchableOpacity onPress={() => onDiminuir(item.produto.id)} style={styles.btnMenos} activeOpacity={0.7}>
          <Text style={styles.btnMenosTxt}>×</Text>
        </TouchableOpacity>
        <Text style={styles.qtd}>{item.quantidade}</Text>
        <TouchableOpacity onPress={() => onAumentar(item.produto.id)} style={styles.btnMais} activeOpacity={0.85}>
          <Text style={styles.btnMaisTxt}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  thumb:      { width: 64, height: 64, borderRadius: 10 },
  info:       { flex: 1 },
  nome:       { fontSize: 14, fontWeight: '600', color: colors.navy, lineHeight: 18 },
  padrao:     { fontSize: 11, color: colors.n600, marginTop: 1 },
  preco:      { fontSize: 14, fontWeight: '700', color: colors.navy, marginTop: 4 },
  qtdBox:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.n200,
                borderRadius: 99, paddingHorizontal: 4, paddingVertical: 2, gap: 8, backgroundColor: colors.n0 },
  btnMenos:   { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  btnMenosTxt:{ color: colors.n600, fontSize: 16, fontWeight: '600' },
  qtd:        { fontSize: 13, fontWeight: '600', color: colors.navy, minWidth: 12, textAlign: 'center' },
  btnMais:    { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.orange,
                alignItems: 'center', justifyContent: 'center' },
  btnMaisTxt: { color: colors.n0, fontSize: 14, fontWeight: '700', lineHeight: 16 },
});