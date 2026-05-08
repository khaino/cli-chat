import { makeTestDeps, type TestDeps } from '../../helpers/makeTestDeps.js';

describe('ChatService', () => {
  let deps: TestDeps;

  beforeEach(() => {
    deps = makeTestDeps();
  });

  afterEach(() => deps.db.close());

  function seedTwoUsers() {
    const a = deps.userRepo.create({ username: 'alice', passwordHash: 'h' });
    const b = deps.userRepo.create({ username: 'bob', passwordHash: 'h' });
    return [a.id, b.id] as const;
  }

  test('startPrivate refuses self-chat', () => {
    const [aId] = seedTwoUsers();
    const result = deps.chatService.startPrivate(aId, aId);
    expect(result).toEqual({ ok: false, reason: 'self-chat' });
  });

  test('startPrivate refuses unknown users', () => {
    const [aId] = seedTwoUsers();
    const result = deps.chatService.startPrivate(aId, 'ghost');
    expect(result).toEqual({ ok: false, reason: 'user-not-found' });
  });

  test('startPrivate returns chat with empty messages on first call', () => {
    const [aId, bId] = seedTwoUsers();
    const result = deps.chatService.startPrivate(aId, bId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.messages).toEqual([]);
      expect(result.participants.map((p) => p.id).sort()).toEqual([aId, bId].sort());
    }
  });

  test('participants reflect online state', () => {
    const [aId, bId] = seedTwoUsers();
    deps.presence.setOnline(aId, 's-a');
    const result = deps.chatService.startPrivate(aId, bId);
    if (!result.ok) throw new Error('expected ok');
    const aliceP = result.participants.find((p) => p.id === aId);
    const bobP = result.participants.find((p) => p.id === bId);
    expect(aliceP?.online).toBe(true);
    expect(bobP?.online).toBe(false);
  });

  test('sendMessage + listMessages round-trips', () => {
    const [aId, bId] = seedTwoUsers();
    const start = deps.chatService.startPrivate(aId, bId);
    if (!start.ok) throw new Error('expected ok');
    const sent = deps.chatService.sendMessage({
      chatId: start.chat.id,
      senderId: aId,
      content: 'hello',
    });
    expect(sent.sender_username).toBe('alice');
    const listed = deps.chatService.listMessages(start.chat.id);
    expect(listed).toHaveLength(1);
    expect(listed[0].content).toBe('hello');
  });
});
