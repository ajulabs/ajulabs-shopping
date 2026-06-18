import { useMemo, useState, useEffect, useCallback } from 'react';
import { EnderecoSalvo } from '@ajulabs/types';
import { EnderecoService, LojaService } from '@ajulabs/api-client';
import {
  useCartStore,
  calcularGrupos,
  calcularQuantidadeItens,
  useAuthStore,
} from '../../../../store';

export function useCart() {
  const itensPorLoja = useCartStore((s) => s.itensPorLoja);
  const lojasCache = useCartStore((s) => s.lojasCache);
  const cachearLoja = useCartStore((s) => s.cachearLoja);
  const aumentar = useCartStore((s) => s.aumentar);
  const diminuir = useCartStore((s) => s.diminuir);
  const remover = useCartStore((s) => s.remover);
  const token = useAuthStore((s) => s.token);

  const [enderecos, setEnderecos] = useState<EnderecoSalvo[]>([]);
  const [enderecoId, setEnderecoId] = useState('');

  const carregarEnderecos = useCallback(() => {
    if (!token) return Promise.resolve();
    return EnderecoService.listar(token)
      .then((data) => {
        setEnderecos(data);
        if (!enderecoId) {
          const padrao = data.find((e) => e.padrao) ?? data[0];
          if (padrao) setEnderecoId(padrao.id);
        }
      })
      .catch(() => {});
  }, [token, enderecoId]);

  useEffect(() => {
    carregarEnderecos();
  }, [token]);

  // Rehidrata lojasCache para lojaIds que sobreviveram no AsyncStorage mas perderam o cache.
  // Depende de itensPorLoja para reagir quando a hidratação do Zustand/AsyncStorage completa.
  useEffect(() => {
    const ausentes = Object.keys(itensPorLoja).filter((id) => !lojasCache[id]);
    if (ausentes.length === 0) return;
    ausentes.forEach((id) => {
      LojaService.buscarPorId(id)
        .then((loja) => {
          if (loja) cachearLoja(loja);
        })
        .catch(() => {});
    });
  }, [itensPorLoja]);

  const enderecoAtual = enderecos.find((e) => e.id === enderecoId);

  const grupos = useMemo(
    () => calcularGrupos(itensPorLoja, lojasCache),
    [itensPorLoja, lojasCache],
  );
  const quantidadeItens = useMemo(() => calcularQuantidadeItens(itensPorLoja), [itensPorLoja]);
  const subtotalGeral = useMemo(() => grupos.reduce((acc, g) => acc + g.subtotal, 0), [grupos]);
  const freteTotal = useMemo(() => grupos.reduce((acc, g) => acc + g.taxaEntrega, 0), [grupos]);
  const total = subtotalGeral + freteTotal;
  const numLojas = grupos.length;

  return {
    grupos,
    quantidadeItens,
    subtotalGeral,
    freteTotal,
    total,
    numLojas,
    aumentar,
    diminuir,
    remover,
    token,
    enderecos,
    enderecoId,
    setEnderecoId,
    enderecoAtual,
    carregarEnderecos,
  };
}
