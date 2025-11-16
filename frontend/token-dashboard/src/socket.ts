import { io, Socket } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:5001';

let socket: Socket | null = null;

export function getSocket() {
  if (socket) return socket;
  socket = io(API_BASE, { transports: ['websocket'] });
  socket.on('connect', () => console.log('[socket] connected', socket?.id));
  socket.on('disconnect', () => console.log('[socket] disconnected'));
  return socket;
}

export default getSocket;
