export interface EntregaDisplay {
  id: string;
  pedidoId: string;
  cliente: string;
  clienteTelefone?: string;
  clienteAvatarUrl?: string | null;
  endereco: string;
  motoboy: string;
  motoboyTelefone?: string;
  motoboyFotoUrl?: string | null;
  placa: string;
  status: 'andamento' | 'concluida';
  statusRaw: string;
  hora: string;
}
