import {
  Loja,
  Produto,
  Pedido,
  EnderecoSalvo,
  EntregadorResumo,
  AvaliacaoLoja,
  VariacaoProduto,
} from '@ajulabs/types';
export { matchAju, registrarCliqueSugestao } from './consumer/aju';

export class ApiUnauthorizedError extends Error {
  status = 401 as const;
  constructor() {
    super('Sessão expirada. Faça login novamente.');
    this.name = 'ApiUnauthorizedError';
  }
}

declare const process: { env: Record<string, string | undefined> };
const API_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function mapLoja(raw: any): Loja {
  return {
    id: raw.id,
    nome: raw.nome,
    descricao: raw.descricao,
    categoria: raw.categoria,
    imagem: raw.logoUrl ?? raw.bannerUrl ?? '',
    logo: raw.logoUrl ?? undefined,
    endereco: raw.endereco ?? { rua: '', numero: '', bairro: '', cidade: '', cep: '' },
    avaliacao: Number(raw.avaliacao ?? 0),
    totalAvaliacoes: raw.totalAvaliacoes ?? 0,
    tempoEntregaMin: raw.tempoEntregaMin ?? 0,
    tempoEntregaMax: raw.tempoEntregaMax ?? 0,
    taxaEntrega: Number(raw.taxaEntrega ?? 0),
    aberta: raw.aberta ?? true,
    destaque: raw.destaque ?? false,
  };
}

function mapProduto(raw: any): Produto {
  return {
    id: raw.id,
    lojaId: raw.lojaId,
    nome: raw.nome,
    descricao: raw.descricao,
    preco: Number(raw.preco ?? 0),
    imagem: raw.imagemUrl ?? '',
    imagens: (() => {
      const f = (Array.isArray(raw.imagens) ? raw.imagens : []).filter(Boolean);
      return f.length ? f : raw.imagemUrl ? [raw.imagemUrl] : [];
    })(),
    categoria: raw.categoria ?? '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    disponivel: raw.disponivel ?? true,
    estoque: raw.estoque != null ? Number(raw.estoque) : undefined,
    destaque: raw.destaque ?? false,
    variacoes: Array.isArray(raw.variacoes)
      ? raw.variacoes.map(
          (v: any): VariacaoProduto => ({
            id: v.id,
            produtoId: v.produtoId ?? raw.id,
            nome: v.nome,
            estoque: Number(v.estoque ?? 0),
          }),
        )
      : undefined,
  };
}

function mapPedido(raw: any): Pedido {
  return {
    id: raw.id,
    lojaId: raw.lojaId,
    lojaNome: raw.loja?.nome ?? '',
    consumidorId: raw.consumidorId,
    itens: (raw.itens ?? []).map((item: any) => ({
      produto: {
        id: item.produtoId,
        lojaId: raw.lojaId,
        nome: item.nomeSnapshot,
        descricao: '',
        preco: Number(item.precoUnitario ?? 0),
        imagem: '',
        categoria: '',
        disponivel: true,
      },
      quantidade: item.quantidade,
      precoUnitario: Number(item.precoUnitario ?? 0),
    })),
    status: raw.status,
    enderecoEntrega: raw.enderecoEntrega ?? {
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      cep: '',
    },
    subtotal: Number(raw.subtotal ?? 0),
    taxaEntrega: Number(raw.taxaEntrega ?? 0),
    total: Number(raw.total ?? 0),
    criadoEm: raw.criadoEm,
    atualizadoEm: raw.atualizadoEm,
    estimativaEntrega: raw.estimativaEntrega ?? undefined,
    codigoEntrega: raw.codigoEntrega ?? undefined,
    entregador: raw.entregador
      ? ({
          id: raw.entregador.id,
          nome: raw.entregador.nome,
          fotoUrl: raw.entregador.fotoUrl ?? null,
          tipoTransporte: raw.entregador.tipoTransporte ?? '',
        } as EntregadorResumo)
      : null,
  };
}

