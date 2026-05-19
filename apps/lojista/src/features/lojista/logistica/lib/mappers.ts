import type { EntregaDisplay } from '../model/types';

export function mapPedidoToEntrega(pedido: any, status: 'andamento' | 'concluida'): EntregaDisplay {
  const shortId = `#SD-${pedido.id.slice(-4).toUpperCase()}`;
  const end = pedido.enderecoEntrega;
  const enderecoStr = end
    ? `${end.rua}${end.numero ? ', ' + end.numero : ''} — ${end.bairro}`
    : 'Endereço não informado';

  return {
    id: pedido.id,
    pedidoId: shortId,
    cliente: (pedido.consumidor?.nome ?? 'Cliente').split(' ')[0],
    clienteTelefone: pedido.consumidor?.telefone,
    endereco: enderecoStr,
    motoboy: pedido.entregador?.nome ?? 'Aguardando motoboy',
    motoboyTelefone: pedido.entregador?.telefone,
    placa: pedido.entregador?.veiculo?.placa ?? '---',
    status,
    statusRaw: pedido.status,
    hora: new Date(pedido.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
}
