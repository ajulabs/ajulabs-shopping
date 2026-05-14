import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verificarToken } from '../utils/jwt';
import { socketCorsOptions } from '../utils/cors';

export function criarWebSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: socketCorsOptions,
  });

  // Middleware de autenticação JWT para todas as conexões
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error('Token não fornecido'));

    try {
      const payload = verificarToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  // ----------------------------------------
  // Namespace /pedidos
  // Usado por: consumidor (acompanhar status)
  //            lojista (receber novos pedidos)
  // ----------------------------------------
  const pedidosNs = io.of('/pedidos');

  pedidosNs.use((socket, next) => {
    const payload = socket.data.user;
    if (!['usuario', 'lojista'].includes(payload?.tipo)) {
      return next(new Error('Acesso negado a /pedidos'));
    }
    next();
  });

  pedidosNs.on('connection', (socket: Socket) => {
    const { id, tipo } = socket.data.user;

    // Cada usuário/lojista entra na sua sala privada
    socket.join(`${tipo}:${id}`);

    socket.on('disconnect', () => {
      socket.leave(`${tipo}:${id}`);
    });
  });

  // ----------------------------------------
  // Namespace /corridas
  // Usado por: entregador (receber ofertas de corrida)
  //            lojista (acompanhar entregador)
  // ----------------------------------------
  const corridasNs = io.of('/corridas');

  corridasNs.use((socket, next) => {
    const payload = socket.data.user;
    if (!['entregador', 'lojista'].includes(payload?.tipo)) {
      return next(new Error('Acesso negado a /corridas'));
    }
    next();
  });

  corridasNs.on('connection', (socket: Socket) => {
    const { id, tipo } = socket.data.user;

    socket.join(`${tipo}:${id}`);

    // Entregador sinaliza que está online/offline
    socket.on('status', (online: boolean) => {
      socket.data.online = online;
      if (online) socket.join('entregadores:online');
      else socket.leave('entregadores:online');
    });

    socket.on('disconnect', () => {
      socket.leave(`${tipo}:${id}`);
      socket.leave('entregadores:online');
    });
  });

  // ----------------------------------------
  // Namespace /notificacoes
  // Usado por: qualquer tipo de usuário autenticado
  // ----------------------------------------
  const notificacoesNs = io.of('/notificacoes');

  notificacoesNs.on('connection', (socket: Socket) => {
    const { id, tipo } = socket.data.user;
    socket.join(`${tipo}:${id}`);

    socket.on('disconnect', () => {
      socket.leave(`${tipo}:${id}`);
    });
  });

  return io;
}

/*
 * COMO USAR — guia para outros devs
 * ===================================
 *
 * Backend — emitir evento para um usuário específico:
 *   io.of('/pedidos').to('usuario:<usuarioId>').emit('pedido:atualizado', { pedidoId, status });
 *   io.of('/pedidos').to('lojista:<lojistaId>').emit('pedido:novo', { pedido });
 *   io.of('/corridas').to('entregadores:online').emit('corrida:oferta', { corrida });
 *   io.of('/notificacoes').to('entregador:<id>').emit('notificacao', { titulo, corpo });
 *
 * Frontend (React Native) — conectar:
 *   import { io } from 'socket.io-client';
 *
 *   const socket = io('http://localhost:3000/pedidos', {
 *     auth: { token: '<JWT_ACCESS_TOKEN>' },
 *   });
 *
 *   socket.on('pedido:atualizado', ({ pedidoId, status }) => { ... });
 *   socket.on('connect_error', (err) => console.error(err.message));
 *
 * Variáveis de ambiente necessárias:
 *   JWT_SECRET        — mesmo secret do token de acesso
 */
