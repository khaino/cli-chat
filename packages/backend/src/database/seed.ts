import type Database from 'better-sqlite3';
import type { Logger } from '../shared-infra/logger.js';
import type { PasswordHasher } from '../auth/PasswordHasher.js';
import { dummyUsers } from './schema.js';

export interface SeedConfig {
  password: string;
}

export type SeedOutcome = 'skipped' | 'seeded';

/**
 * Seeds dummy users into an empty database (idempotent).
 *
 * Returns `'skipped'` if any users already exist, `'seeded'` otherwise.
 * Whether seeding should happen at all is a caller-side decision; this
 * function never auto-runs from the backend's main entrypoint.
 */
export async function seedDummyUsers(
  db: Database.Database,
  hasher: PasswordHasher,
  cfg: SeedConfig,
  logger?: Logger
): Promise<SeedOutcome> {
  const row = db.prepare('SELECT COUNT(*) AS count FROM users').get() as {
    count: number;
  };
  if (row.count > 0) {
    logger?.debug(`Seeding skipped (${row.count} user(s) already present)`);
    return 'skipped';
  }

  const hashedPassword = await hasher.hash(cfg.password);
  const insertStmt = db.prepare(
    `INSERT INTO users (id, username, password) VALUES (?, ?, ?)`
  );
  const insertMany = db.transaction(() => {
    for (const user of dummyUsers) {
      insertStmt.run(user.id, user.username, hashedPassword);
    }
  });
  insertMany();

  logger?.info(`Seeded ${dummyUsers.length} dummy user(s)`);
  return 'seeded';
}
