import {
  LOJAS, PRODUTOS, PEDIDOS_MOCK,
  getProdutosByLoja, getLojaById,
  getLojasAbertas, getLojasByCategoria,
} from '../mock/mock-data';
import { Loja, Produto, Pedido, StatusPedido } from '@ajulabs/types';
export { matchAju } from "./consumer/aju";

declare const process: { env: Record<string, string | undefined> };
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';


const delay = (ms = 600) => new Promise(res => setTimeout(res, ms));


export const LojaService = {
  listar: async (): Promise<Loja[]> => {
    await delay();
    return getLojasAbertas();
  },

  buscarPorCategoria: async (categoria: string): Promise<Loja[]> => {
    await delay(400);
    return getLojasByCategoria(categoria);
  },

  buscarPorId: async (id: string): Promise<Loja | null> => {
    await delay(300);
    return getLojaById(id) ?? null;
  },

  buscar: async (termo: string): Promise<Loja[]> => {
    await delay(400);
    const t = termo.toLowerCase();
    return LOJAS.filter(l =>
      l.nome.toLowerCase().includes(t) ||
      l.descricao.toLowerCase().includes(t) ||
      l.categoria.toLowerCase().includes(t)
    );
  },
};



export const ProdutoService = {
  listarPorLoja: async (lojaId: string): Promise<Produto[]> => {
    await delay(400);
    return getProdutosByLoja(lojaId);
  },

  buscarDestaqesPorLoja: async (lojaId: string): Promise<Produto[]> => {
    await delay(300);
    return getProdutosByLoja(lojaId).filter(p => p.destaque);
  },
};



export const PedidoService = {
  listar: async (): Promise<Pedido[]> => {
    await delay(500);
    return PEDIDOS_MOCK;
  },

  buscarPorId: async (id: string): Promise<Pedido | null> => {
    await delay(300);
    return PEDIDOS_MOCK.find(p => p.id === id) ?? null;
  },

  atualizarStatus: async (id: string, status: StatusPedido): Promise<Pedido | null> => {
    await delay(400);
    const pedido = PEDIDOS_MOCK.find(p => p.id === id);
    if (!pedido) return null;
    pedido.status = status;
    pedido.atualizadoEm = new Date().toISOString();
    return pedido;
  },
};



export const TranscricaoService = {

  transcrever: async (audioUri: string): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', { uri: audioUri, type: 'audio/m4a', name: 'audio.m4a' } as any);

    const res = await fetch(`${API_URL}chat/transcricao`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('Erro na transcrição');
    const data = await res.json();
    return data.texto;
  },
};