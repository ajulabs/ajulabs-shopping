import { Server } from 'socket.io';
import type http from 'http';
import { prisma } from './prisma';

let io: Server | null = null;

const _localizacoes = new Map<string, {
  lat: number; lng: number; consumidorId: string; lojaId?: string;
  heading?: number; speedKmh?: number; ts: number;
}>();

export function setEntregadorLocalizacao(
  pedidoId: string,
  lat: number,
  lng: number,
  consumidorId: string,
  lojaId?: string,
  heading?: number,
  speedKmh?: number,
): void {
  _localizacoes.set(pedidoId, { lat, lng, consumidorId, lojaId, heading, speedKmh, ts: Date.now() });
  const payload = { pedidoId, lat, lng, heading, speedKmh };
  try {
    getIo().to(`usuario:${consumidorId}`).emit('localizacao:entregador', payload);
    if (lojaId) getIo().to(`loja:${lojaId}`).emit('localizacao:entregador', payload);
  } catch {}
}

export function getEntregadorLocalizacao(pedidoId: string): { lat: number; lng: number; heading?: number; speedKmh?: number; ts: number } | null {
  const loc = _localizacoes.get(pedidoId);
  if (!loc) return null;
  return { lat: loc.lat, lng: loc.lng, heading: loc.heading, speedKmh: loc.speedKmh, ts: loc.ts };
}

export function initSocket(server: http.Server): Server {
  io = new Server(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    socket.on('entregador:join', (entregadorId: string) => {
      socket.join(`entregador:${entregadorId}`);
      socket.join('entregadores');
    });

    socket.on('usuario:join', (usuarioId: string) => {
      socket.join(`usuario:${usuarioId}`);
    });

    socket.on('lojista:join', (lojaId: string) => {
      socket.join(`loja:${lojaId}`);
    });

    socket.on('localizacao:update', async (payload: {
      pedidoId: string; lat: number; lng: number; heading?: number; speedKmh?: number;
    }) => {
      const existing = _localizacoes.get(payload.pedidoId);
      if (existing) {
        setEntregadorLocalizacao(
          payload.pedidoId, payload.lat, payload.lng,
          existing.consumidorId, existing.lojaId,
          payload.heading, payload.speedKmh,
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
            payload.pedidoId, payload.lat, payload.lng,
            pedido.consumidorId, pedido.lojaId,
            payload.heading, payload.speedKmh,
          );
        }
      } catch {}
    });
  });

  return io;
}

export function getIo(): Server {
  if (!io) throw new Error('Socket.IO não inicializado');
  return io;
}
