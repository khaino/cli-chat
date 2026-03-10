import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Mock database for testing
let db: Database.Database;

// Helper to create in-memory database
function createTestDatabase(): Database.Database {
  const database = new Database(':memory:');
  
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_participants (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(chat_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      content TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  
  return database;
}

describe('Database Operations', () => {
  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    db.close();
  });

  describe('User Operations', () => {
    test('should create a user', async () => {
      const id = uuidv4();
      const username = 'testuser';
      const password = await bcrypt.hash('password123', 10);
      
      const stmt = db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)');
      stmt.run(id, username, password);
      
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
      
      expect(user).toBeDefined();
      expect(user.username).toBe(username);
      expect(user.id).toBe(id);
    });

    test('should get user by username', async () => {
      const id = uuidv4();
      const username = 'testuser';
      const password = await bcrypt.hash('password123', 10);
      
      db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(id, username, password);
      
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
      
      expect(user).toBeDefined();
      expect(user.username).toBe(username);
    });

    test('should get all users', async () => {
      const users = [
        { id: uuidv4(), username: 'user1', password: await bcrypt.hash('pass1', 10) },
        { id: uuidv4(), username: 'user2', password: await bcrypt.hash('pass2', 10) },
        { id: uuidv4(), username: 'user3', password: await bcrypt.hash('pass3', 10) },
      ];
      
      const insertStmt = db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)');
      users.forEach(u => insertStmt.run(u.id, u.username, u.password));
      
      const allUsers = db.prepare('SELECT id, username FROM users ORDER BY username').all() as any[];
      
      expect(allUsers).toHaveLength(3);
      expect(allUsers.map(u => u.username)).toEqual(['user1', 'user2', 'user3']);
    });

    test('should enforce unique usernames', async () => {
      const id1 = uuidv4();
      const id2 = uuidv4();
      const username = 'duplicate';
      const password = await bcrypt.hash('password123', 10);
      
      db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(id1, username, password);
      
      expect(() => {
        db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(id2, username, password);
      }).toThrow();
    });
  });

  describe('Chat Operations', () => {
    test('should create a chat', () => {
      const id = uuidv4();
      
      db.prepare('INSERT INTO chats (id) VALUES (?)').run(id);
      
      const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(id) as any;
      
      expect(chat).toBeDefined();
      expect(chat.id).toBe(id);
    });

    test('should create chat with participants', async () => {
      const chatId = uuidv4();
      const userId1 = uuidv4();
      const userId2 = uuidv4();
      const password = await bcrypt.hash('password123', 10);
      
      // Create users
      db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(userId1, 'user1', password);
      db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(userId2, 'user2', password);
      
      // Create chat
      db.prepare('INSERT INTO chats (id) VALUES (?)').run(chatId);
      
      // Add participants
      db.prepare('INSERT INTO chat_participants (id, chat_id, user_id) VALUES (?, ?, ?)').run(uuidv4(), chatId, userId1);
      db.prepare('INSERT INTO chat_participants (id, chat_id, user_id) VALUES (?, ?, ?)').run(uuidv4(), chatId, userId2);
      
      const participants = db.prepare(`
        SELECT u.id, u.username 
        FROM users u 
        JOIN chat_participants cp ON u.id = cp.user_id 
        WHERE cp.chat_id = ?
      `).all(chatId) as any[];
      
      expect(participants).toHaveLength(2);
    });
  });

  describe('Message Operations', () => {
    test('should create a message', async () => {
      const chatId = uuidv4();
      const userId = uuidv4();
      const messageId = uuidv4();
      const password = await bcrypt.hash('password123', 10);
      
      // Create user and chat
      db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(userId, 'user1', password);
      db.prepare('INSERT INTO chats (id) VALUES (?)').run(chatId);
      db.prepare('INSERT INTO chat_participants (id, chat_id, user_id) VALUES (?, ?, ?)').run(uuidv4(), chatId, userId);
      
      // Create message
      db.prepare('INSERT INTO messages (id, chat_id, sender_id, content) VALUES (?, ?, ?, ?)').run(messageId, chatId, userId, 'Hello World');
      
      const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId) as any;
      
      expect(message).toBeDefined();
      expect(message.content).toBe('Hello World');
      expect(message.sender_id).toBe(userId);
      expect(message.chat_id).toBe(chatId);
    });

    test('should get messages with sender info', async () => {
      const chatId = uuidv4();
      const userId = uuidv4();
      const password = await bcrypt.hash('password123', 10);
      
      // Create user and chat
      db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(userId, 'testuser', password);
      db.prepare('INSERT INTO chats (id) VALUES (?)').run(chatId);
      db.prepare('INSERT INTO chat_participants (id, chat_id, user_id) VALUES (?, ?, ?)').run(uuidv4(), chatId, userId);
      
      // Create messages
      const msg1 = uuidv4();
      const msg2 = uuidv4();
      db.prepare('INSERT INTO messages (id, chat_id, sender_id, content) VALUES (?, ?, ?, ?)').run(msg1, chatId, userId, 'Message 1');
      db.prepare('INSERT INTO messages (id, chat_id, sender_id, content) VALUES (?, ?, ?, ?)').run(msg2, chatId, userId, 'Message 2');
      
      const messages = db.prepare(`
        SELECT m.id, m.content, m.sender_id, u.username as sender_username
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.chat_id = ?
        ORDER BY m.created_at
      `).all(chatId) as any[];
      
      expect(messages).toHaveLength(2);
      expect(messages[0].sender_username).toBe('testuser');
      expect(messages[0].content).toBe('Message 1');
    });
  });
});
