import request from 'supertest';
import { createTestServer, type TestServer } from '../helpers/createTestServer.js';

describe('POST /api/login', () => {
  let server: TestServer;

  beforeEach(async () => {
    server = createTestServer();
    const hash = await server.deps.hasher.hash('password123');
    server.deps.userRepo.create({ username: 'alice', passwordHash: hash });
  });

  afterEach(() => server.deps.db.close());

  test('succeeds with valid credentials', async () => {
    const res = await request(server.app)
      .post('/api/login')
      .send({ username: 'alice', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe('alice');
    expect(res.body.user.password).toBeUndefined();
  });

  test('returns 401 with wrong password', async () => {
    const res = await request(server.app)
      .post('/api/login')
      .send({ username: 'alice', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid username or password');
  });

  test('returns 401 with unknown user', async () => {
    const res = await request(server.app)
      .post('/api/login')
      .send({ username: 'ghost', password: 'password123' });
    expect(res.status).toBe(401);
  });

  test('returns 400 with missing username', async () => {
    const res = await request(server.app)
      .post('/api/login')
      .send({ password: 'password123' });
    expect(res.status).toBe(400);
  });

  test('returns 400 with missing password', async () => {
    const res = await request(server.app)
      .post('/api/login')
      .send({ username: 'alice' });
    expect(res.status).toBe(400);
  });
});
