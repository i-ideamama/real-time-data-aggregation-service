import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { config } from './env';
import { logger } from './logger';

let io: SocketServer | null = null;

export interface ServerMetrics {
  activeConnections: number;
  totalMessages: number;
  cacheHits: number;
  cacheMisses: number;
  apiCalls: number;
}

let metrics: ServerMetrics = {
  activeConnections: 0,
  totalMessages: 0,
  cacheHits: 0,
  cacheMisses: 0,
  apiCalls: 0,
};

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 5000,
  });

  io.on('connection', (socket: Socket) => {
    metrics.activeConnections++;
    logger.info(`Client connected: ${socket.id}`, { meta: { activeConnections: metrics.activeConnections } });

    socket.on('disconnect', () => {
      metrics.activeConnections--;
      logger.info(`Client disconnected: ${socket.id}`, { meta: { activeConnections: metrics.activeConnections } });
    });

    socket.on('error', (error) => {
      logger.error(`Socket error: ${socket.id}`, error);
    });
  });

  return io;
}

export function getIO(): SocketServer | null {
  return io;
}

export function emitTokenUpdate(token: any): void {
  if (!io) return;
  io.emit('token:update', token);
  metrics.totalMessages++;
}

export function emitTokenNew(token: any): void {
  if (!io) return;
  io.emit('token:new', token);
  metrics.totalMessages++;
}

export function broadcastToRoom(room: string, event: string, data: any): void {
  if (!io) return;
  io.to(room).emit(event, data);
  metrics.totalMessages++;
}

export function getMetrics(): ServerMetrics {
  return { ...metrics };
}

export function recordCacheHit(): void {
  metrics.cacheHits++;
}

export function recordCacheMiss(): void {
  metrics.cacheMisses++;
}

export function recordApiCall(): void {
  metrics.apiCalls++;
}

export function resetMetrics(): void {
  metrics = {
    activeConnections: metrics.activeConnections,
    totalMessages: 0,
    cacheHits: 0,
    cacheMisses: 0,
    apiCalls: 0,
  };
}
