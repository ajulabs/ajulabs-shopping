import { create } from 'zustand';
import { Produto, ItemCarrinho, Pedido, StatusPedido } from '../../../types';
import { LOJAS, USUARIO_MOCK } from '../../../mock/mock-data';

export interface GrupoLoja {
  lojaId: string;
  itens: ItemCarrinho[];
}

interface CarrinhoStore {
  grupos: GrupoLoja[];
  pedidoAtivo: Pedido | null;
  historicoPedidos: Pedido[];
  adicionarItem: (produto: Produto) => void;
  removerItem: (produtoId: string, lojaId: string) => void;
  incrementar: (produtoId: string, lojaId: string) => void;
  decrementar: (produtoId: string, lojaId: string) => void;
  limparCarrinho: () => void;
  totalItens: () => number;
  totalGeral: () => number;
  totalFrete: () => number;
  confirmarPedido: () => Pedido | null;
  atualizarStatusPedido: (pedidoId: string, status: StatusPedido) => void;
}

export const useCarrinhoStore = create<CarrinhoStore>((set, get) => ({
  grupos: [],
  pedidoAtivo: null,
  historicoPedidos: [],

  adicionarItem: (produto) => {
    const { grupos } = get();
    const grupoExistente = grupos.find((g) => g.lojaId === produto.lojaId);
    if (grupoExistente) {
      const itemExiste = grupoExistente.itens.find((i) => i.produto.id === produto.id);
      set({
        grupos: grupos.map((g) =>
          g.lojaId !== produto.lojaId
            ? g
            : {
                ...g,
                itens: itemExiste
                  ? g.itens.map((i) =>
                      i.produto.id === produto.id
                        ? { ...i, quantidade: i.quantidade + 1 }
                        : i
                    )
                  : [...g.itens, { produto, quantidade: 1 }],
              }
        ),
      });
    } else {
      set({
        grupos: [
          ...grupos,
          { lojaId: produto.lojaId, itens: [{ produto, quantidade: 1 }] },
        ],
      });
    }
  },

  removerItem: (produtoId, lojaId) =>
    set((state) => ({
      grupos: state.grupos
        .map((g) =>
          g.lojaId !== lojaId
            ? g
            : { ...g, itens: g.itens.filter((i) => i.produto.id !== produtoId) }
        )
        .filter((g) => g.itens.length > 0),
    })),

  incrementar: (produtoId, lojaId) =>
    set((state) => ({
      grupos: state.grupos.map((g) =>
        g.lojaId !== lojaId
          ? g
          : {
              ...g,
              itens: g.itens.map((i) =>
                i.produto.id === produtoId
                  ? { ...i, quantidade: i.quantidade + 1 }
                  : i
              ),
            }
      ),
    })),

  decrementar: (produtoId, lojaId) =>
    set((state) => ({
      grupos: state.grupos
        .map((g) =>
          g.lojaId !== lojaId
            ? g
            : {
                ...g,
                itens: g.itens
                  .map((i) =>
                    i.produto.id === produtoId
                      ? { ...i, quantidade: i.quantidade - 1 }
                      : i
                  )
                  .filter((i) => i.quantidade > 0),
              }
        )
        .filter((g) => g.itens.length > 0),
    })),

  limparCarrinho: () => set({ grupos: [] }),

  totalItens: () =>
    get().grupos.reduce(
      (acc, g) => acc + g.itens.reduce((a, i) => a + i.quantidade, 0),
      0
    ),

  totalFrete: () =>
    get().grupos.reduce((acc, g) => {
      const loja = LOJAS.find((l) => l.id === g.lojaId);
      return acc + (loja?.taxaEntrega ?? 0);
    }, 0),

  totalGeral: () => {
    const subtotal = get().grupos.reduce(
      (acc, g) =>
        acc + g.itens.reduce((a, i) => a + i.produto.preco * i.quantidade, 0),
      0
    );
    return subtotal + get().totalFrete();
  },

  confirmarPedido: () => {
    const { grupos } = get();
    if (grupos.length === 0) return null;
    const pg = grupos[0];
    const loja = LOJAS.find((l) => l.id === pg.lojaId);
    const subtotal = grupos.reduce(
      (acc, g) =>
        acc + g.itens.reduce((a, i) => a + i.produto.preco * i.quantidade, 0),
      0
    );
    const taxaEntrega = get().totalFrete();
    const novoPedido: Pedido = {
      id: `ped-${Date.now()}`,
      lojaId: pg.lojaId,
      lojaNome: loja?.nome ?? 'Loja',
      consumidorId: USUARIO_MOCK.id,
      itens: grupos.flatMap((g) =>
        g.itens.map((i) => ({
          produto: i.produto,
          quantidade: i.quantidade,
          precoUnitario: i.produto.preco,
        }))
      ),
      status: 'aguardando',
      enderecoEntrega: USUARIO_MOCK.endereco!,
      subtotal,
      taxaEntrega,
      total: subtotal + taxaEntrega,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      estimativaEntrega: new Date(Date.now() + 45 * 60000).toISOString(),
    };
    set((state) => ({
      pedidoAtivo: novoPedido,
      historicoPedidos: [novoPedido, ...state.historicoPedidos],
      grupos: [],
    }));
    return novoPedido;
  },

  atualizarStatusPedido: (pedidoId, status) =>
    set((state) => ({
      pedidoAtivo:
        state.pedidoAtivo?.id === pedidoId
          ? { ...state.pedidoAtivo, status, atualizadoEm: new Date().toISOString() }
          : state.pedidoAtivo,
      historicoPedidos: state.historicoPedidos.map((p) =>
        p.id === pedidoId
          ? { ...p, status, atualizadoEm: new Date().toISOString() }
          : p
      ),
    })),
}));
