import { AuthService } from '../../../src/auth/AuthService.js';
import type { UserRepository } from '../../../src/database/repositories/UserRepository.js';
import type { PasswordHasher } from '../../../src/auth/PasswordHasher.js';
import type { UserRecord } from '../../../src/database/types.js';

const fakeHasher: PasswordHasher = {
  hash: async (p) => `hashed(${p})`,
  verify: async (p, h) => h === `hashed(${p})`,
};

function fakeRepo(record: UserRecord | null): UserRepository {
  return {
    getByUsername: () => record,
  } as unknown as UserRepository;
}

const aliceRecord: UserRecord = {
  id: 'u1',
  username: 'alice',
  password: 'hashed(pw)',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

describe('AuthService.login', () => {
  test('returns missing-fields when username is empty', async () => {
    const svc = new AuthService(fakeRepo(aliceRecord), fakeHasher);
    expect(await svc.login('', 'pw')).toEqual({ ok: false, reason: 'missing-fields' });
  });

  test('returns missing-fields when password is empty', async () => {
    const svc = new AuthService(fakeRepo(aliceRecord), fakeHasher);
    expect(await svc.login('alice', '')).toEqual({ ok: false, reason: 'missing-fields' });
  });

  test('returns invalid-credentials when user does not exist', async () => {
    const svc = new AuthService(fakeRepo(null), fakeHasher);
    expect(await svc.login('ghost', 'pw')).toEqual({
      ok: false,
      reason: 'invalid-credentials',
    });
  });

  test('returns invalid-credentials when password mismatches', async () => {
    const svc = new AuthService(fakeRepo(aliceRecord), fakeHasher);
    expect(await svc.login('alice', 'wrong')).toEqual({
      ok: false,
      reason: 'invalid-credentials',
    });
  });

  test('returns SafeUser without password on success', async () => {
    const svc = new AuthService(fakeRepo(aliceRecord), fakeHasher);
    const result = await svc.login('alice', 'pw');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.id).toBe('u1');
      expect(result.user.username).toBe('alice');
      expect((result.user as unknown as { password?: string }).password).toBeUndefined();
    }
  });
});
