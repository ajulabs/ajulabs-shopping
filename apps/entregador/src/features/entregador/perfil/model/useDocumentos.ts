import { useEffect, useState } from 'react';
import { EntregadorService } from '../../../../shared/lib/authServices';
import { useAuthEntregadorStore } from '../../../../store';

export type StatusDoc = 'pendente' | 'aprovado' | 'rejeitado' | null;

export const STATUS_CONFIG: Record<
  NonNullable<StatusDoc>,
  { label: string; color: string; bg: string; icon: string }
> = {
  aprovado: {
    label: 'Aprovado',
    color: '#039855',
    bg: 'rgba(3,152,85,0.1)',
    icon: 'checkmark-circle',
  },
  pendente: { label: 'Em análise', color: '#F2760F', bg: 'rgba(242,118,15,0.1)', icon: 'time' },
  rejeitado: {
    label: 'Reprovado',
    color: '#E14B3C',
    bg: 'rgba(225,75,60,0.1)',
    icon: 'close-circle',
  },
};

export function useDocumentos() {
  const token = useAuthEntregadorStore((s) => s.token);
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    EntregadorService.buscarPerfil(token)
      .then((p) => setPerfil(p))
      .finally(() => setLoading(false));
  }, [token]);

  const docIdentidade = perfil?.entregador?.documentos ?? null;
  const statusId: StatusDoc = docIdentidade?.status ?? null;

  const docVeiculo = perfil?.docVeiculo ?? null;
  const statusVei: StatusDoc = docVeiculo?.status ?? null;

  return {
    loading,
    preview,
    setPreview,
    docIdentidade,
    statusId,
    docVeiculo,
    statusVei,
  };
}
