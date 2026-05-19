export interface EntregaDisplay {
  id: string;
  pedidoId: string;
  cliente: string;
  clienteTelefone?: string;
  endereco: string;
  motoboy: string;
  motoboyTelefone?: string;
  placa: string;
  status: 'andamento' | 'concluida';
  statusRaw: string;
  hora: string;
}
