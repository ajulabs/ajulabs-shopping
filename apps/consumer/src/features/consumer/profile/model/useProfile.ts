import { useState, useEffect } from 'react';
import { PedidoService } from '@ajulabs/api-client';
import { useAuthStore } from '../../../../store';

export function useProfile() {
  const token = useAuthStore((s) => s.token);
  const [totalPedidos, setTotalPedidos] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!token) return;
    PedidoService.listar(token)
      .then((data) => setTotalPedidos(data.length))
      .catch(() => {});
  }, [token]);

  return { totalPedidos };
}
