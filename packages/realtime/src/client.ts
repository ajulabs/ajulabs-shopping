import { io, Socket } from 'socket.io-client';
import type { ServerEvents, ClientEvents } from './events';

type TypedSocket = Socket<ServerEvents, ClientEvents>;

let _socket: TypedSocket | null = null;
let _url = '';

export function getSocket(url: string): TypedSocket {
  const baseUrl = url.replace(/\/$/, '');
  // Return existing socket for same URL regardless of connected state — socket.io
  // handles reconnection internally; recreating during a transient disconnect would
  // cancel pending reconnect attempts and reset the backoff counter.
  if (_socket && _url === baseUrl) return _socket;

  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }

  _url = baseUrl;
  _socket = io(baseUrl, {
    // Prefere websocket, mas permite cair para long-polling quando o websocket
    // puro é bloqueado (algumas redes/proxies e builds APK) — sem isso o socket
    // nunca conecta e o rastreamento fica "localizando" para sempre.
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
  }) as TypedSocket;

  return _socket;
}

export function disconnectSocket(): void {
  _socket?.disconnect();
  _socket = null;
}
