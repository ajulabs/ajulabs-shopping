import { useEffect, useState, useCallback } from 'react';
import { NotificationPreferencesService, type NotificationPreference } from '@ajulabs/api-client';
import { useAuthEntregadorStore } from '../../../../store';

export function useNotificacoes() {
  const token = useAuthEntregadorStore((s) => s.token);
  const [preferencias, setPreferencias] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  // Categorias com toggle em voo — desativa o Switch só na que está salvando
  const [salvando, setSalvando] = useState<Set<string>>(new Set());
  const [erro, setErro] = useState('');
  const [saved, setSaved] = useState(false);

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
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } catch {
        // Rollback
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

  return {
    preferencias,
    loading,
    salvando,
    erro,
    saved,
    toggle,
  };
}
