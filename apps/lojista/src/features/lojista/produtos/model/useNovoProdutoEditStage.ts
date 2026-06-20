import { useState, useCallback, useRef } from 'react';
import { ScrollView } from 'react-native';
import { TipoProdutoValue } from './tipoProdutos';
import { getMissingSpecs } from './variacoesProduto';
import { useProdutoVariacoes } from './useProdutoVariacoes';
import { ProductData } from '../lib/types';

export type FieldKey = 'nome' | 'tipoProduto' | 'descricao' | 'preco' | 'estoque';

const FIELD_ORDER: FieldKey[] = ['nome', 'tipoProduto', 'descricao', 'preco', 'estoque'];

function validate(data: ProductData): {
  errors: Partial<Record<FieldKey, string>>;
  missingSpecs: string[];
} {
  const errors: Partial<Record<FieldKey, string>> = {};
  if (!data.nome.trim()) errors.nome = 'Informe o nome do produto';
  if (!data.tipoProduto?.catId || !data.tipoProduto?.subcatId)
    errors.tipoProduto = 'Selecione o tipo do produto';
  if (!data.descricao.trim()) errors.descricao = 'Informe uma descrição';
  const preco = parseFloat(data.preco.replace(',', '.'));
  if (!data.preco.trim() || isNaN(preco) || preco <= 0) errors.preco = 'Informe um preço válido';
  const missingSpecs = getMissingSpecs(data.tipoProduto);
  if (missingSpecs.length > 0 && !errors.tipoProduto)
    errors.tipoProduto = 'Preencha todas as especificações do produto';
  // estoque global só é obrigatório quando não há variações
  if (data.variacoesEstoque.length === 0) {
    const estoque = parseInt(data.estoque, 10);
    if (!data.estoque.trim() || isNaN(estoque) || estoque < 0)
      errors.estoque = 'Informe a quantidade em estoque';
  }
  return { errors, missingSpecs };
}

export function useNovoProdutoEditStage({
  data,
  onChange,
  onPublicar,
}: {
  data: ProductData;
  onChange: (key: keyof ProductData, value: ProductData[keyof ProductData]) => void;
  onPublicar: () => void;
}) {
  const [newTag, setNewTag] = useState('');
  const [imgLoading, setImgLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [missingSpecs, setMissingSpecs] = useState<string[]>([]);

  const scrollRef = useRef<ScrollView>(null);
  const fieldPositions = useRef<Partial<Record<FieldKey, number>>>({});
  const selectorWrapY = useRef(0);
  const specPositions = useRef<Record<string, number>>({});

  // Re-gera variações quando tipoProduto muda
  useProdutoVariacoes(data.tipoProduto, data.variacoesEstoque, (v) =>
    onChange('variacoesEstoque', v),
  );

  const hasVariacoes = data.variacoesEstoque.length > 0;

  const handleChange = useCallback(
    <K extends keyof ProductData>(key: K, value: ProductData[K]) => {
      onChange(key, value);
      if (key in errors)
        setErrors((prev) => {
          const next = { ...prev };
          delete next[key as FieldKey];
          return next;
        });
      if (key === 'tipoProduto') {
        const next = value as TipoProdutoValue | null;
        setMissingSpecs((prev) => prev.filter((id) => (next?.specs[id] ?? []).length === 0));
      }
    },
    [onChange, errors],
  );

  const handlePublicar = useCallback(() => {
    const { errors: errs, missingSpecs: missing } = validate(data);
    setErrors(errs);
    setMissingSpecs(missing);
    if (Object.keys(errs).length > 0 || missing.length > 0) {
      const tipoProdutoIdx = FIELD_ORDER.indexOf('tipoProduto');
      const firstFieldKey = FIELD_ORDER.find((k) => errs[k]);
      const firstFieldIdx = firstFieldKey ? FIELD_ORDER.indexOf(firstFieldKey) : Infinity;
      if (missing.length > 0 && firstFieldIdx >= tipoProdutoIdx) {
        const specY =
          (fieldPositions.current['tipoProduto'] ?? 0) +
          selectorWrapY.current +
          (specPositions.current[missing[0]] ?? 0);
        scrollRef.current?.scrollTo({ y: specY - 16, animated: true });
      } else if (firstFieldKey) {
        scrollRef.current?.scrollTo({
          y: (fieldPositions.current[firstFieldKey] ?? 0) - 16,
          animated: true,
        });
      }
      return;
    }
    onPublicar();
  }, [data, onPublicar]);

  const addTag = useCallback(() => {
    if (!newTag.trim()) return;
    handleChange('tags', [...data.tags, newTag.trim().toLowerCase()]);
    setNewTag('');
  }, [newTag, data.tags, handleChange]);

  const removeTag = useCallback(
    (tag: string) => {
      handleChange(
        'tags',
        data.tags.filter((t) => t !== tag),
      );
    },
    [data.tags, handleChange],
  );

  const recordY = (key: FieldKey) => (e: { nativeEvent: { layout: { y: number } } }) => {
    fieldPositions.current[key] = e.nativeEvent.layout.y;
  };

  return {
    newTag,
    setNewTag,
    imgLoading,
    setImgLoading,
    errors,
    missingSpecs,
    scrollRef,
    selectorWrapY,
    specPositions,
    hasVariacoes,
    handleChange,
    handlePublicar,
    addTag,
    removeTag,
    recordY,
  };
}
