import type Database from 'better-sqlite3';
import { createDatabase } from '../../../src/database/connection.js';
import { UserRepository } from '../../../src/database/repositories/UserRepository.js';
import { ChatRepository } from '../../../src/database/repositories/ChatRepository.js';
import { MessageRepository } from '../../../src/database/repositories/MessageRepository.js';

describe('MessageRepository', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createDatabase({ path: ':memory:' });
  });

  afterEach(() => db.close());

  test('create + listByChat returns messages with sender info', () => {
    const users = new UserRepository(db);
    const chats = new ChatRepository(db);
    const messages = new MessageRepository(db);

    const a = users.create({ username: 'alice', passwordHash: 'h' });
    const b = users.create({ username: 'bob', passwordHash: 'h' });
    const chat = chats.getOrCreatePrivate(a.id, b.id);

    const m1 = messages.create({
      chatId: chat.id,
      senderId: a.id,
      content: 'hi',
    });
    const m2 = messages.create({
      chatId: chat.id,
      senderId: b.id,
      content: 'yo',
    });

    expect(m1.sender_username).toBe('alice');
    expect(m2.sender_username).toBe('bob');

    const list = messages.listByChat(chat.id);
    expect(list).toHaveLength(2);
    expect(list[0].content).toBe('hi');
    expect(list[1].content).toBe('yo');
  });
});
