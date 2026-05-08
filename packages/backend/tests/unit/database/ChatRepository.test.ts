import type Database from 'better-sqlite3';
import { createDatabase } from '../../../src/database/connection.js';
import { UserRepository } from '../../../src/database/repositories/UserRepository.js';
import { ChatRepository } from '../../../src/database/repositories/ChatRepository.js';

describe('ChatRepository', () => {
  let db: Database.Database;
  let users: UserRepository;
  let chats: ChatRepository;

  beforeEach(() => {
    db = createDatabase({ path: ':memory:' });
    users = new UserRepository(db);
    chats = new ChatRepository(db);
  });

  afterEach(() => db.close());

  function seedTwoUsers() {
    const a = users.create({ username: 'alice', passwordHash: 'h' });
    const b = users.create({ username: 'bob', passwordHash: 'h' });
    return [a.id, b.id] as const;
  }

  test('getOrCreatePrivate creates a chat when none exists', () => {
    const [aId, bId] = seedTwoUsers();
    const chat = chats.getOrCreatePrivate(aId, bId);
    expect(chat.id).toBeDefined();
    expect(chats.getParticipants(chat.id).map((p) => p.id).sort()).toEqual(
      [aId, bId].sort()
    );
  });

  test('getOrCreatePrivate is idempotent in either direction', () => {
    const [aId, bId] = seedTwoUsers();
    const first = chats.getOrCreatePrivate(aId, bId);
    const second = chats.getOrCreatePrivate(bId, aId);
    expect(second.id).toBe(first.id);
  });

  test('getOrCreatePrivate is transactional (no orphan rows on failure)', () => {
    const [aId] = seedTwoUsers();
    expect(() => chats.getOrCreatePrivate(aId, 'missing-user-id')).toThrow();
    const remainingChats = db.prepare('SELECT COUNT(*) AS c FROM chats').get() as {
      c: number;
    };
    expect(remainingChats.c).toBe(0);
  });
});
