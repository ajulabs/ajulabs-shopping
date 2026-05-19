import { io, Socket } from 'socket.io-client';
import type { ServerEvents, ClientEvents } from './events';

type TypedSocket = Socket<ServerEvents, ClientEvents>;

let _socket: TypedSocket | null = null;
let _url = '';

export function getSocket(url: string): TypedSocket {
  const baseUrl = url.replace(/\/$/, '');
  if (_socket && _url === baseUrl && _socket.connected) return _socket;

  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }

  _url = baseUrl;
  _socket = io(baseUrl, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  }) as TypedSocket;

  return _socket;
}

export function disconnectSocket(): void {
  _socket?.disconnect();
  _socket = null;
}
