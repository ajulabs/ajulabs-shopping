import { Loja, Produto, Pedido, EnderecoSalvo } from '@ajulabs/types';
export { matchAju } from "./consumer/aju";

declare const process: { env: Record<string, string | undefined> };
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

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
    categoria: raw.categoria ?? '',
    disponivel: raw.disponivel ?? true,
    destaque: raw.destaque ?? false,
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
    enderecoEntrega: raw.enderecoEntrega ?? { rua: '', numero: '', bairro: '', cidade: '', cep: '' },
    subtotal: Number(raw.subtotal ?? 0),
    taxaEntrega: Number(raw.taxaEntrega ?? 0),
    total: Number(raw.total ?? 0),
    criadoEm: raw.criadoEm,
    atualizadoEm: raw.atualizadoEm,
    estimativaEntrega: raw.estimativaEntrega ?? undefined,
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
      .filter((l: any) =>
        l.nome?.toLowerCase().includes(t) ||
        l.descricao?.toLowerCase().includes(t) ||
        l.categoria?.toLowerCase().includes(t)
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
};

export const PedidoService = {
  listar: async (token: string): Promise<Pedido[]> => {
    const res = await fetch(`${API_URL}/pedidos`, {
      headers: authHeader(token),
    });
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

  criar: async (
    token: string,
    dados: {
      lojaId: string;
      enderecoEntregaId: string;
      metodoPagamento: 'pix' | 'cartao';
      itens: { produtoId: string; quantidade: number }[];
      obs?: string;
    }
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
  listarPedidos: async (
    lojaId: string,
    token: string,
    status?: string,
  ): Promise<any[]> => {
    const url = status
      ? `${API_URL}/lojista/lojas/${lojaId}/pedidos?status=${encodeURIComponent(status)}`
      : `${API_URL}/lojista/lojas/${lojaId}/pedidos`;
    const res = await fetch(url, { headers: authHeader(token) });
    if (!res.ok) return [];
    const { pedidos } = await res.json();
    return pedidos ?? [];
  },

  avancarStatus: async (pedidoId: string, token: string): Promise<void> => {
    await fetch(`${API_URL}/lojista/pedidos/${pedidoId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    });
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
    const blob = await fetch(imageUri).then(r => r.blob());
    form.append(tipo, blob, `${tipo}.jpg`);
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
    },
  ): Promise<void> => {
    const res = await fetch(`${API_URL}/lojista/produtos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(dados),
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
    if (dados.imageUri) {
      const blob = await fetch(dados.imageUri).then(r => r.blob());
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
    const blob = await fetch(imageUri).then(r => r.blob());
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

  buscarEntregas: async (
    lojaId: string,
    token: string,
  ): Promise<{ emAndamento: any[]; concluidas: any[] }> => {
    const [andamento, concluidas] = await Promise.all([
      (async () => {
        const r = await fetch(`${API_URL}/lojista/lojas/${lojaId}/pedidos?status=saiu_entrega&limit=10`, { headers: authHeader(token) });
        if (!r.ok) return [];
        const { pedidos } = await r.json();
        return pedidos ?? [];
      })(),
      (async () => {
        const r = await fetch(`${API_URL}/lojista/lojas/${lojaId}/pedidos?status=entregue&limit=20`, { headers: authHeader(token) });
        if (!r.ok) return [];
        const { pedidos } = await r.json();
        return pedidos ?? [];
      })(),
    ]);
    return { emAndamento: andamento, concluidas };
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

  buscarCorridasDisponiveis: async (token: string): Promise<any[]> => {
    const res = await fetch(`${API_URL}/entregador/corridas/disponivel`, {
      headers: authHeader(token),
    });
    if (!res.ok) return [];
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
      throw new Error(typeof err.error === 'string' ? err.error : 'Corrida não disponível');
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
      throw new Error(typeof err.error === 'string' ? err.error : 'Erro ao atualizar status da corrida');
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
};

function mapEndereco(e: any): EnderecoSalvo {
  return {
    id: e.id,
    apelido: e.apelido ?? 'Endereço',
    rua: e.numero ? `${e.rua}, ${e.numero}` : e.rua,
    bairro: e.cidade ? `${e.bairro}, ${e.cidade}` : e.bairro,
    cep: e.cep,
    padrao: e.padrao ?? false,
  };
}

export const EnderecoService = {
  listar: async (token: string): Promise<EnderecoSalvo[]> => {
    const res = await fetch(`${API_URL}/enderecos`, { headers: authHeader(token) });
    if (!res.ok) return [];
    const { enderecos } = await res.json();
    return (enderecos ?? []).map(mapEndereco);
  },

  criar: async (
    token: string,
    dados: { apelido: string; rua: string; numero: string; bairro: string; cep: string; cidade: string; complemento?: string },
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
  transcrever: async (audioUri: string): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', { uri: audioUri, type: 'audio/m4a', name: 'audio.m4a' } as any);

    const res = await fetch(`${API_URL}/chat/transcricao`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('Erro na transcrição');
    const data = await res.json();
    return data.texto;
  },
};
