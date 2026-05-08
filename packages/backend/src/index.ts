import { loadConfig } from './config/index.js';
import { createConsoleLogger } from './shared-infra/logger.js';
import { createDatabase } from './database/connection.js';
import { UserRepository } from './database/repositories/UserRepository.js';
import { ChatRepository } from './database/repositories/ChatRepository.js';
import { MessageRepository } from './database/repositories/MessageRepository.js';
import { BcryptHasher } from './auth/PasswordHasher.js';
import { AuthService } from './auth/AuthService.js';
import { PresenceService } from './chat/PresenceService.js';
import { ChatService } from './chat/ChatService.js';
import { createServer } from './server/createServer.js';

async function main(): Promise<void> {
  const cfg = loadConfig();
  const logger = createConsoleLogger(cfg.logger.level);

  const db = createDatabase({ path: cfg.dbPath });
  const hasher = new BcryptHasher(cfg.saltRounds);

  const userRepo = new UserRepository(db);
  const chatRepo = new ChatRepository(db);
  const messageRepo = new MessageRepository(db);
  const presence = new PresenceService();

  const authService = new AuthService(userRepo, hasher);
  const chatService = new ChatService(chatRepo, messageRepo, userRepo, presence);

  const { httpServer, io } = createServer({
    authService,
    chatService,
    userRepo,
    presence,
    logger,
    cors: cfg.cors,
  });

  httpServer.listen(cfg.port, () => {
    logger.info(`Server running on port ${cfg.port}`);
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received, shutting down`);

    const finish = (exitCode: number) => {
      try {
        db.close();
      } catch {
        /* ignore */
      }
      process.exit(exitCode);
    };

    // io.close() also tears down the underlying HTTP server, so no separate
    // httpServer.close() call is needed (it would hit ERR_SERVER_NOT_RUNNING).
    io.close((err) => {
      if (err) logger.error('Error closing Socket.IO server', err);
      finish(0);
    });

    setTimeout(() => {
      logger.warn('Forcing exit after 5s shutdown timeout');
      finish(0);
    }, 5000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Fatal startup error', err);
  process.exit(1);
});
