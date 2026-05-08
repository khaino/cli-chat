import { createDatabase } from '../../src/database/connection.js';
import { UserRepository } from '../../src/database/repositories/UserRepository.js';
import { ChatRepository } from '../../src/database/repositories/ChatRepository.js';
import { MessageRepository } from '../../src/database/repositories/MessageRepository.js';
import { BcryptHasher } from '../../src/auth/PasswordHasher.js';
import { AuthService } from '../../src/auth/AuthService.js';
import { PresenceService } from '../../src/chat/PresenceService.js';
import { ChatService } from '../../src/chat/ChatService.js';
import { silentLogger } from '../../src/shared-infra/logger.js';
import type { ServerDeps } from '../../src/server/createServer.js';
import type Database from 'better-sqlite3';

export interface TestDeps extends ServerDeps {
  db: Database.Database;
  hasher: BcryptHasher;
  userRepo: UserRepository;
  chatRepo: ChatRepository;
  messageRepo: MessageRepository;
}

export function makeTestDeps(): TestDeps {
  const db = createDatabase({ path: ':memory:' });
  const hasher = new BcryptHasher(4);

  const userRepo = new UserRepository(db);
  const chatRepo = new ChatRepository(db);
  const messageRepo = new MessageRepository(db);
  const presence = new PresenceService();

  const authService = new AuthService(userRepo, hasher);
  const chatService = new ChatService(chatRepo, messageRepo, userRepo, presence);

  return {
    db,
    hasher,
    userRepo,
    chatRepo,
    messageRepo,
    presence,
    authService,
    chatService,
    logger: silentLogger,
  };
}
