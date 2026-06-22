import { useState, useEffect, useRef } from 'react';
import { Alert, Platform, Animated } from 'react-native';
import { EstoqueService } from '@ajulabs/api-client';
import { Produto } from '@ajulabs/types';

export type TipoAjuste = 'entrada_manual' | 'saida_manual' | 'ajuste_inventario' | 'devolucao';

const TAMANHOS_ROUPA = new Set(['PP', 'P', 'M', 'G', 'GG', 'GGG', 'XS', 'S', 'L', 'XL', 'XXL']);
const CORES = new Set([
  'Preto',
  'Branco',
  'Azul',
  'Vermelho',
  'Verde',
  'Amarelo',
  'Cinza',
  'Rosa',
  'Marrom',
  'Bege',
  'Nude',
  'Prata',
  'Dourado',
  'Marinho',
  'Coral',
  'Roxo',
  'Laranja',
]);

function inferirEixoVariacao(nomes: string[]): { label: string; abrev: string } {
  if (nomes.length === 0) return { label: 'Variação', abrev: '' };
  const tokens = nomes.flatMap((n) => n.split(/\s*[·\-/]\s*/));
  const numericoSapato = tokens.some((t) => /^\d{2}$/.test(t));
  const tamanhoRoupa = tokens.some((t) => TAMANHOS_ROUPA.has(t.toUpperCase()));
  if (numericoSapato || tamanhoRoupa) return { label: 'Tamanho', abrev: 'Tam.' };
  if (tokens.some((t) => CORES.has(t))) return { label: 'Cor', abrev: '' };
  return { label: 'Variação', abrev: '' };
}

export function useAjusteEstoque({
  produto,
  lojaId,
  token,
  onSaved,
}: {
  produto: Produto;
  lojaId: string;
  token: string;
  onSaved: (produto: Produto) => void;
}) {
  const variacoes = produto.variacoes ?? [];
  const temVariacoes = variacoes.length > 0;

  const [tipo, setTipo] = useState<TipoAjuste>('entrada_manual');
  const [qty, setQty] = useState('');
  const [motivo, setMotivo] = useState('');
  const [minimo, setMinimo] = useState(String(produto.estoqueMinimo ?? 0));
  const [variacaoId, setVariacaoId] = useState<string | undefined>(
    temVariacoes ? variacoes[0].id : undefined,
  );
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ produto: Produto; resumo: string } | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Após o sucesso, exibe o card flutuante (fade + escala), segura e fecha.
  useEffect(() => {
    if (!done) return;
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 80 }),
      Animated.delay(1100),
      Animated.timing(toastAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start(() => onSaved(done.produto));
    return () => toastAnim.stopAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  useEffect(() => {
    setMinimo(String(produto.estoqueMinimo ?? 0));
    setVariacaoId(temVariacoes ? variacoes[0].id : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produto.id]);

  const variacaoSel = temVariacoes
    ? (variacoes.find((v) => v.id === variacaoId) ?? variacoes[0])
    : null;

  const eixoVariacao = inferirEixoVariacao(variacoes.map((v) => v.nome));

  const isInvent = tipo === 'ajuste_inventario';
  const qtyNum = parseInt(qty, 10);
  // No inventário é válido definir o total como 0 (zerar o estoque).
  const qtyValida = !isNaN(qtyNum) && (isInvent ? qtyNum >= 0 : qtyNum > 0);
  const atual = variacaoSel ? variacaoSel.estoque : (produto.estoque ?? 0);
  const estoqueInsuficiente = tipo === 'saida_manual' && qtyValida && qtyNum > atual;
  const novoEstoque = !qtyValida
    ? null
    : isInvent
      ? qtyNum
      : tipo === 'saida_manual'
        ? atual - qtyNum // sem clamp — estoqueInsuficiente bloqueia antes
        : atual + qtyNum;
  const delta = novoEstoque != null ? novoEstoque - atual : null;

  async function salvar() {
    if (!qtyValida) {
      const m = 'Informe uma quantidade válida.';
      Platform.OS === 'web' ? alert(m) : Alert.alert('Atenção', m);
      return;
    }
    setSaving(true);
    try {
      const minimoNum = parseInt(minimo, 10);
      const minimoValido = !isNaN(minimoNum) && minimoNum >= 0;
      const minimoChanged = minimoValido && minimoNum !== (produto.estoqueMinimo ?? 0);

      const [atualizado] = await Promise.all([
        EstoqueService.registrarMovimentacao(token, {
          produtoId: produto.id,
          lojaId,
          tipo,
          quantidade: qtyNum,
          motivo: motivo.trim() || undefined,
          variacaoId: variacaoSel?.id,
        }),
        minimoChanged
          ? EstoqueService.setEstoqueMinimo(produto.id, minimoNum, token)
          : Promise.resolve(),
      ]);
      const resumo = `${variacaoSel ? `${variacaoSel.nome} · ` : ''}${atual} → ${novoEstoque} un`;
      setQty('');
      setMotivo('');
      setDone({ produto: atualizado, resumo });
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Erro ao registrar';
      Platform.OS === 'web' ? alert(m) : Alert.alert('Erro', m);
    } finally {
      setSaving(false);
    }
  }

  return {
    variacoes,
    temVariacoes,
    variacaoSel,
    eixoVariacao,
    tipo,
    setTipo,
    qty,
    setQty,
    motivo,
    setMotivo,
    minimo,
    setMinimo,
    setVariacaoId,
    saving,
    done,
    toastAnim,
    isInvent,
    qtyNum,
    qtyValida,
    atual,
    estoqueInsuficiente,
    novoEstoque,
    delta,
    salvar,
  };
}
