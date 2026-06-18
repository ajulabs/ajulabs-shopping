import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VariacaoProduto } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';
import { extrairEixos, encontrarVariacao } from '../model/variacoes';

export function VariacoesSelector({
  variacoes,
  isDark,
  text,
  textSec,
  borderL,
  onSelecionar,
}: {
  variacoes: VariacaoProduto[];
  isDark: boolean;
  text: string;
  textSec: string;
  borderL: string;
  onSelecionar: (v: VariacaoProduto | null) => void;
}) {
  const eixos = extrairEixos(variacoes);
  const [selecao, setSelecao] = useState<(string | null)[]>(eixos.map(() => null));

  const toggleOpcao = (eixoIdx: number, valor: string) => {
    const nova = [...selecao];
    nova[eixoIdx] = nova[eixoIdx] === valor ? null : valor;
    setSelecao(nova);
    onSelecionar(encontrarVariacao(variacoes, nova));
  };

  const variacaoSelecionada = encontrarVariacao(variacoes, selecao);
  const todosEixosSelecionados = selecao.every((v) => v !== null);

  if (eixos.length === 0) return null;

  return (
    <View style={varSelStyles.container}>
      {eixos.map((eixo, eixoIdx) => (
        <View key={eixoIdx} style={varSelStyles.eixoGroup}>
          <View style={varSelStyles.eixoHeader}>
            <Text style={[varSelStyles.eixoLabel, { color: textSec }]}>{eixo.label}:</Text>
            {selecao[eixoIdx] && (
              <Text style={[varSelStyles.eixoSelecionado, { color: text }]}>
                {selecao[eixoIdx]}
              </Text>
            )}
          </View>
          <View style={varSelStyles.opcoeRow}>
            {eixo.valores.map((valor) => {
              // Verifica se este valor tem estoque em alguma combinação válida
              const selecaoHipotetica = [...selecao];
              selecaoHipotetica[eixoIdx] = valor;
              const temEstoque = variacoes.some((v) => {
                const partes = v.nome.split(' · ');
                return (
                  selecaoHipotetica.every((s, i) => s === null || partes[i] === s) && v.estoque > 0
                );
              });
              const isAtivo = selecao[eixoIdx] === valor;
              return (
                <TouchableOpacity
                  key={valor}
                  style={[
                    varSelStyles.opcaoBadge,
                    {
                      backgroundColor: isAtivo
                        ? colors.navy
                        : isDark
                          ? 'rgba(255,255,255,0.06)'
                          : colors.n0,
                      borderColor: isAtivo ? colors.navy : borderL,
                      opacity: temEstoque ? 1 : 0.4,
                    },
                  ]}
                  onPress={() => toggleOpcao(eixoIdx, valor)}
                  activeOpacity={0.75}
                  disabled={!temEstoque}
                >
                  <Text style={[varSelStyles.opcaoTxt, { color: isAtivo ? colors.n0 : text }]}>
                    {valor}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {todosEixosSelecionados && variacaoSelecionada && (
        <View style={varSelStyles.statusRow}>
          <Ionicons
            name={variacaoSelecionada.estoque > 0 ? 'checkmark-circle' : 'close-circle'}
            size={14}
            color={variacaoSelecionada.estoque > 0 ? '#16A34A' : '#DC2626'}
          />
          <Text
            style={[
              varSelStyles.statusTxt,
              { color: variacaoSelecionada.estoque > 0 ? '#15803D' : '#DC2626' },
            ]}
          >
            {variacaoSelecionada.estoque > 0
              ? `${variacaoSelecionada.estoque} disponível${variacaoSelecionada.estoque === 1 ? '' : 'is'}`
              : 'Sem estoque para esta combinação'}
          </Text>
        </View>
      )}

      {todosEixosSelecionados && !variacaoSelecionada && (
        <View style={varSelStyles.statusRow}>
          <Ionicons name="close-circle" size={14} color="#DC2626" />
          <Text style={[varSelStyles.statusTxt, { color: '#DC2626' }]}>
            Combinação indisponível
          </Text>
        </View>
      )}
    </View>
  );
}

export const varSelStyles = StyleSheet.create({
  container: { gap: 14 },
  eixoGroup: { gap: 8 },
  eixoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eixoLabel: { fontSize: 13, fontWeight: '600' },
  eixoSelecionado: { fontSize: 13, fontWeight: '700' },
  opcoeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcaoBadge: {
    minWidth: 44,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  opcaoTxt: { fontSize: 13, fontWeight: '700' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 8,
  },
  statusTxt: { fontSize: 12, fontWeight: '600' },
});
