import { PresenceService } from '../../../src/chat/PresenceService.js';

describe('PresenceService', () => {
  let presence: PresenceService;

  beforeEach(() => {
    presence = new PresenceService();
  });

  test('isOnline returns false initially', () => {
    expect(presence.isOnline('u1')).toBe(false);
  });

  test('setOnline marks user as online', () => {
    presence.setOnline('u1', 's1');
    expect(presence.isOnline('u1')).toBe(true);
  });

  test('setOfflineBySocket clears the user', () => {
    presence.setOnline('u1', 's1');
    expect(presence.setOfflineBySocket('s1')).toBe('u1');
    expect(presence.isOnline('u1')).toBe(false);
  });

  test('setOfflineBySocket returns null for unknown socket', () => {
    expect(presence.setOfflineBySocket('unknown')).toBeNull();
  });

  test('reconnecting on a new socket cleans up the old one', () => {
    presence.setOnline('u1', 's1');
    presence.setOnline('u1', 's2');
    expect(presence.setOfflineBySocket('s1')).toBeNull();
    expect(presence.isOnline('u1')).toBe(true);
    expect(presence.setOfflineBySocket('s2')).toBe('u1');
    expect(presence.isOnline('u1')).toBe(false);
  });

  test('decorate adds online flag', () => {
    presence.setOnline('u1', 's1');
    const out = presence.decorate([
      { id: 'u1', username: 'alice' },
      { id: 'u2', username: 'bob' },
    ]);
    expect(out).toEqual([
      { id: 'u1', username: 'alice', online: true },
      { id: 'u2', username: 'bob', online: false },
    ]);
  });
});
