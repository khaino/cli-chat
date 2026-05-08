import type Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { Message, MessageWithSender } from '@cli-chat/shared';

export interface CreateMessageInput {
  chatId: string;
  senderId: string;
  content: string;
}

export class MessageRepository {
  private readonly insertStmt;
  private readonly findByIdStmt;
  private readonly findByIdWithSenderStmt;
  private readonly listByChatStmt;

  constructor(private readonly db: Database.Database) {
    this.insertStmt = db.prepare(
      `INSERT INTO messages (id, chat_id, sender_id, content) VALUES (?, ?, ?, ?)`
    );
    this.findByIdStmt = db.prepare(
      `SELECT id, chat_id, sender_id, content, created_at FROM messages WHERE id = ?`
    );
    this.findByIdWithSenderStmt = db.prepare(`
      SELECT m.id, m.chat_id, m.sender_id, m.content, m.created_at,
             u.username AS sender_username
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `);
    this.listByChatStmt = db.prepare(`
      SELECT m.id, m.chat_id, m.sender_id, m.content, m.created_at,
             u.username AS sender_username
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ?
      ORDER BY m.created_at ASC
    `);
  }

  create(input: CreateMessageInput): MessageWithSender {
    const id = uuidv4();
    this.insertStmt.run(id, input.chatId, input.senderId, input.content);
    const created = this.findByIdWithSenderStmt.get(id) as
      | MessageWithSender
      | undefined;
    if (!created) throw new Error(`Failed to create message ${id}`);
    return created;
  }

  getById(id: string): Message | null {
    const row = this.findByIdStmt.get(id) as Message | undefined;
    return row ?? null;
  }

  listByChat(chatId: string): MessageWithSender[] {
    return this.listByChatStmt.all(chatId) as MessageWithSender[];
  }
}
