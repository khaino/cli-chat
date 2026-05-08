import type Database from 'better-sqlite3';
import { createDatabase } from '../../../src/database/connection.js';
import { UserRepository } from '../../../src/database/repositories/UserRepository.js';

describe('UserRepository', () => {
  let db: Database.Database;
  let users: UserRepository;

  beforeEach(() => {
    db = createDatabase({ path: ':memory:' });
    users = new UserRepository(db);
  });

  afterEach(() => db.close());

  test('create + getByUsername round-trip', () => {
    const created = users.create({ username: 'alice', passwordHash: 'h' });
    const found = users.getByUsername('alice');
    expect(found?.id).toBe(created.id);
    expect(found?.password).toBe('h');
  });

  test('create + getById excludes password', () => {
    const created = users.create({ username: 'alice', passwordHash: 'h' });
    const found = users.getById(created.id);
    expect(found?.username).toBe('alice');
    expect((found as unknown as { password?: string }).password).toBeUndefined();
  });

  test('getById returns null when not found', () => {
    expect(users.getById('missing')).toBeNull();
  });

  test('getByUsername returns null when not found', () => {
    expect(users.getByUsername('missing')).toBeNull();
  });

  test('unique username constraint throws', () => {
    users.create({ username: 'alice', passwordHash: 'h' });
    expect(() =>
      users.create({ username: 'alice', passwordHash: 'h' })
    ).toThrow();
  });

  test('getAll returns users sorted by username', () => {
    users.create({ username: 'charlie', passwordHash: 'h' });
    users.create({ username: 'alice', passwordHash: 'h' });
    users.create({ username: 'bob', passwordHash: 'h' });
    expect(users.getAll().map((u) => u.username)).toEqual(['alice', 'bob', 'charlie']);
  });
});
