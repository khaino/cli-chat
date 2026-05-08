import Database from 'better-sqlite3';
import { createTables } from './schema.js';

export interface DbConfig {
  path: string;
}

export function createDatabase(cfg: DbConfig): Database.Database {
  const db = new Database(cfg.path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(createTables);
  return db;
}

export type { Database };
