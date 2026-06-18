import { useState, useEffect } from 'react';
import { ItemPedido, TAGS_AVALIACAO_LOJA, TAGS_AVALIACAO_ENTREGADOR } from '@ajulabs/types';

export interface AvaliacaoPayload {
  notaLoja: number;
  comentarioLoja?: string;
  tagsLoja: string[];
  notaEntregador: number;
  comentarioEntregador?: string;
  tagsEntregador: string[];
  avaliacoesProdutos: { produtoId: string; nota: number; comentario?: string }[];
}

export function useAvaliacaoForm(
  itens: ItemPedido[],
  onEnviar: (dados: AvaliacaoPayload) => void,
  onFechar: () => void,
) {
  const [notaLoja, setNotaLoja] = useState(0);
  const [comentarioLoja, setComentarioLoja] = useState('');
  const [tagsLoja, setTagsLoja] = useState<string[]>([]);
  const [notaEntregador, setNotaEntregador] = useState(0);
  const [comentarioEntregador, setComentarioEntregador] = useState('');
  const [tagsEntregador, setTagsEntregador] = useState<string[]>([]);
  const [notasProdutos, setNotasProdutos] = useState<Record<string, number>>({});
  const [comentariosProdutos, setComentariosProdutos] = useState<Record<string, string>>({});

  // Quando o usuário muda a nota cruzando o limite positivo/negativo (4),
  // as tags antigas ficam inválidas (eram positivas pra nota baixa, ou
  // vice-versa) e seriam silenciosamente filtradas no backend. Aqui
  // limpamos pra que a UI espelhe o que vai ser enviado.
  const sentimentoLoja = notaLoja === 0 ? null : notaLoja >= 4 ? 'positiva' : 'negativa';
  const sentimentoEntregador =
    notaEntregador === 0 ? null : notaEntregador >= 4 ? 'positiva' : 'negativa';

  useEffect(() => {
    if (tagsLoja.length === 0 || sentimentoLoja === null) return;
    const validas = tagsLoja.filter((id) => {
      const tag = TAGS_AVALIACAO_LOJA.find((t) => t.id === id);
      return tag?.sentimento === sentimentoLoja;
    });
    if (validas.length !== tagsLoja.length) setTagsLoja(validas);
  }, [sentimentoLoja]);

  useEffect(() => {
    if (tagsEntregador.length === 0 || sentimentoEntregador === null) return;
    const validas = tagsEntregador.filter((id) => {
      const tag = TAGS_AVALIACAO_ENTREGADOR.find((t) => t.id === id);
      return tag?.sentimento === sentimentoEntregador;
    });
    if (validas.length !== tagsEntregador.length) setTagsEntregador(validas);
  }, [sentimentoEntregador]);

  const produtosUnicos = itens.filter(
    (item, idx, arr) => arr.findIndex((i) => i.produto.id === item.produto.id) === idx,
  );

  const tudoPreenchido =
    notaLoja > 0 &&
    notaEntregador > 0 &&
    produtosUnicos.every((item) => (notasProdutos[item.produto.id] ?? 0) > 0);

  const toggleTagLoja = (id: string) =>
    setTagsLoja((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  const toggleTagEntregador = (id: string) =>
    setTagsEntregador((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  const setNotaProduto = (produtoId: string, n: number) =>
    setNotasProdutos((prev) => ({ ...prev, [produtoId]: n }));
  const setComentarioProduto = (produtoId: string, v: string) =>
    setComentariosProdutos((prev) => ({ ...prev, [produtoId]: v }));

  function handleEnviar() {
    if (!tudoPreenchido) return;
    onEnviar({
      notaLoja,
      comentarioLoja: comentarioLoja.trim() || undefined,
      tagsLoja,
      notaEntregador,
      comentarioEntregador: comentarioEntregador.trim() || undefined,
      tagsEntregador,
      avaliacoesProdutos: produtosUnicos.map((item) => ({
        produtoId: item.produto.id,
        nota: notasProdutos[item.produto.id],
        comentario: (comentariosProdutos[item.produto.id] ?? '').trim() || undefined,
      })),
    });
  }

  function handleFechar() {
    setNotaLoja(0);
    setComentarioLoja('');
    setTagsLoja([]);
    setNotaEntregador(0);
    setComentarioEntregador('');
    setTagsEntregador([]);
    setNotasProdutos({});
    setComentariosProdutos({});
    onFechar();
  }

  return {
    notaLoja,
    setNotaLoja,
    comentarioLoja,
    setComentarioLoja,
    tagsLoja,
    toggleTagLoja,
    notaEntregador,
    setNotaEntregador,
    comentarioEntregador,
    setComentarioEntregador,
    tagsEntregador,
    toggleTagEntregador,
    notasProdutos,
    setNotaProduto,
    comentariosProdutos,
    setComentarioProduto,
    produtosUnicos,
    tudoPreenchido,
    handleEnviar,
    handleFechar,
  };
}
