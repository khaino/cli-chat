import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { createTables, dummyUsers } from './schema.js';
import type { User, SafeUser, Chat, ChatParticipant, Message, MessageWithSender } from '../types/index.js';

let db: Database.Database | null = null;
let isSeeded = false;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database('cli-chat.db');
    initializeDatabase();
  }
  return db;
}

export async function initializeDatabase(): Promise<void> {
  const database = getDatabase();
  database.exec(createTables);
  await seedDummyUsers();
}

async function seedDummyUsers(): Promise<void> {
  if (isSeeded) return;
  
  const database = getDatabase();
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const insertStmt = database.prepare(`
    INSERT OR IGNORE INTO users (id, username, password)
    VALUES (?, ?, ?)
  `);
  
  for (const user of dummyUsers) {
    insertStmt.run(user.id, user.username, hashedPassword);
  }
  
  isSeeded = true;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// User operations
export function createUser(username: string, hashedPassword: string): SafeUser {
  const database = getDatabase();
  const id = uuidv4();
  const stmt = database.prepare(`
    INSERT INTO users (id, username, password)
    VALUES (?, ?, ?)
  `);
  stmt.run(id, username, hashedPassword);
  
  return getUserById(id)!;
}

export function getUserById(id: string): SafeUser | null {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT id, username, created_at, updated_at
    FROM users
    WHERE id = ?
  `);
  const row = stmt.get(id) as SafeUser | undefined;
  return row || null;
}

export function getUserByUsername(username: string): User | null {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT id, username, password, created_at, updated_at
    FROM users
    WHERE username = ?
  `);
  const row = stmt.get(username) as User | undefined;
  return row || null;
}

export function getAllUsers(): SafeUser[] {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT id, username, created_at, updated_at
    FROM users
    ORDER BY username
  `);
  return stmt.all() as SafeUser[];
}

// Chat operations
export function createChat(): Chat {
  const database = getDatabase();
  const id = uuidv4();
  const stmt = database.prepare(`
    INSERT INTO chats (id)
    VALUES (?)
  `);
  stmt.run(id);
  
  return getChatById(id)!;
}

export function getChatById(id: string): Chat | null {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT id, created_at
    FROM chats
    WHERE id = ?
  `);
  const row = stmt.get(id) as Chat | undefined;
  return row || null;
}

export function getOrCreatePrivateChat(userId1: string, userId2: string): Chat {
  const database = getDatabase();
  
  // Check if a chat already exists between these two users
  const existingChat = database.prepare(`
    SELECT c.id, c.created_at
    FROM chats c
    JOIN chat_participants cp1 ON c.id = cp1.chat_id
    JOIN chat_participants cp2 ON c.id = cp2.chat_id
    WHERE cp1.user_id = ? AND cp2.user_id = ?
    GROUP BY c.id
    HAVING COUNT(DISTINCT cp1.user_id) + COUNT(DISTINCT cp2.user_id) = 2
    AND (SELECT COUNT(*) FROM chat_participants WHERE chat_id = c.id) = 2
  `).get(userId1, userId2) as Chat | undefined;
  
  if (existingChat) {
    return existingChat;
  }
  
  // Create new chat
  const chat = createChat();
  
  // Add both users as participants
  const addParticipant = database.prepare(`
    INSERT INTO chat_participants (id, chat_id, user_id)
    VALUES (?, ?, ?)
  `);
  
  addParticipant.run(uuidv4(), chat.id, userId1);
  addParticipant.run(uuidv4(), chat.id, userId2);
  
  return chat;
}

// Chat participant operations
export function addChatParticipant(chatId: string, userId: string): ChatParticipant {
  const database = getDatabase();
  const id = uuidv4();
  const stmt = database.prepare(`
    INSERT INTO chat_participants (id, chat_id, user_id)
    VALUES (?, ?, ?)
  `);
  stmt.run(id, chatId, userId);
  
  return { id, chat_id: chatId, user_id: userId, created_at: new Date().toISOString() };
}

export function getChatParticipants(chatId: string): SafeUser[] {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT u.id, u.username, u.created_at, u.updated_at
    FROM users u
    JOIN chat_participants cp ON u.id = cp.user_id
    WHERE cp.chat_id = ?
    ORDER BY u.username
  `);
  return stmt.all(chatId) as SafeUser[];
}

// Message operations
export function createMessage(chatId: string, senderId: string, content: string): Message {
  const database = getDatabase();
  const id = uuidv4();
  const stmt = database.prepare(`
    INSERT INTO messages (id, chat_id, sender_id, content)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, chatId, senderId, content);
  
  return getMessageById(id)!;
}

export function getMessageById(id: string): Message | null {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT id, chat_id, sender_id, content, created_at
    FROM messages
    WHERE id = ?
  `);
  const row = stmt.get(id) as Message | undefined;
  return row || null;
}

export function getChatMessages(chatId: string): MessageWithSender[] {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT m.id, m.chat_id, m.sender_id, m.content, m.created_at, u.username as sender_username
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.chat_id = ?
    ORDER BY m.created_at ASC
  `);
  return stmt.all(chatId) as MessageWithSender[];
}

export { Database };