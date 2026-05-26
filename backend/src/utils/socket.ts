import { Server } from 'socket.io';
import type http from 'http';
import { socketCorsOptions } from './cors';
import { prisma } from './prisma';

let io: Server | null = null;

const _localizacoes = new Map<
  string,
  {
    lat: number;
    lng: number;
    consumidorId: string;
    lojaId?: string;
    heading?: number;
    speedKmh?: number;
    ts: number;
  }
>();

export function setEntregadorLocalizacao(
  pedidoId: string,
  lat: number,
  lng: number,
  consumidorId: string,
  lojaId?: string,
  heading?: number,
  speedKmh?: number,
): void {
  _localizacoes.set(pedidoId, {
    lat,
    lng,
    consumidorId,
    lojaId,
    heading,
    speedKmh,
    ts: Date.now(),
  });
  const payload = { pedidoId, lat, lng, heading, speedKmh };
  try {
    getIo().to(`usuario:${consumidorId}`).emit('localizacao:entregador', payload);
    if (lojaId) getIo().to(`loja:${lojaId}`).emit('localizacao:entregador', payload);
  } catch {
    /* intentional */
  }
}

export function getEntregadorLocalizacao(
  pedidoId: string,
): { lat: number; lng: number; heading?: number; speedKmh?: number; ts: number } | null {
  const loc = _localizacoes.get(pedidoId);
  if (!loc) return null;
  return { lat: loc.lat, lng: loc.lng, heading: loc.heading, speedKmh: loc.speedKmh, ts: loc.ts };
}

export function initSocket(server: http.Server): Server {
  io = new Server(server, {
    cors: socketCorsOptions,
  });

  io.on('connection', (socket) => {
    socket.on('entregador:join', (entregadorId: string) => {
      void socket.join(`entregador:${entregadorId}`);
      void socket.join('entregadores');
    });

    socket.on('usuario:join', (usuarioId: string) => {
      void socket.join(`usuario:${usuarioId}`);
    });

    socket.on('lojista:join', (lojaId: string) => {
      void socket.join(`loja:${lojaId}`);
    });

    socket.on(
      'localizacao:update',
      async (payload: {
        pedidoId: string;
        lat: number;
        lng: number;
        heading?: number;
        speedKmh?: number;
      }) => {
        const existing = _localizacoes.get(payload.pedidoId);
        if (existing) {
          setEntregadorLocalizacao(
            payload.pedidoId,
            payload.lat,
            payload.lng,
            existing.consumidorId,
            existing.lojaId,
            payload.heading,
            payload.speedKmh,
          );
          return;
        }

        // First update: look up consumidorId and lojaId from DB
        try {
          const pedido = await prisma.pedido.findUnique({
            where: { id: payload.pedidoId },
            select: { consumidorId: true, lojaId: true },
          });
          if (pedido) {
            setEntregadorLocalizacao(
              payload.pedidoId,
              payload.lat,
              payload.lng,
              pedido.consumidorId,
              pedido.lojaId,
              payload.heading,
              payload.speedKmh,
            );
          }
        } catch {
          /* intentional */
        }
      },
    );
  });

  return io;
}

export function getIo(): Server {
  if (!io) throw new Error('Socket.IO não inicializado');
  return io;
}

export function emitPedidoNovo(lojaId: string, payload: object): void {
  try {
    getIo().to(`loja:${lojaId}`).emit('pedido:novo', payload);
  } catch {
    /* intentional */
  }
}

export function emitPedidoAtualizado(
  consumidorId: string,
  pedidoId: string,
  status: string,
  lojaId?: string,
): void {
  try {
    const io = getIo();
    io.to(`usuario:${consumidorId}`).emit('pedido:atualizado', { pedidoId, status });
    if (lojaId) io.to(`loja:${lojaId}`).emit('pedido:atualizado', { pedidoId, status });
  } catch {
    /* intentional */
  }
}

export function emitCorridaOferta(payload: object): void {
  try {
    getIo().to('entregadores').emit('corrida:oferta', payload);
  } catch {
    /* intentional */
  }
}

export function emitTicketMensagem(
  consumidorId: string,
  lojaId: string | null,
  mensagem: object,
  remetente: 'consumidor' | 'lojista',
): void {
  try {
    const io = getIo();
    if (remetente === 'consumidor' && lojaId) {
      io.to(`loja:${lojaId}`).emit('ticket:mensagem', mensagem);
    } else {
      io.to(`usuario:${consumidorId}`).emit('ticket:mensagem', mensagem);
    }
  } catch {
    /* intentional */
  }
}

export function emitTicketStatus(consumidorId: string, ticketId: string, status: string): void {
  try {
    getIo().to(`usuario:${consumidorId}`).emit('ticket:status', { ticketId, status });
  } catch {
    /* intentional */
  }
}

export function emitTicketNovo(lojaId: string, payload: object): void {
  try {
    getIo().to(`loja:${lojaId}`).emit('ticket:novo', payload);
  } catch {
    /* intentional */
  }
}

export function emitChatMensagem(
  destinatarioType: 'CONSUMER' | 'LOJISTA' | 'ENTREGADOR',
  destinatarioId: string,
  payload: object,
): void {
  try {
    const io = getIo();
    if (destinatarioType === 'CONSUMER') {
      io.to(`usuario:${destinatarioId}`).emit('chat:mensagem:nova', payload);
    } else if (destinatarioType === 'LOJISTA') {
      io.to(`loja:${destinatarioId}`).emit('chat:mensagem:nova', payload);
    } else {
      io.to(`entregador:${destinatarioId}`).emit('chat:mensagem:nova', payload);
    }
  } catch {
    /* intentional */
  }
}

export function emitProdutoVariacoes(lojaId: string, produtoId: string, variacoes: object[]): void {
  try {
    getIo().to(`loja:${lojaId}`).emit('produto:variacoes', { produtoId, variacoes });
  } catch {
    /* intentional */
  }
}
