import { useEffect, useState, useCallback } from 'react';
import { NotificationPreferencesService, type NotificationPreference } from '@ajulabs/api-client';
import { useAuthLojistaStore } from '../../../../store';

export function useNotificationPreferences() {
  const token = useAuthLojistaStore((s) => s.token);
  const [preferencias, setPreferencias] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  // Desativa o toggle apenas na categoria que está sendo salva no momento.
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

  return { preferencias, loading, salvando, erro, saved, toggle };
}
