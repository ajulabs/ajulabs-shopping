import { useState, useCallback, useEffect } from 'react';
import { RBACService } from '@ajulabs/api-client';
import type { AuditLogEntry } from '@ajulabs/types';
import { useAuthLojistaStore } from '../../../../store';

const PER_PAGE = 30;

export function useAuditLog() {
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const token = useAuthLojistaStore((s) => s.token);

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detalhe, setDetalhe] = useState<AuditLogEntry | null>(null);
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);

  const carregar = useCallback(
    async (reset = false) => {
      if (!lojaId || !token) return;
      const pg = reset ? 1 : pagina;
      if (reset) setLoading(true);
      try {
        const resultado = await RBACService.listarAuditLog(lojaId, token, {
          page: pg,
          limit: PER_PAGE,
        });
        const items = resultado.items;
        if (reset) {
          setLogs(items);
        } else {
          setLogs((prev) => [...prev, ...items]);
        }
        setTemMais(items.length === PER_PAGE);
        if (reset) setPagina(2);
        else setPagina((p) => p + 1);
      } catch {
        // silently fail on pagination errors
      } finally {
        setLoading(false);
        setRefreshing(false);
        setCarregandoMais(false);
      }
    },
    [lojaId, token, pagina],
  );

  useEffect(() => {
    carregar(true);
  }, [lojaId, token]);

  const carregarMais = useCallback(() => {
    if (!temMais || carregandoMais) return;
    setCarregandoMais(true);
    carregar(false);
  }, [temMais, carregandoMais, carregar]);

  return {
    logs,
    loading,
    refreshing,
    setRefreshing,
    detalhe,
    setDetalhe,
    carregandoMais,
    carregar,
    carregarMais,
  };
}
