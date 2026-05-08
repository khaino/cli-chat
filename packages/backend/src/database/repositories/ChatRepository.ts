import type Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { Chat, SafeUser } from '@cli-chat/shared';

export class ChatRepository {
  private readonly insertChatStmt;
  private readonly findByIdStmt;
  private readonly findPrivateStmt;
  private readonly insertParticipantStmt;
  private readonly findParticipantsStmt;
  private readonly getOrCreatePrivateTxn;

  constructor(private readonly db: Database.Database) {
    this.insertChatStmt = db.prepare(`INSERT INTO chats (id) VALUES (?)`);
    this.findByIdStmt = db.prepare(
      `SELECT id, created_at FROM chats WHERE id = ?`
    );
    this.findPrivateStmt = db.prepare(`
      SELECT c.id, c.created_at
      FROM chats c
      WHERE (
        SELECT COUNT(*) FROM chat_participants cp WHERE cp.chat_id = c.id
      ) = 2
      AND EXISTS (
        SELECT 1 FROM chat_participants WHERE chat_id = c.id AND user_id = ?
      )
      AND EXISTS (
        SELECT 1 FROM chat_participants WHERE chat_id = c.id AND user_id = ?
      )
      LIMIT 1
    `);
    this.insertParticipantStmt = db.prepare(
      `INSERT INTO chat_participants (id, chat_id, user_id) VALUES (?, ?, ?)`
    );
    this.findParticipantsStmt = db.prepare(`
      SELECT u.id, u.username, u.created_at, u.updated_at
      FROM users u
      JOIN chat_participants cp ON u.id = cp.user_id
      WHERE cp.chat_id = ?
      ORDER BY u.username
    `);

    this.getOrCreatePrivateTxn = db.transaction(
      (userIdA: string, userIdB: string): Chat => {
        const existing = this.findPrivateStmt.get(userIdA, userIdB) as
          | Chat
          | undefined;
        if (existing) return existing;

        const chatId = uuidv4();
        this.insertChatStmt.run(chatId);
        this.insertParticipantStmt.run(uuidv4(), chatId, userIdA);
        this.insertParticipantStmt.run(uuidv4(), chatId, userIdB);

        const created = this.findByIdStmt.get(chatId) as Chat | undefined;
        if (!created) throw new Error(`Failed to create chat ${chatId}`);
        return created;
      }
    );
  }

  getById(id: string): Chat | null {
    const row = this.findByIdStmt.get(id) as Chat | undefined;
    return row ?? null;
  }

  getOrCreatePrivate(userIdA: string, userIdB: string): Chat {
    return this.getOrCreatePrivateTxn(userIdA, userIdB);
  }

  getParticipants(chatId: string): SafeUser[] {
    return this.findParticipantsStmt.all(chatId) as SafeUser[];
  }
}
