import { BcryptHasher } from '../../../src/auth/PasswordHasher.js';

describe('BcryptHasher', () => {
  const hasher = new BcryptHasher(4);

  test('hashes a password to a different value', async () => {
    const hash = await hasher.hash('mySecret');
    expect(hash).not.toBe('mySecret');
    expect(hash.length).toBeGreaterThan(0);
  });

  test('produces different hashes for the same password', async () => {
    const a = await hasher.hash('same');
    const b = await hasher.hash('same');
    expect(a).not.toBe(b);
  });

  test('verify returns true for matching password', async () => {
    const hash = await hasher.hash('correct');
    expect(await hasher.verify('correct', hash)).toBe(true);
  });

  test('verify returns false for wrong password', async () => {
    const hash = await hasher.hash('correct');
    expect(await hasher.verify('wrong', hash)).toBe(false);
  });

  test('verify returns false for empty password', async () => {
    const hash = await hasher.hash('something');
    expect(await hasher.verify('', hash)).toBe(false);
  });
});
