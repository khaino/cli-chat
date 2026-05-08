import type Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { SafeUser } from '@cli-chat/shared';
import type { UserRecord } from '../types.js';

export interface CreateUserInput {
  username: string;
  passwordHash: string;
  id?: string;
}

export class UserRepository {
  private readonly insertStmt;
  private readonly findByIdStmt;
  private readonly findByUsernameStmt;
  private readonly findAllStmt;

  constructor(private readonly db: Database.Database) {
    this.insertStmt = db.prepare(
      `INSERT INTO users (id, username, password) VALUES (?, ?, ?)`
    );
    this.findByIdStmt = db.prepare(
      `SELECT id, username, created_at, updated_at FROM users WHERE id = ?`
    );
    this.findByUsernameStmt = db.prepare(
      `SELECT id, username, password, created_at, updated_at FROM users WHERE username = ?`
    );
    this.findAllStmt = db.prepare(
      `SELECT id, username, created_at, updated_at FROM users ORDER BY username`
    );
  }

  create(input: CreateUserInput): SafeUser {
    const id = input.id ?? uuidv4();
    this.insertStmt.run(id, input.username, input.passwordHash);
    const created = this.getById(id);
    if (!created) {
      throw new Error(`Failed to create user ${input.username}`);
    }
    return created;
  }

  getById(id: string): SafeUser | null {
    const row = this.findByIdStmt.get(id) as SafeUser | undefined;
    return row ?? null;
  }

  getByUsername(username: string): UserRecord | null {
    const row = this.findByUsernameStmt.get(username) as UserRecord | undefined;
    return row ?? null;
  }

  getAll(): SafeUser[] {
    return this.findAllStmt.all() as SafeUser[];
  }
}
