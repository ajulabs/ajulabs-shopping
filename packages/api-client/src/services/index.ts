import {
  LOJAS, PRODUTOS, PEDIDOS_MOCK,
  getProdutosByLoja, getLojaById,
  getLojasAbertas, getLojasByCategoria,
} from '../mock/mock-data';
import { Loja, Produto, Pedido, StatusPedido } from '@ajulabs/types';
export { matchAju } from "./consumer/aju";


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
    try {
      const formData = new FormData();
      
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any);
      
      formData.append('model', 'whisper-1');
      formData.append('language', 'pt');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          // @ts-ignore
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erro na transcrição');
      }

      const data = await response.json();
      return data.text;
      
    } catch (error) {
      console.error('Erro ao transcrever áudio:', error);
      throw error;
    }
  },
};