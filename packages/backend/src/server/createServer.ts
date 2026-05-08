import express, { type Express } from 'express';
import { createServer as createHttpServer, type Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@cli-chat/shared';
import type { AuthService } from '../auth/AuthService.js';
import type { ChatService } from '../chat/ChatService.js';
import type { PresenceService } from '../chat/PresenceService.js';
import type { UserRepository } from '../database/repositories/UserRepository.js';
import type { Logger } from '../shared-infra/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createChatRouter } from './routes/chat.routes.js';
import { createUserRouter } from './routes/user.routes.js';
import { registerSocketHandlers } from './sockets/registerSocketHandlers.js';

export interface ServerDeps {
  authService: AuthService;
  chatService: ChatService;
  userRepo: UserRepository;
  presence: PresenceService;
  logger: Logger;
  cors?: { origin: string };
}

export interface CreatedServer {
  app: Express;
  httpServer: HttpServer;
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
}

export function createServer(deps: ServerDeps): CreatedServer {
  const app = express();
  app.use(express.json());

  app.use('/api', createAuthRouter({ authService: deps.authService, logger: deps.logger }));
  app.use(
    '/api',
    createUserRouter({ userRepo: deps.userRepo, presence: deps.presence, logger: deps.logger })
  );
  app.use('/api', createChatRouter({ chatService: deps.chatService, logger: deps.logger }));

  app.use(errorHandler(deps.logger));

  const httpServer = createHttpServer(app);
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: deps.cors?.origin ?? '*', methods: ['GET', 'POST'] },
  });
  registerSocketHandlers(io, {
    chatService: deps.chatService,
    presence: deps.presence,
    logger: deps.logger,
  });

  return { app, httpServer, io };
}
