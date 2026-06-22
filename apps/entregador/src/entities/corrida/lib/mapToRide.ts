import type { Ride } from '../model/types';

/**
 * Normaliza a corrida crua do backend para o modelo `Ride` consumido pelas
 * telas. Aceita tanto o payload com `consumidor` quanto o com `cliente`, e cai
 * para valores neutros quando endereço/coordenadas ainda não vieram.
 */
export function mapToRide(raw: any): Ride {
  return {
    id: raw.id,
    loja: {
      nome: raw.loja?.nome ?? '–',
      logoUrl: raw.loja?.logoUrl ?? undefined,
      endereco: raw.loja?.endereco ? `${raw.loja.endereco.rua}, ${raw.loja.endereco.numero}` : '–',
      bairro: raw.loja?.endereco?.bairro ?? '–',
      cep: raw.loja?.endereco?.cep ?? undefined,
      lat: raw.loja?.endereco?.lat ?? undefined,
      lng: raw.loja?.endereco?.lng ?? undefined,
    },
    cliente: {
      nome: raw.consumidor?.nome ?? raw.cliente?.nome ?? 'Cliente',
      telefone: raw.consumidor?.telefone ?? raw.cliente?.telefone ?? undefined,
      endereco: raw.enderecoEntrega
        ? `${raw.enderecoEntrega.rua}, ${raw.enderecoEntrega.numero}`
        : '–',
      bairro: raw.enderecoEntrega?.bairro ?? '–',
      complemento: raw.enderecoEntrega?.complemento ?? undefined,
      cep: raw.enderecoEntrega?.cep ?? undefined,
      lat: raw.enderecoEntrega?.lat ?? undefined,
      lng: raw.enderecoEntrega?.lng ?? undefined,
    },
    ganho: Number(raw.taxaEntrega ?? 0),
    distancia: Number(raw.distanciaKm ?? raw.distancia ?? 0),
    duracao: Number(raw.duracaoMin ?? raw.duracao ?? 20),
    codigo: raw.codigoEntrega ?? raw.id.slice(-4).toUpperCase(),
  };
}
