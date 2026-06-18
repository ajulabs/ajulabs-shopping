import { useState, useEffect, useCallback } from 'react';
import { NotificationPreferencesService, type NotificationPreference } from '@ajulabs/api-client';
import { useAuthStore } from '../../../../store';

export function useNotificacoes() {
  const token = useAuthStore((s) => s.token);
  const [preferencias, setPreferencias] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  // Categorias com toggle em voo — desativa o Switch só na que está salvando
  const [salvando, setSalvando] = useState<Set<string>>(new Set());
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const lista = await NotificationPreferencesService.listar(token);
      setPreferencias(lista);
      setErro('');
    } catch {
      setErro('Não foi possível carregar suas preferências.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const toggle = useCallback(
    async (categoria: string, ativo: boolean) => {
      if (!token) return;
      // Otimista: atualiza UI imediatamente
      setPreferencias((prev) => prev.map((p) => (p.categoria === categoria ? { ...p, ativo } : p)));
      setSalvando((prev) => new Set(prev).add(categoria));
      try {
        await NotificationPreferencesService.atualizar(token, categoria, ativo);
      } catch {
        // Rollback em caso de falha
        setPreferencias((prev) =>
          prev.map((p) => (p.categoria === categoria ? { ...p, ativo: !ativo } : p)),
        );
        setErro('Não foi possível salvar a preferência. Tente novamente.');
      } finally {
        setSalvando((prev) => {
          const next = new Set(prev);
          next.delete(categoria);
          return next;
        });
      }
    },
    [token],
  );

  return { preferencias, loading, salvando, erro, toggle };
}
