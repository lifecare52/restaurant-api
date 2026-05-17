import { Server as SocketIOServer } from 'socket.io';

import { getCorsConfig } from 'config/cors';
import { registerPrinterServiceSocketHandlers } from '@modules/printer-service/printer-service.socket-handler';

import type { Server as HttpServer } from 'http';

export const initializeSocketServer = (httpServer: HttpServer): SocketIOServer => {
  const corsConfig = getCorsConfig();
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsConfig.allowedOrigins.includes('*') ? true : corsConfig.allowedOrigins,
      credentials: corsConfig.allowCredentials,
      methods: corsConfig.allowedMethods,
      allowedHeaders: corsConfig.allowedHeaders
    }
  });

  io.on('connection', socket => {
    registerPrinterServiceSocketHandlers(io, socket);
  });

  return io;
};
