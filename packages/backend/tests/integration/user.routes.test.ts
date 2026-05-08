import request from 'supertest';
import { createTestServer, type TestServer } from '../helpers/createTestServer.js';

describe('GET /api/users', () => {
  let server: TestServer;

  beforeEach(() => {
    server = createTestServer();
    server.deps.userRepo.create({ username: 'alice', passwordHash: 'h' });
    server.deps.userRepo.create({ username: 'bob', passwordHash: 'h' });
  });

  afterEach(() => server.deps.db.close());

  test('returns all users without password', async () => {
    const res = await request(server.app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.users).toHaveLength(2);
    expect(res.body.users[0]).not.toHaveProperty('password');
  });

  test('decorates users with online flag', async () => {
    const alice = server.deps.userRepo.getByUsername('alice')!;
    server.deps.presence.setOnline(alice.id, 's1');
    const res = await request(server.app).get('/api/users');
    const aliceOut = res.body.users.find((u: { username: string }) => u.username === 'alice');
    const bobOut = res.body.users.find((u: { username: string }) => u.username === 'bob');
    expect(aliceOut.online).toBe(true);
    expect(bobOut.online).toBe(false);
  });

  test('?online=true filters to online users only', async () => {
    const alice = server.deps.userRepo.getByUsername('alice')!;
    server.deps.presence.setOnline(alice.id, 's1');
    const res = await request(server.app).get('/api/users?online=true');
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].username).toBe('alice');
  });
});
