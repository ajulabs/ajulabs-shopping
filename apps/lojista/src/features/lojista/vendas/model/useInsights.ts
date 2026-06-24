import { useState, useEffect } from 'react';
import { LojistaService } from '@ajulabs/api-client';
import type { Insight } from '@ajulabs/types';
import { useAuthLojistaStore } from '../../../../store';

/**
 * Busca os insights da loja (análise determinística feita no backend sobre os
 * dados reais de venda/estoque/avaliação). A tela só consome o resultado pronto.
 */
export function useInsights() {
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);

  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lojaId || !token) {
      setLoading(false);
      return;
    }
    let ativo = true;
    setLoading(true);
    LojistaService.buscarInsights(lojaId, token)
      .then((data) => {
        if (ativo) setInsights(data);
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });
    return () => {
      ativo = false;
    };
  }, [lojaId, token]);

  return { insights, loading };
}
