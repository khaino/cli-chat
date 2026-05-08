import request from 'supertest';
import { createTestServer, type TestServer } from '../helpers/createTestServer.js';

describe('chat routes', () => {
  let server: TestServer;
  let aliceId: string;
  let bobId: string;

  beforeEach(() => {
    server = createTestServer();
    aliceId = server.deps.userRepo.create({ username: 'alice', passwordHash: 'h' }).id;
    bobId = server.deps.userRepo.create({ username: 'bob', passwordHash: 'h' }).id;
  });

  afterEach(() => server.deps.db.close());

  test('POST /api/chat/start creates a chat', async () => {
    const res = await request(server.app)
      .post('/api/chat/start')
      .send({ currentUserId: aliceId, targetUserId: bobId });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.chat.id).toBeDefined();
    expect(res.body.participants).toHaveLength(2);
    expect(res.body.messages).toEqual([]);
  });

  test('POST /api/chat/start is idempotent', async () => {
    const first = await request(server.app)
      .post('/api/chat/start')
      .send({ currentUserId: aliceId, targetUserId: bobId });
    const second = await request(server.app)
      .post('/api/chat/start')
      .send({ currentUserId: bobId, targetUserId: aliceId });
    expect(second.body.chat.id).toBe(first.body.chat.id);
  });

  test('POST /api/chat/start rejects self-chat', async () => {
    const res = await request(server.app)
      .post('/api/chat/start')
      .send({ currentUserId: aliceId, targetUserId: aliceId });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/chat/start returns 400 on missing fields', async () => {
    const res = await request(server.app)
      .post('/api/chat/start')
      .send({ currentUserId: aliceId });
    expect(res.status).toBe(400);
  });

  test('GET /api/chat/:chatId/messages returns messages', async () => {
    const start = await request(server.app)
      .post('/api/chat/start')
      .send({ currentUserId: aliceId, targetUserId: bobId });
    const chatId = start.body.chat.id;
    server.deps.chatService.sendMessage({
      chatId,
      senderId: aliceId,
      content: 'hi',
    });

    const res = await request(server.app).get(`/api/chat/${chatId}/messages`);
    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(1);
    expect(res.body.messages[0].content).toBe('hi');
  });
});
