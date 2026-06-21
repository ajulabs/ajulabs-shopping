import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Alert, Platform, Animated } from 'react-native';
import { LojistaService, RBACService } from '@ajulabs/api-client';
import { Produto } from '@ajulabs/types';
import { useAuthLojistaStore } from '../../../../store';
import { usePermissions } from '../../../../shared/hooks/usePermissions';
import { syncVariacoes, VariacaoEstoque } from '../../../../entities/produto';
import { TipoProdutoValue, derivarCategoriaString } from './tipoProdutos';
import { gerarCombinacoes, reconstruirTipoProduto } from './variacoesProduto';
import { useImageSlots } from './useImageSlots';
import { EditForm } from '../lib/types';

export function useEditProdutoForm({
  produto,
  token,
  onVoltar,
  onSalvo,
}: {
  produto: Produto;
  token: string;
  onVoltar: () => void;
  onSalvo: () => void;
}) {
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const isLojistaDono = useAuthLojistaStore((s) => s.isLojistaDono);
  const { canEditPrices, isGerente, isFuncionario } = usePermissions();

  // State for price change request (funcionario only)
  const [solicitacaoModal, setSolicitacaoModal] = useState(false);
  const [precoSolicitado, setPrecoSolicitado] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false);

  const [form, setForm] = useState<EditForm>({
    nome: produto.nome,
    categoria: produto.categoria,
    descricao: produto.descricao,
    preco: produto.preco.toFixed(2).replace('.', ','),
    estoque: produto.estoque != null ? String(produto.estoque) : '',
    disponivel: produto.disponivel,
    tipoProduto: reconstruirTipoProduto(produto),
    variacoesEstoque: (produto.variacoes ?? []).map((v) => ({
      nome: v.nome,
      estoque: v.estoque,
      preco: v.preco ?? undefined,
    })),
  });
  const [saving, setSaving] = useState(false);
  const [discardAlertVisible, setDiscardAlertVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const initialFormRef = useRef(form);

  const isMounted = useRef(false);

  // Regenera variações quando o lojista seleciona/altera o tipo de produto na edição.
  // Skips the initial mount so pre-loaded variations are not cleared or reordered.
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const nomes = gerarCombinacoes(form.tipoProduto);
    if (nomes.length === 0 && form.variacoesEstoque.length === 0) return;
    const synced = syncVariacoes(nomes, form.variacoesEstoque);
    const mudou =
      synced.length !== form.variacoesEstoque.length ||
      synced.some((v, i) => v.nome !== form.variacoesEstoque[i]?.nome);
    if (mudou) setForm((prev) => ({ ...prev, variacoesEstoque: synced }));
  }, [form.tipoProduto]);

  const { slots, setSlots, initialSlotsRef, pickImage, removeSlot } = useImageSlots(produto);

  const set = useCallback(
    (
      key: keyof EditForm,
      value: string | boolean | TipoProdutoValue | null | VariacaoEstoque[],
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const showSuccessToast = useCallback(
    (cb: () => void) => {
      Animated.sequence([
        Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(toastAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start(() => cb());
    },
    [toastAnim],
  );

  const handleSalvar = useCallback(async () => {
    if (discardAlertVisible) return;
    const existingImageUrls = slots
      .filter((s): s is { type: 'existing'; url: string } => s.type === 'existing')
      .map((s) => s.url);
    const newImageUris = slots
      .filter((s): s is { type: 'new'; uri: string } => s.type === 'new')
      .map((s) => s.uri);
    const categoriaFinal = form.tipoProduto
      ? derivarCategoriaString(form.tipoProduto)
      : form.categoria;
    const hasVariacoes = form.variacoesEstoque.length > 0;

    setSaving(true);
    try {
      if (isLojistaDono) {
        const preco = parseFloat(form.preco.replace(',', '.'));
        if (isNaN(preco) || preco <= 0) {
          Alert.alert('Erro', 'Informe um preço válido.');
          return;
        }
        const dados: Parameters<typeof LojistaService.editarProduto>[2] = {
          nome: form.nome,
          categoria: categoriaFinal,
          descricao: form.descricao,
          preco,
          disponivel: form.disponivel,
          existingImageUrls,
          newImageUris,
          variacoes: hasVariacoes ? form.variacoesEstoque : undefined,
        };
        if (!hasVariacoes && form.estoque !== '') {
          const est = parseInt(form.estoque, 10);
          if (!isNaN(est)) dados.estoque = est;
        }
        await LojistaService.editarProduto(produto.id, token, dados);
      } else {
        // colaborador — use RBAC route (price change for funcionario is handled server-side)
        const dados: Parameters<typeof RBACService.editarProduto>[2] = {
          lojaId: lojaId!,
          nome: form.nome,
          categoria: categoriaFinal,
          descricao: form.descricao,
          disponivel: form.disponivel,
          existingImageUrls,
          newImageUris,
          variacoes: hasVariacoes ? form.variacoesEstoque : undefined,
        };
        if (canEditPrices) {
          const preco = parseFloat(form.preco.replace(',', '.'));
          if (!isNaN(preco) && preco > 0) dados.preco = preco;
        }
        if (!hasVariacoes && form.estoque !== '') {
          const est = parseInt(form.estoque, 10);
          if (!isNaN(est)) dados.estoque = est;
        }
        await RBACService.editarProduto(produto.id, token, dados);
      }
      showSuccessToast(onSalvo);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }, [
    form,
    slots,
    produto.id,
    token,
    onSalvo,
    isLojistaDono,
    lojaId,
    canEditPrices,
    showSuccessToast,
    discardAlertVisible,
  ]);

  const handleSubmeterSolicitacao = useCallback(async () => {
    if (!precoSolicitado.trim() || !justificativa.trim()) {
      Alert.alert('Erro', 'Informe o novo preço e a justificativa.');
      return;
    }
    const preco = parseFloat(precoSolicitado.replace(',', '.'));
    if (isNaN(preco) || preco <= 0) {
      Alert.alert('Erro', 'Preço inválido.');
      return;
    }
    setEnviandoSolicitacao(true);
    try {
      await RBACService.submeterSolicitacaoPreco(token, {
        produtoId: produto.id,
        lojaId: lojaId!,
        precoSolicitado: preco,
        justificativa,
      });
      setSolicitacaoModal(false);
      setPrecoSolicitado('');
      setJustificativa('');
      Alert.alert(
        'Solicitação enviada',
        'Sua solicitação de mudança de preço foi enviada para aprovação.',
      );
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao enviar solicitação.');
    } finally {
      setEnviandoSolicitacao(false);
    }
  }, [precoSolicitado, justificativa, token, produto.id, lojaId]);

  const hasChanges = useMemo(() => {
    const init = initialFormRef.current;
    return (
      form.nome !== init.nome ||
      form.descricao !== init.descricao ||
      form.preco !== init.preco ||
      form.estoque !== init.estoque ||
      form.disponivel !== init.disponivel ||
      form.categoria !== init.categoria ||
      JSON.stringify(form.variacoesEstoque) !== JSON.stringify(init.variacoesEstoque) ||
      JSON.stringify(slots) !== JSON.stringify(initialSlotsRef.current)
    );
  }, [form, slots, initialSlotsRef]);

  const handleDescartar = useCallback(() => {
    const executar = () => {
      setForm(initialFormRef.current);
      setSlots(initialSlotsRef.current);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Todas as alterações feitas serão perdidas. Deseja continuar?'))
        executar();
      return;
    }

    Alert.alert(
      'Descartar alterações',
      'Todas as alterações feitas serão perdidas. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: executar },
      ],
    );
  }, [setSlots, initialSlotsRef]);

  const handleVoltar = useCallback(() => {
    if (!hasChanges) {
      onVoltar();
      return;
    }

    if (Platform.OS === 'web') {
      if (window.confirm('Você tem alterações não salvas. Deseja descartar e sair?')) onVoltar();
      return;
    }

    setDiscardAlertVisible(true);
    Alert.alert(
      'Alterações não salvas',
      'Você tem alterações que ainda não foram salvas. Deseja descartar e sair?',
      [
        {
          text: 'Continuar editando',
          style: 'cancel',
          onPress: () => setDiscardAlertVisible(false),
        },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            setDiscardAlertVisible(false);
            onVoltar();
          },
        },
      ],
      { onDismiss: () => setDiscardAlertVisible(false) },
    );
  }, [hasChanges, onVoltar]);

  return {
    form,
    set,
    saving,
    discardAlertVisible,
    toastAnim,
    hasChanges,
    slots,
    pickImage,
    removeSlot,
    handleSalvar,
    handleDescartar,
    handleVoltar,
    // permissions / visibility
    canEditPrices,
    isGerente,
    isFuncionario,
    // price change request
    solicitacaoModal,
    setSolicitacaoModal,
    precoSolicitado,
    setPrecoSolicitado,
    justificativa,
    setJustificativa,
    enviandoSolicitacao,
    handleSubmeterSolicitacao,
  };
}
