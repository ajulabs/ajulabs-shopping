import { useRef, useState } from 'react';
import { TIPOS_PRODUTO, TipoProdutoValue } from './tipoProdutos';

export function useTipoProdutoState({
  value,
  onChange,
  onSpecLayout,
}: {
  value: TipoProdutoValue | null;
  onChange: (v: TipoProdutoValue | null) => void;
  onSpecLayout?: (positions: Record<string, number>) => void;
}) {
  const [novaVariacao, setNovaVariacao] = useState('');
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const specsSectionY = useRef(0);
  const specGroupYs = useRef<Record<string, number>>({});
  // Lembra a última configuração de cada categoria, para restaurar ao voltar.
  const catMemory = useRef<Record<string, TipoProdutoValue>>({});

  const reportPositions = () => {
    if (!onSpecLayout) return;
    const positions: Record<string, number> = {};
    for (const [id, y] of Object.entries(specGroupYs.current)) {
      positions[id] = specsSectionY.current + y;
    }
    onSpecLayout(positions);
  };

  const cat = value ? TIPOS_PRODUTO.find((c) => c.id === value.catId) : null;
  const subcat =
    cat && value?.subcatId && !cat.isCustom
      ? cat.subcats.find((s) => s.id === value.subcatId)
      : null;

  const selectCat = (catId: string) => {
    // Guarda a configuração atual antes de sair, para poder restaurar depois.
    if (value?.catId && value.subcatId) {
      catMemory.current[value.catId] = value;
    }
    if (value?.catId === catId) {
      onChange(null);
      return;
    }
    const remembered = catMemory.current[catId];
    if (remembered) {
      onChange(remembered);
      return;
    }
    const cfg = TIPOS_PRODUTO.find((c) => c.id === catId);
    onChange({ catId, subcatId: cfg?.isCustom ? '__custom__' : '', specs: {} });
  };

  const selectSubcat = (subcatId: string) => {
    if (!value) return;
    onChange({ catId: value.catId, subcatId, specs: {} });
  };

  const toggleSpec = (specId: string, opt: string) => {
    if (!value || !value.subcatId) return;
    const specCfg = subcat?.specs.find((s) => s.id === specId);
    const current = value.specs[specId] ?? [];
    const next = specCfg?.multiplo
      ? current.includes(opt)
        ? current.filter((v) => v !== opt)
        : [...current, opt]
      : current.includes(opt)
        ? []
        : [opt];
    onChange({ ...value, specs: { ...value.specs, [specId]: next } });
  };

  const addCustomSpec = (specId: string) => {
    const v = customInputs[specId]?.trim();
    if (!v || !value) return;
    onChange({ ...value, specs: { ...value.specs, [specId]: [v] } });
    setCustomInputs((prev) => ({ ...prev, [specId]: '' }));
  };

  const setCustomTipo = (text: string) => {
    if (!value) return;
    onChange({ ...value, specs: { ...value.specs, _tipo: text ? [text] : [] } });
  };

  const addVariacaoCustom = () => {
    const v = novaVariacao.trim();
    if (!v || !value) return;
    const current = value.specs['variacao'] ?? [];
    if (!current.includes(v)) {
      onChange({ ...value, specs: { ...value.specs, variacao: [...current, v] } });
    }
    setNovaVariacao('');
  };

  const removeVariacaoCustom = (v: string) => {
    if (!value) return;
    const next = (value.specs['variacao'] ?? []).filter((x) => x !== v);
    onChange({ ...value, specs: { ...value.specs, variacao: next } });
  };

  const customTipo = value?.specs['_tipo']?.[0] ?? '';
  const customVars = value?.specs['variacao'] ?? [];
  const isCustom = !!cat?.isCustom;
  const hasSelection = !!(value?.catId && value.subcatId);

  return {
    novaVariacao,
    setNovaVariacao,
    customInputs,
    setCustomInputs,
    specsSectionY,
    specGroupYs,
    reportPositions,
    cat,
    subcat,
    selectCat,
    selectSubcat,
    toggleSpec,
    addCustomSpec,
    setCustomTipo,
    addVariacaoCustom,
    removeVariacaoCustom,
    customTipo,
    customVars,
    isCustom,
    hasSelection,
  };
}
