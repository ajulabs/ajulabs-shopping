import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Produto, Loja, ItemCarrinho } from '@ajulabs/types';
import { getLojaById } from '@ajulabs/api-client';

export interface GrupoLoja {
  lojaId: string;
  lojaNome: string;
  tempoEntregaMin: number;
  tempoEntregaMax: number;
  taxaEntrega: number;
  itens: ItemCarrinho[];
  subtotal: number;
}

interface CartState {
  itensPorLoja: Record<string, ItemCarrinho[]>;
  lojasCache: Record<string, Loja>;

  adicionar: (produto: Produto) => void;
  remover: (produtoId: string) => void;
  aumentar: (produtoId: string) => void;
  diminuir: (produtoId: string) => void;
  limparLoja: (lojaId: string) => void;
  limparTudo: () => void;
  cachearLoja: (loja: Loja) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      itensPorLoja: {},
      lojasCache: {},

      adicionar: (produto) => {
        const { itensPorLoja } = get();
        const itensAtuais = itensPorLoja[produto.lojaId] ?? [];
        const existente = itensAtuais.find((i) => i.produto.id === produto.id);

        const novosItens = existente
          ? itensAtuais.map((i) =>
              i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i,
            )
          : [...itensAtuais, { produto, quantidade: 1 }];

        set({
          itensPorLoja: { ...itensPorLoja, [produto.lojaId]: novosItens },
        });
      },

      remover: (produtoId) => {
        const { itensPorLoja } = get();
        const novo: Record<string, ItemCarrinho[]> = {};
        for (const [lojaId, itens] of Object.entries(itensPorLoja)) {
          const filtrados = itens.filter((i) => i.produto.id !== produtoId);
          if (filtrados.length > 0) novo[lojaId] = filtrados;
        }
        set({ itensPorLoja: novo });
      },

      aumentar: (produtoId) => {
        const { itensPorLoja } = get();
        const novo: Record<string, ItemCarrinho[]> = {};
        for (const [lojaId, itens] of Object.entries(itensPorLoja)) {
          novo[lojaId] = itens.map((i) =>
            i.produto.id === produtoId ? { ...i, quantidade: i.quantidade + 1 } : i,
          );
        }
        set({ itensPorLoja: novo });
      },

      diminuir: (produtoId) => {
        const { itensPorLoja } = get();
        let alvo: ItemCarrinho | undefined;
        for (const itens of Object.values(itensPorLoja)) {
          alvo = itens.find((i) => i.produto.id === produtoId);
          if (alvo) break;
        }
        if (!alvo) return;

        if (alvo.quantidade <= 1) {
          get().remover(produtoId);
          return;
        }

        const novo: Record<string, ItemCarrinho[]> = {};
        for (const [lojaId, itens] of Object.entries(itensPorLoja)) {
          novo[lojaId] = itens.map((i) =>
            i.produto.id === produtoId ? { ...i, quantidade: i.quantidade - 1 } : i,
          );
        }
        set({ itensPorLoja: novo });
      },

      limparLoja: (lojaId) => {
        const { itensPorLoja } = get();
        const { [lojaId]: _, ...resto } = itensPorLoja;
        set({ itensPorLoja: resto });
      },

      limparTudo: () => set({ itensPorLoja: {} }),

      cachearLoja: (loja: Loja) =>
        set((s) => ({ lojasCache: { ...s.lojasCache, [loja.id]: loja } })),
    }),
    {
      name: 'ajulabs-consumer-cart',
      storage: createJSONStorage(() => AsyncStorage),
      // Só persiste os itens (que importam). lojasCache é cache derivado,
      // pode ser recarregado da API quando renderizar o carrinho.
      partialize: (state) => ({ itensPorLoja: state.itensPorLoja }),
    },
  ),
);

export function calcularGrupos(
  itensPorLoja: Record<string, ItemCarrinho[]>,
  lojasCache: Record<string, Loja> = {},
): GrupoLoja[] {
  const grupos: GrupoLoja[] = [];
  for (const [lojaId, itens] of Object.entries(itensPorLoja)) {
    const loja = lojasCache[lojaId] ?? getLojaById(lojaId);
    if (!loja || itens.length === 0) continue;
    const subtotal = itens.reduce((acc, i) => acc + i.produto.preco * i.quantidade, 0);
    grupos.push({
      lojaId: loja.id,
      lojaNome: loja.nome,
      tempoEntregaMin: loja.tempoEntregaMin,
      tempoEntregaMax: loja.tempoEntregaMax,
      taxaEntrega: loja.taxaEntrega,
      itens,
      subtotal,
    });
  }
  return grupos;
}

export function calcularQuantidadeItens(
  itensPorLoja: Record<string, ItemCarrinho[]>,
): number {
  let total = 0;
  for (const itens of Object.values(itensPorLoja)) {
    for (const item of itens) total += item.quantidade;
  }
  return total;
}
