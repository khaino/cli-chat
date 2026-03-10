import express from 'express';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';

// Create a test app
function createTestApp(db: Database.Database) {
  const app = express();
  app.use(express.json());

  // Login endpoint
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  });

  // Get all users
  app.get('/api/users', (_req, res) => {
    const users = db.prepare('SELECT id, username, created_at, updated_at FROM users ORDER BY username').all();
    res.json({ success: true, users });
  });

  return app;
}

describe('API Endpoints', () => {
  let db: Database.Database;
  let app: express.Application;

  beforeEach(async () => {
    // Create in-memory database
    db = new Database(':memory:');
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
    
    // Insert test users
    const password = await bcrypt.hash('password123', 10);
    db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(uuidv4(), 'alice', password);
    db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(uuidv4(), 'bob', password);
    
    app = createTestApp(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('POST /api/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'alice', password: 'password123' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('alice');
    });

    test('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'alice', password: 'wrongpassword' });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid username or password');
    });

    test('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'nonexistent', password: 'password123' });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail with missing username', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ password: 'password123' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username and password are required');
    });

    test('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'alice' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username and password are required');
    });
  });

  describe('GET /api/users', () => {
    test('should return all users', async () => {
      const response = await request(app).get('/api/users');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users).toHaveLength(2);
      expect(response.body.users.map((u: any) => u.username)).toEqual(['alice', 'bob']);
    });

    test('should not include passwords in response', async () => {
      const response = await request(app).get('/api/users');
      
      expect(response.body.users[0]).not.toHaveProperty('password');
    });
  });
});
