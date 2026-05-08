import type { SafeUser } from '@cli-chat/shared';
import type { UserRepository } from '../database/repositories/UserRepository.js';
import type { PasswordHasher } from './PasswordHasher.js';

export type LoginFailureReason = 'missing-fields' | 'invalid-credentials';

export type LoginResult =
  | { ok: true; user: SafeUser }
  | { ok: false; reason: LoginFailureReason };

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher
  ) {}

  async login(username: string, password: string): Promise<LoginResult> {
    if (!username || !password) {
      return { ok: false, reason: 'missing-fields' };
    }

    const record = this.users.getByUsername(username);
    if (!record) {
      return { ok: false, reason: 'invalid-credentials' };
    }

    const valid = await this.hasher.verify(password, record.password);
    if (!valid) {
      return { ok: false, reason: 'invalid-credentials' };
    }

    const safeUser: SafeUser = {
      id: record.id,
      username: record.username,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
    return { ok: true, user: safeUser };
  }
}
