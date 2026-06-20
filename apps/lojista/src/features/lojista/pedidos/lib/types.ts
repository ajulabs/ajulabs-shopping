export type OrderStatus = 'novo' | 'preparando' | 'pronto' | 'despachado';

export interface OrderItem {
  nome: string;
  qtd: number;
  preco: number;
}

export interface Order {
  id: string;
  _id?: string;
  status: OrderStatus;
  cliente: string;
  endereco: string;
  distancia: string;
  hora: string;
  itens: OrderItem[];
  obs?: string;
  total: number;
  motoboy?: string;
  entregadorId?: string;
  entregadorNome?: string;
}
