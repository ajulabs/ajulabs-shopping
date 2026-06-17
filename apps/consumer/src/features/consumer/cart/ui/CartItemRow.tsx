import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemCarrinho } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../hooks';

interface Props {
  item: ItemCarrinho;
  onAumentar: (produtoId: string, variacaoId?: string) => void;
  onDiminuir: (produtoId: string, variacaoId?: string) => void;
  onRemover: (produtoId: string, variacaoId?: string) => void;
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

export function CartItemRow({ item, onAumentar, onDiminuir, onRemover }: Props) {
  const { isDark, text, textSec, surf } = useTheme();
  const border = isDark ? 'rgba(255,255,255,0.12)' : colors.n200;
  const qtdBg = surf;

  const variacaoEfetiva = item.variacaoId
    ? item.produto.variacoes?.find((v) => v.id === item.variacaoId)
    : undefined;
  const estoqueEfetivo = item.variacaoId
    ? (variacaoEfetiva?.estoque ?? Infinity)
    : (item.produto.estoque ?? Infinity);
  const noLimiteEstoque = isFinite(estoqueEfetivo) && item.quantidade >= estoqueEfetivo;

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

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
            style={[styles.btnMais, noLimiteEstoque && styles.btnMaisDisabled]}
            activeOpacity={0.85}
            disabled={noLimiteEstoque}
          >
            <Text style={styles.btnMaisTxt}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS === 'web') {
              if (window.confirm(`Remover "${item.produto.nome}" do carrinho?`)) {
                onRemover(item.produto.id, item.variacaoId);
              }
            } else {
              Alert.alert('Remover item', `Remover "${item.produto.nome}" do carrinho?`, [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Remover',
                  style: 'destructive',
                  onPress: () => onRemover(item.produto.id, item.variacaoId),
                },
              ]);
            }
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
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
  btnMaisDisabled: {
    backgroundColor: colors.n300,
  },
  btnMaisTxt: { color: colors.n0, fontSize: 14, fontWeight: '700', lineHeight: 16 },
});
