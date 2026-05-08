import type Database from 'better-sqlite3';
import { createDatabase } from '../../../src/database/connection.js';
import { UserRepository } from '../../../src/database/repositories/UserRepository.js';
import { seedDummyUsers } from '../../../src/database/seed.js';
import type { PasswordHasher } from '../../../src/auth/PasswordHasher.js';

const fakeHasher: PasswordHasher = {
  hash: async (p) => `hashed(${p})`,
  verify: async () => false,
};

describe('seedDummyUsers', () => {
  let db: Database.Database;
  let users: UserRepository;

  beforeEach(() => {
    db = createDatabase({ path: ':memory:' });
    users = new UserRepository(db);
  });

  afterEach(() => db.close());

  test('seeds 5 dummy users when DB is empty', async () => {
    const outcome = await seedDummyUsers(db, fakeHasher, { password: 'pw' });
    expect(outcome).toBe('seeded');
    expect(users.getAll().map((u) => u.username).sort()).toEqual([
      'alice',
      'bob',
      'charlie',
      'diana',
      'edward',
    ]);
  });

  test('returns "skipped" when users already exist (idempotent)', async () => {
    users.create({ username: 'pre-existing', passwordHash: 'h' });
    const outcome = await seedDummyUsers(db, fakeHasher, { password: 'pw' });
    expect(outcome).toBe('skipped');
    expect(users.getAll()).toHaveLength(1);
  });

  test('does not re-hash on a second run', async () => {
    let hashCalls = 0;
    const countingHasher: PasswordHasher = {
      hash: async (p) => {
        hashCalls += 1;
        return `hashed(${p})`;
      },
      verify: async () => false,
    };

    await seedDummyUsers(db, countingHasher, { password: 'pw' });
    await seedDummyUsers(db, countingHasher, { password: 'pw' });

    expect(hashCalls).toBe(1);
  });
});
