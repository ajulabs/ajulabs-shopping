export type Period = 'dia' | 'mes';

export interface DashboardPeriodo {
  pedidos: number;
  faturamento: number;
}

export interface ProdutoMaisVendido {
  produtoId: string;
  nome: string;
  totalVendido: number;
}

export interface DashboardData {
  hoje: DashboardPeriodo;
  mes: DashboardPeriodo;
  pedidosPorStatus: Record<string, number>;
  totalProdutosAtivos: number;
  produtosMaisVendidos: ProdutoMaisVendido[];
}