export const LojaService = {
  listar: async (): Promise<Loja[]> => {
    const res = await fetch(`${API_URL}/lojas`);
    if (!res.ok) throw new Error('Erro ao buscar lojas');
    const { lojas } = await res.json();
    return lojas.map(mapLoja);
  },

  buscarPorCategoria: async (categoria: string): Promise<Loja[]> => {
    const res = await fetch(`${API_URL}/lojas?categoria=${encodeURIComponent(categoria)}`);
    if (!res.ok) throw new Error('Erro ao buscar lojas');
    const { lojas } = await res.json();
    return lojas.map(mapLoja);
  },

  buscarPorId: async (id: string): Promise<Loja | null> => {
    const res = await fetch(`${API_URL}/lojas/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    return mapLoja(data.loja ?? data);
  },

  buscar: async (termo: string): Promise<Loja[]> => {
    const res = await fetch(`${API_URL}/lojas`);
    if (!res.ok) throw new Error('Erro ao buscar lojas');
    const { lojas } = await res.json();
    const t = termo.toLowerCase();
    return lojas
      .filter(
        (l: any) =>
          l.nome?.toLowerCase().includes(t) ||
          l.descricao?.toLowerCase().includes(t) ||
          l.categoria?.toLowerCase().includes(t),
      )
      .map(mapLoja);
  },
};

export const ProdutoService = {
  listarPorLoja: async (lojaId: string): Promise<Produto[]> => {
    const res = await fetch(`${API_URL}/lojas/${lojaId}/produtos`);
    if (!res.ok) throw new Error('Erro ao buscar produtos');
    const data = await res.json();
    const lista = data.produtos ?? data;
    return lista.map(mapProduto);
  },

  buscarDestaqesPorLoja: async (lojaId: string): Promise<Produto[]> => {
    const res = await fetch(`${API_URL}/lojas/${lojaId}/produtos`);
    if (!res.ok) throw new Error('Erro ao buscar produtos');
    const data = await res.json();
    const lista = data.produtos ?? data;
    return lista.filter((p: any) => p.destaque).map(mapProduto);
  },

  buscarPorId: async (id: string): Promise<Produto | null> => {
    const res = await fetch(`${API_URL}/produtos/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    return mapProduto(data.produto ?? data);
  },
};

export const FavoritoLojaService = {
  listar: async (token: string): Promise<Loja[]> => {
    const res = await fetch(`${API_URL}/favoritos/lojas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const { lojas } = await res.json();
    return (lojas ?? []).map(mapLoja);
  },

  checar: async (lojaId: string, token: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/favoritos/lojas/${lojaId}/check`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const { favoritado } = await res.json();
    return !!favoritado;
  },

  favoritar: async (lojaId: string, token: string): Promise<void> => {
    await fetch(`${API_URL}/favoritos/lojas/${lojaId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  desfavoritar: async (lojaId: string, token: string): Promise<void> => {
    await fetch(`${API_URL}/favoritos/lojas/${lojaId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export const AvaliacaoService = {
  listarPorLoja: async (lojaId: string): Promise<AvaliacaoLoja[]> => {
    const res = await fetch(`${API_URL}/avaliacoes/loja/${lojaId}`);
    if (!res.ok) return [];
    const { avaliacoes } = await res.json();
    return (avaliacoes ?? []).map(
      (a: any): AvaliacaoLoja => ({
        id: a.id,
        lojaId: a.lojaId,
        usuarioId: a.usuarioId,
        pedidoId: a.pedidoId,
        nota: a.nota,
        comentario: a.comentario ?? null,
        criadoEm: a.criadoEm,
        usuario: {
          id: a.usuario?.id ?? '',
          nome: a.usuario?.nome ?? 'Usuário',
          avatarUrl: a.usuario?.avatarUrl ?? null,
        },
      }),
    );
  },
};

export const FavoritoService = {
  listar: async (token: string): Promise<Produto[]> => {
    const res = await fetch(`${API_URL}/favoritos/produtos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const { produtos } = await res.json();
    return (produtos ?? []).map(mapProduto);
  },

  checar: async (produtoId: string, token: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/favoritos/produtos/${produtoId}/check`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const { favoritado } = await res.json();
    return !!favoritado;
  },

  favoritar: async (produtoId: string, token: string): Promise<void> => {
    await fetch(`${API_URL}/favoritos/produtos/${produtoId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  desfavoritar: async (produtoId: string, token: string): Promise<void> => {
    await fetch(`${API_URL}/favoritos/produtos/${produtoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export const PedidoService = {
  listar: async (token: string): Promise<Pedido[]> => {
    const res = await fetch(`${API_URL}/pedidos`, {
      headers: authHeader(token),
    });
    if (res.status === 401) throw new ApiUnauthorizedError();
    if (!res.ok) throw new Error('Erro ao buscar pedidos');
    const { pedidos } = await res.json();
    return pedidos.map(mapPedido);
  },

  buscarPorId: async (id: string, token: string): Promise<Pedido | null> => {
    const res = await fetch(`${API_URL}/pedidos/${id}`, {
      headers: authHeader(token),
    });
    if (!res.ok) return null;
    const { pedido } = await res.json();
    return mapPedido(pedido);
  },

  buscarLocalizacaoEntregador: async (
    pedidoId: string,
    token: string,
  ): Promise<{ lat: number; lng: number } | null> => {
    const res = await fetch(`${API_URL}/pedidos/${pedidoId}/localizacao-entregador`, {
      headers: authHeader(token),
    });
    if (!res.ok) return null;
    const { localizacao } = await res.json();
    return localizacao ?? null;
  },

  criar: async (
    token: string,
    dados: {
      lojaId: string;
      enderecoEntregaId: string;
      metodoPagamento: 'pix' | 'cartao';
      itens: { produtoId: string; quantidade: number }[];
      obs?: string;
    },
  ): Promise<Pedido> => {
    const res = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(dados),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao criar pedido');
    }
    const { pedido } = await res.json();
    return mapPedido(pedido);
  },
};

export const LojistaService = {
  listarPedidos: async (lojaId: string, token: string, status?: string): Promise<any[]> => {
    const url = status
      ? `${API_URL}/lojista/lojas/${lojaId}/pedidos?status=${encodeURIComponent(status)}`
      : `${API_URL}/lojista/lojas/${lojaId}/pedidos`;
    const res = await fetch(url, { headers: authHeader(token) });
    if (res.status === 401) throw new ApiUnauthorizedError();
    if (!res.ok) throw new Error(`Erro ao buscar pedidos (${res.status})`);
    const { pedidos } = await res.json();
    return pedidos ?? [];
  },

  avancarStatus: async (pedidoId: string, token: string): Promise<void> => {
    const res = await fetch(`${API_URL}/lojista/pedidos/${pedidoId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = typeof err.error === 'string' ? err.error : 'Erro ao avançar status';
      console.error(`[LojistaService] avancarStatus ${pedidoId} → ${res.status}: ${msg}`);
      throw new Error(msg);
    }
  },

  buscarDashboard: async (
    lojaId: string,
    token: string,
  ): Promise<{ hoje: any; mes: any } | null> => {
    const res = await fetch(`${API_URL}/lojista/lojas/${lojaId}/dashboard`, {
      headers: authHeader(token),
    });
    if (!res.ok) return null;
    return res.json();
  },

  buscarLojaDetalhes: async (lojaId: string, token: string): Promise<any | null> => {
    const res = await fetch(`${API_URL}/lojista/lojas/${lojaId}`, {
      headers: authHeader(token),
    });
    if (!res.ok) return null;
    const { loja } = await res.json();
    return loja;
  },

  atualizarLoja: async (
    lojaId: string,
    token: string,
    dados: {
      nome?: string;
      descricao?: string;
      categoria?: string;
      telefone?: string;
      aceitaAgendamento?: boolean;
      antecedenciaMinima?: number;
      horarios?: {
        diaSemana: number;
        ativo: boolean;
        abertura: string;
        fechamento: string;
      }[];
      endereco?: {
        rua: string;
        numero?: string;
        complemento?: string;
        bairro: string;
        cep: string;
        cidade: string;
      };
    },
  ): Promise<void> => {
    const res = await fetch(`${API_URL}/lojista/lojas/${lojaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(dados),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao atualizar loja');
    }
  },

  atualizarImagemLoja: async (
    lojaId: string,
    token: string,
    tipo: 'logo' | 'banner',
    imageUri: string,
  ): Promise<void> => {
    const form = new FormData();
    // blob:/data: URIs (Expo web) precisam de fetch→blob; file:/content: (native) usam { uri, type, name }
    if (imageUri.startsWith('blob:') || imageUri.startsWith('data:')) {
      const blob = await fetch(imageUri).then((r) => r.blob());
      form.append(tipo, blob, `${tipo}.jpg`);
    } else {
      form.append(tipo, { uri: imageUri, type: 'image/jpeg', name: `${tipo}.jpg` } as any);
    }
    const res = await fetch(`${API_URL}/lojista/lojas/${lojaId}/imagem`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : `Erro ao atualizar ${tipo}`);
    }
  },

  excluirProduto: async (id: string, token: string): Promise<void> => {
    const res = await fetch(`${API_URL}/lojista/produtos/${id}`, {
      method: 'DELETE',
      headers: authHeader(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao excluir produto');
    }
  },

  editarProduto: async (
    id: string,
    token: string,
    dados: {
      nome?: string;
      descricao?: string;
      preco?: number;
      estoque?: number;
      categoria?: string;
      disponivel?: boolean;
      existingImageUrls?: string[];
      newImageUris?: string[];
      variacoes?: { nome: string; estoque: number }[];
    },
  ): Promise<void> => {
    const { newImageUris = [], existingImageUrls = [], variacoes, ...rest } = dados;

    const form = new FormData();
    if (rest.nome !== undefined) form.append('nome', rest.nome);
    if (rest.descricao !== undefined) form.append('descricao', rest.descricao);
    if (rest.categoria !== undefined) form.append('categoria', rest.categoria);
    if (rest.preco !== undefined) form.append('preco', String(rest.preco));
    if (rest.estoque !== undefined) form.append('estoque', String(rest.estoque));
    if (rest.disponivel !== undefined) form.append('disponivel', String(rest.disponivel));
    if (variacoes !== undefined) form.append('variacoes', JSON.stringify(variacoes));
    form.append('imagensExistentes', JSON.stringify(existingImageUrls));

    for (let i = 0; i < newImageUris.length; i++) {
      const uri = newImageUris[i];
      if (uri.startsWith('blob:') || uri.startsWith('data:')) {
        const blob = await fetch(uri).then((r) => r.blob());
        form.append('imagens', blob, `imagem_${i}.jpg`);
      } else {
        form.append('imagens', { uri, type: 'image/jpeg', name: `imagem_${i}.jpg` } as any);
      }
    }

    const res = await fetch(`${API_URL}/lojista/produtos/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao editar produto');
    }
  },

  listarProdutos: async (lojaId: string, token: string): Promise<Produto[]> => {
    const res = await fetch(`${API_URL}/lojista/produtos?lojaId=${lojaId}`, {
      headers: authHeader(token),
    });
    if (!res.ok) return [];
    const { produtos } = await res.json();
    return (produtos ?? []).map(mapProduto);
  },

  criarProduto: async (
    token: string,
    dados: {
      lojaId: string;
      nome: string;
      descricao: string;
      preco: number;
      estoque: number;
      categoria: string;
      tags: string[];
      imageUri?: string;
      variacoes?: { nome: string; estoque: number }[];
    },
  ): Promise<any> => {
    const formData = new FormData();
    formData.append('lojaId', dados.lojaId);
    formData.append('nome', dados.nome);
    formData.append('descricao', dados.descricao);
    formData.append('preco', String(dados.preco));
    formData.append('estoque', String(dados.estoque));
    formData.append('categoria', dados.categoria);
    formData.append('tags', JSON.stringify(dados.tags));
    if (dados.variacoes?.length) {
      formData.append('variacoes', JSON.stringify(dados.variacoes));
    }
    if (dados.imageUri) {
      const blob = await fetch(dados.imageUri).then((r) => r.blob());
      formData.append('imagem', blob, 'produto.jpg');
    }
    const res = await fetch(`${API_URL}/lojista/produtos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao criar produto');
    }
    const { produto } = await res.json();
    return produto;
  },

  analisarImagem: async (token: string, imageUri: string): Promise<any> => {
    const formData = new FormData();
    const blob = await fetch(imageUri).then((r) => r.blob());
    formData.append('imagem', blob, 'produto.jpg');
    const res = await fetch(`${API_URL}/lojista/produtos/analisar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao analisar imagem');
    }
    return res.json();
  },

  buscarLocalizacaoEntregador: async (
    pedidoId: string,
    token: string,
  ): Promise<{ lat: number; lng: number; heading?: number; speedKmh?: number } | null> => {
    const res = await fetch(`${API_URL}/lojista/pedidos/${pedidoId}/localizacao-entregador`, {
      headers: authHeader(token),
    });
    if (!res.ok) return null;
    const { localizacao } = await res.json();
    return localizacao ?? null;
  },

  listarTickets: async (lojaId: string, token: string, status?: string): Promise<any[]> => {
    const url = status
      ? `${API_URL}/lojista/lojas/${lojaId}/tickets?status=${encodeURIComponent(status)}`
      : `${API_URL}/lojista/lojas/${lojaId}/tickets`;
    const res = await fetch(url, { headers: authHeader(token) });
    if (!res.ok) return [];
    const { tickets } = await res.json();
    return tickets ?? [];
  },

  buscarTicket: async (ticketId: string, token: string): Promise<any | null> => {
    const res = await fetch(`${API_URL}/lojista/tickets/${ticketId}`, {
      headers: authHeader(token),
    });
    if (!res.ok) return null;
    const { ticket } = await res.json();
    return ticket ?? null;
  },

  atualizarStatusTicket: async (ticketId: string, status: string, token: string): Promise<void> => {
    const res = await fetch(`${API_URL}/lojista/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao atualizar status');
    }
  },

  toggleUrgenteTicket: async (ticketId: string, urgente: boolean, token: string): Promise<void> => {
    const res = await fetch(`${API_URL}/lojista/tickets/${ticketId}/urgente`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ urgente }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao atualizar ticket');
    }
  },

  enviarMensagemTicket: async (ticketId: string, texto: string, token: string): Promise<any> => {
    const res = await fetch(`${API_URL}/lojista/tickets/${ticketId}/mensagens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ texto }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao enviar mensagem');
    }
    const { mensagem } = await res.json();
    return mensagem;
  },

  adicionarNotaTicket: async (ticketId: string, texto: string, token: string): Promise<any> => {
    const res = await fetch(`${API_URL}/lojista/tickets/${ticketId}/notas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ texto }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao adicionar nota');
    }
    const { nota } = await res.json();
    return nota;
  },

  buscarEntregas: async (
    lojaId: string,
    token: string,
  ): Promise<{ emAndamento: any[]; concluidas: any[] }> => {
    const [pronto, saiuEntrega, concluidas] = await Promise.all([
      (async () => {
        const r = await fetch(`${API_URL}/lojista/lojas/${lojaId}/pedidos?status=pronto&limit=10`, {
          headers: authHeader(token),
        });
        if (!r.ok) return [];
        const { pedidos } = await r.json();
        return (pedidos ?? []).filter((p: any) => p.entregador);
      })(),
      (async () => {
        const r = await fetch(
          `${API_URL}/lojista/lojas/${lojaId}/pedidos?status=saiu_entrega&limit=10`,
          { headers: authHeader(token) },
        );
        if (!r.ok) return [];
        const { pedidos } = await r.json();
        return pedidos ?? [];
      })(),
      (async () => {
        const r = await fetch(
          `${API_URL}/lojista/lojas/${lojaId}/pedidos?status=entregue&limit=20`,
          { headers: authHeader(token) },
        );
        if (!r.ok) return [];
        const { pedidos } = await r.json();
        return pedidos ?? [];
      })(),
    ]);
    return { emAndamento: [...pronto, ...saiuEntrega], concluidas };
  },
};

export const ConsumerTicketService = {
  listar: async (token: string, status?: string): Promise<any[]> => {
    const url = status
      ? `${API_URL}/tickets?status=${encodeURIComponent(status)}`
      : `${API_URL}/tickets`;
    const res = await fetch(url, { headers: authHeader(token) });
    if (!res.ok) return [];
    const { tickets } = await res.json();
    return tickets ?? [];
  },

  buscar: async (id: string, token: string): Promise<any | null> => {
    const res = await fetch(`${API_URL}/tickets/${id}`, { headers: authHeader(token) });
    if (!res.ok) return null;
    const { ticket } = await res.json();
    return ticket ?? null;
  },

  enviarMensagem: async (id: string, texto: string, token: string): Promise<any> => {
    const res = await fetch(`${API_URL}/tickets/${id}/mensagens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ texto }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao enviar mensagem');
    }
    const { mensagem } = await res.json();
    return mensagem;
  },

  cancelar: async (id: string, token: string): Promise<void> => {
    const res = await fetch(`${API_URL}/tickets/${id}`, {
      method: 'DELETE',
      headers: authHeader(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao cancelar ticket');
    }
  },

  avaliar: async (id: string, nota: number, token: string): Promise<void> => {
    const res = await fetch(`${API_URL}/tickets/${id}/avaliacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ nota }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao avaliar ticket');
    }
  },
};

export const EntregadorService = {
  atualizarOnline: async (token: string, online: boolean): Promise<void> => {
    const res = await fetch(`${API_URL}/entregador/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ online }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao atualizar status');
    }
  },

  /**
   * Envia um heartbeat com a última posição do entregador. Usado a cada
   * ~1 min pelo modo "online idle" do app (foreground service Android).
   * Best-effort: erros são silenciosos para não interromper o tracking.
   */
  heartbeat: async (token: string, lat: number, lng: number): Promise<void> => {
    await fetch(`${API_URL}/entregador/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ lat, lng }),
    }).catch(() => {});
  },

  buscarCorridasDisponiveis: async (token: string): Promise<any[]> => {
    const res = await fetch(`${API_URL}/entregador/corridas/disponivel`, {
      headers: authHeader(token),
    });
    if (!res.ok) return [];
    const { corridas } = await res.json();
    return corridas ?? [];
  },

  buscarCorridasAtivas: async (token: string): Promise<any[]> => {
    const res = await fetch(`${API_URL}/entregador/corridas/ativas`, {
      headers: authHeader(token),
    });
    if (res.status === 401) throw new ApiUnauthorizedError();
    if (!res.ok) throw new Error(`Erro ao buscar corridas ativas (${res.status})`);
    const { corridas } = await res.json();
    return corridas ?? [];
  },

  aceitarCorrida: async (token: string, pedidoId: string): Promise<any> => {
    const res = await fetch(`${API_URL}/entregador/corridas/${pedidoId}/aceitar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = typeof err.error === 'string' ? err.error : 'Corrida não disponível';
      console.error(`[EntregadorService] aceitarCorrida ${pedidoId} → ${res.status}: ${msg}`);
      throw new Error(msg);
    }
    const { pedido } = await res.json();
    return pedido;
  },

  rejeitarCorrida: async (token: string, pedidoId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/entregador/corridas/${pedidoId}/rejeitar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao rejeitar corrida');
    }
  },

  atualizarStatusCorrida: async (
    token: string,
    pedidoId: string,
    status: 'saiu_entrega' | 'entregue',
  ): Promise<void> => {
    const res = await fetch(`${API_URL}/entregador/corridas/${pedidoId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        typeof err.error === 'string' ? err.error : 'Erro ao atualizar status da corrida',
      );
    }
  },

  buscarPerfil: async (token: string): Promise<any | null> => {
    const res = await fetch(`${API_URL}/entregador/perfil`, {
      headers: authHeader(token),
    });
    if (!res.ok) return null;
    return res.json();
  },

  buscarGanhos: async (token: string): Promise<any | null> => {
    const res = await fetch(`${API_URL}/entregador/ganhos`, {
      headers: authHeader(token),
    });
    if (!res.ok) return null;
    return res.json();
  },

  listarEntregas: async (token: string): Promise<any[]> => {
    const res = await fetch(`${API_URL}/entregador/entregas`, {
      headers: authHeader(token),
    });
    if (!res.ok) return [];
    const { entregas } = await res.json();
    return entregas ?? [];
  },

  uploadDocumentosIdentidade: async (
    token: string,
    frenteUri: string,
    versoUri: string,
  ): Promise<void> => {
    const [frenteBlob, versoBlob] = await Promise.all([
      fetch(frenteUri).then((r) => r.blob()),
      fetch(versoUri).then((r) => r.blob()),
    ]);
    const form = new FormData();
    form.append('frente', frenteBlob, 'frente.jpg');
    form.append('verso', versoBlob, 'verso.jpg');
    const res = await fetch(`${API_URL}/entregador/documentos/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao enviar documentos');
    }
  },

  atualizarFoto: async (token: string, imageUri: string): Promise<string> => {
    const blob = await fetch(imageUri).then((r) => r.blob());
    const form = new FormData();
    form.append('foto', blob, 'perfil.jpg');
    const res = await fetch(`${API_URL}/entregador/foto`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao atualizar foto');
    }
    const { fotoUrl } = await res.json();
    return fotoUrl;
  },

  cadastrarVeiculo: async (
    token: string,
    dados: { placa: string; modelo: string; cor: string; ano: number },
  ): Promise<void> => {
    const res = await fetch(`${API_URL}/entregador/veiculo`, {
      method: 'POST',
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao salvar veículo');
    }
  },

  atualizarDadosBancarios: async (
    token: string,
    dados: {
      tipo: 'pix' | 'conta';
      chavePix?: string;
      banco?: string;
      agencia?: string;
      conta?: string;
    },
  ): Promise<void> => {
    const res = await fetch(`${API_URL}/entregador/dados-bancarios`, {
      method: 'POST',
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao salvar dados bancários');
    }
  },

  atualizarDadosPessoais: async (
    token: string,
    dados: { nome?: string; email?: string; telefone?: string },
  ): Promise<void> => {
    const res = await fetch(`${API_URL}/entregador/dados-pessoais`, {
      method: 'PATCH',
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao atualizar dados');
    }
  },

  alterarSenha: async (token: string, senhaAtual: string, novaSenha: string): Promise<void> => {
    const res = await fetch(`${API_URL}/entregador/senha`, {
      method: 'PATCH',
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaAtual, novaSenha }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao alterar senha');
    }
  },

  buscarSolicitacaoTrocaVeiculo: async (token: string): Promise<any> => {
    const res = await fetch(`${API_URL}/entregador/veiculo/trocar`, {
      headers: authHeader(token),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return d.solicitacao ?? null;
  },

  solicitarTrocaVeiculo: async (
    token: string,
    dados: {
      tipoTransporte: 'bike' | 'moto' | 'carro';
      modelo: string;
      placa: string;
      cor: string;
      ano: number;
    },
    files?: { cnhUri?: string; docVeiculoUri?: string },
  ): Promise<{ status: 'aprovado' | 'pendente' }> => {
    const form = new FormData();
    form.append('tipoTransporte', dados.tipoTransporte);
    form.append('modelo', dados.modelo);
    form.append('placa', dados.placa);
    form.append('cor', dados.cor);
    form.append('ano', String(dados.ano));

    if (files?.cnhUri) {
      const ext = files.cnhUri.split('.').pop() ?? 'jpg';
      form.append('cnh', { uri: files.cnhUri, type: `image/${ext}`, name: `cnh.${ext}` } as any);
    }
    if (files?.docVeiculoUri) {
      const ext = files.docVeiculoUri.split('.').pop() ?? 'jpg';
      form.append('docVeiculo', {
        uri: files.docVeiculoUri,
        type: `image/${ext}`,
        name: `doc.${ext}`,
      } as any);
    }

    const res = await fetch(`${API_URL}/entregador/veiculo/trocar`, {
      method: 'POST',
      headers: { ...authHeader(token) },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao enviar solicitação');
    }
    return res.json();
  },

  confirmarRetirada: async (token: string, pedidoId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/entregador/corridas/${pedidoId}/confirmar-retirada`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = typeof err.error === 'string' ? err.error : 'Erro ao confirmar retirada';
      console.error(`[EntregadorService] confirmarRetirada ${pedidoId} → ${res.status}: ${msg}`);
      throw new Error(msg);
    }
  },

  enviarLocalizacao: async (
    token: string,
    pedidoId: string,
    lat: number,
    lng: number,
  ): Promise<void> => {
    await fetch(`${API_URL}/entregador/corridas/${pedidoId}/localizacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ lat, lng }),
    }).catch(() => {});
  },

  confirmarEntrega: async (token: string, pedidoId: string, codigo: string): Promise<void> => {
    const res = await fetch(`${API_URL}/entregador/corridas/${pedidoId}/confirmar-entrega`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ codigo }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = typeof err.error === 'string' ? err.error : 'Código incorreto';
      console.error(`[EntregadorService] confirmarEntrega ${pedidoId} → ${res.status}: ${msg}`);
      throw new Error(msg);
    }
  },
};

function mapEndereco(e: any): EnderecoSalvo {
  return {
    id: e.id,
    apelido: e.apelido ?? 'Endereço',
    rua: e.numero ? `${e.rua}, ${e.numero}` : e.rua,
    bairro: e.cidade ? `${e.bairro}, ${e.cidade}` : e.bairro,
    cep: e.cep,
    padrao: e.padrao ?? false,
    ruaRaw: e.rua,
    numero: e.numero,
    bairroRaw: e.bairro,
    cidade: e.cidade,
    complemento: e.complemento,
    lat: e.lat ?? null,
    lng: e.lng ?? null,
    geoSource: e.geoSource ?? null,
  };
}

// Redimensiona para 200x200 via Canvas (web only)
async function resizeParaDataUri(uri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img') as HTMLImageElement;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const SIZE = 200;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      canvas.getContext('2d')!.drawImage(img, 0, 0, SIZE, SIZE);
      resolve(canvas.toDataURL('image/jpeg', 0.65));
    };
    img.onerror = reject;
    img.src = uri;
  });
}

export const PerfilService = {
  atualizarAvatar: async (token: string, imageUri: string): Promise<string> => {
    // Web: redimensiona com Canvas e envia via PUT /perfil (não depende do novo endpoint)
    if (typeof document !== 'undefined') {
      const avatarUrl = await resizeParaDataUri(imageUri);
      const res = await fetch(`${API_URL}/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatarUrl }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === 'string' ? err.error : `HTTP ${res.status}`);
      }
      const { usuario } = await res.json();
      return usuario.avatarUrl;
    }

    // Native: envia via PATCH /perfil/avatar (requer backend atualizado)
    const form = new FormData();
    form.append('avatar', { uri: imageUri, type: 'image/jpeg', name: 'avatar.jpg' } as any);
    const res = await fetch(`${API_URL}/perfil/avatar`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.avatarUrl;
  },
};

export const EnderecoService = {
  listar: async (token: string): Promise<EnderecoSalvo[]> => {
    const res = await fetch(`${API_URL}/enderecos`, { headers: authHeader(token) });
    if (!res.ok) return [];
    const { enderecos } = await res.json();
    return (enderecos ?? []).map(mapEndereco);
  },

  criar: async (
    token: string,
    dados: {
      apelido: string;
      rua: string;
      numero: string;
      bairro: string;
      cep: string;
      cidade: string;
      complemento?: string;
      lat?: number;
      lng?: number;
      geoSource?: string;
    },
  ): Promise<EnderecoSalvo> => {
    const res = await fetch(`${API_URL}/enderecos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(dados),
    });
    if (!res.ok) throw new Error('Erro ao criar endereço');
    const { endereco } = await res.json();
    return mapEndereco(endereco);
  },

  atualizar: async (
    token: string,
    id: string,
    dados: {
      apelido?: string;
      rua?: string;
      numero?: string;
      bairro?: string;
      cep?: string;
      cidade?: string;
      complemento?: string;
      lat?: number;
      lng?: number;
      geoSource?: string;
    },
  ): Promise<EnderecoSalvo> => {
    const res = await fetch(`${API_URL}/enderecos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(dados),
    });
    if (!res.ok) throw new Error('Erro ao atualizar endereço');
    const { endereco } = await res.json();
    return mapEndereco(endereco);
  },

  remover: async (token: string, id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/enderecos/${id}`, {
      method: 'DELETE',
      headers: authHeader(token),
    });
    if (!res.ok) throw new Error('Erro ao remover endereço');
  },

  definirPadrao: async (token: string, id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/enderecos/${id}/padrao`, {
      method: 'PATCH',
      headers: authHeader(token),
    });
    if (!res.ok) throw new Error('Erro ao definir endereço padrão');
  },
};

export const TranscricaoService = {
  transcrever: async (audioUri: string, token: string): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', { uri: audioUri, type: 'audio/m4a', name: 'audio.m4a' } as any);

    const res = await fetch(`${API_URL}/chat/transcricao`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) throw new Error('Erro na transcrição');
    const data = await res.json();
    return data.texto;
  },
};

export const PushService = {
  register: async (
    token: string,
    payload: {
      expoToken: string;
      plataforma?: 'ios' | 'android' | 'web';
      appTipo?: 'consumer' | 'lojista' | 'entregador';
    },
  ): Promise<void> => {
    const res = await fetch(`${API_URL}/push/register`, {
      method: 'POST',
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Erro ao registrar dispositivo para push');
  },

  unregister: async (token: string, expoToken: string): Promise<void> => {
    const res = await fetch(`${API_URL}/push/unregister`, {
      method: 'POST',
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ expoToken }),
    });
    if (!res.ok) throw new Error('Erro ao desregistrar dispositivo de push');
  },
};

export interface NotificationPreference {
  categoria: string;
  label: string;
  descricao: string;
  ativo: boolean;
}

export const NotificationPreferencesService = {
  listar: async (token: string): Promise<NotificationPreference[]> => {
    const res = await fetch(`${API_URL}/notification-preferences`, {
      headers: authHeader(token),
    });
    if (!res.ok) throw new Error('Erro ao buscar preferências de notificação');
    const data = await res.json();
    return data.preferencias ?? [];
  },

  atualizar: async (token: string, categoria: string, ativo: boolean): Promise<void> => {
    const res = await fetch(`${API_URL}/notification-preferences`, {
      method: 'PUT',
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoria, ativo }),
    });
    if (!res.ok) throw new Error('Erro ao atualizar preferência de notificação');
  },
};

