import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VariacaoProduto } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../hooks';
import { VariacoesSelector, extrairEixos } from '../../produto-detail/ui/ProdutoDetail';

interface Props {
  visible: boolean;
  nome: string;
  preco: number;
  variacoes: { id: string; nome: string; preco: number | null }[];
  onClose: () => void;
  onAdicionar: (variacaoId: string, variacaoNome: string, precoEfetivo?: number) => void;
}

export function ChatVariacaoModal({
  visible,
  nome,
  preco,
  variacoes,
  onClose,
  onAdicionar,
}: Props) {
  const { isDark, surf, bg, text, textSec, borderL } = useTheme();
  const [selecionada, setSelecionada] = useState<VariacaoProduto | null>(null);

  // Adapta o formato do chat para VariacaoProduto esperado pelo VariacoesSelector
  const variacoesAdaptadas: VariacaoProduto[] = variacoes.map((v) => ({
    id: v.id,
    produtoId: '',
    nome: v.nome,
    estoque: 1, // assume disponível — validado no backend ao criar pedido
    preco: v.preco,
  }));

  const eixos = extrairEixos(variacoesAdaptadas);
  const precoExibido = selecionada?.preco != null ? selecionada.preco : preco;

  const handleAdicionar = () => {
    if (!selecionada) return;
    onAdicionar(
      selecionada.id,
      selecionada.nome,
      selecionada.preco != null ? selecionada.preco : undefined,
    );
    onClose();
    setSelecionada(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[s.sheet, { backgroundColor: surf }]}>
          {/* Puxador */}
          <View
            style={[s.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db' }]}
          />

          {/* Header */}
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={[s.nome, { color: text }]} numberOfLines={2}>
                {nome}
              </Text>
              <Text style={[s.preco, { color: colors.orange }]}>
                R$ {precoExibido.toFixed(2).replace('.', ',')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                s.closeBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6' },
              ]}
            >
              <Ionicons name="close" size={18} color={text} />
            </TouchableOpacity>
          </View>

          {/* Seletor */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={s.selectorArea}
            showsVerticalScrollIndicator={false}
          >
            {eixos.length > 0 ? (
              <VariacoesSelector
                variacoes={variacoesAdaptadas}
                isDark={isDark}
                text={text as string}
                textSec={textSec as string}
                borderL={borderL as string}
                onSelecionar={setSelecionada}
              />
            ) : (
              <Text style={[s.semOpcoes, { color: textSec as string }]}>
                Nenhuma opção disponível.
              </Text>
            )}
          </ScrollView>

          {/* Botão */}
          <View
            style={[s.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6' }]}
          >
            <TouchableOpacity
              style={[s.btn, !selecionada && s.btnDisabled]}
              onPress={handleAdicionar}
              disabled={!selecionada}
              activeOpacity={0.85}
            >
              <Text style={s.btnTxt}>
                {selecionada ? '+ Adicionar ao carrinho' : 'Selecione uma opção'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  nome: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  preco: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  selectorArea: { paddingHorizontal: 20, paddingBottom: 16 },
  semOpcoes: { fontSize: 14, textAlign: 'center', marginTop: 24 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  btn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { backgroundColor: '#9ca3af' },
  btnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