export const PedidoChatService = {
  buscarChat: async (pedidoId: string, token: string): Promise<any | null> => {
    const res = await fetch(`${API_URL}/pedido-chat/pedido/${pedidoId}`, {
      headers: authHeader(token),
    });
    if (!res.ok) return null;
    const { chat } = await res.json();
    return chat ?? null;
  },

  enviarMensagem: async (
    pedidoId: string,
    token: string,
    conteudo: string,
    destinatarioType: 'CONSUMER' | 'LOJISTA' | 'ENTREGADOR',
  ): Promise<any> => {
    const res = await fetch(`${API_URL}/pedido-chat/pedido/${pedidoId}/mensagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ conteudo, destinatarioType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = typeof err.error === 'string' ? err.error : 'Erro ao enviar mensagem';
      throw new Error(`[${res.status}] ${msg}`);
    }
    const { mensagem } = await res.json();
    return mensagem;
  },

  buscarHistorico: async (token: string): Promise<any[]> => {
    const res = await fetch(`${API_URL}/pedido-chat/historico`, {
      headers: authHeader(token),
    });
    if (!res.ok) return [];
    const { chats } = await res.json();
    return chats ?? [];
  },

  marcarLido: async (pedidoId: string, token: string): Promise<void> => {
    await fetch(`${API_URL}/pedido-chat/pedido/${pedidoId}/lido`, {
      method: 'PUT',
      headers: authHeader(token),
    }).catch(() => {});
  },
};
