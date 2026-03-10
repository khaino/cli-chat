import { hashPassword, verifyPassword } from '../src/utils/password.js';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    test('should hash a password', async () => {
      const password = 'mySecretPassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    test('should generate different hashes for same password', async () => {
      const password = 'mySecretPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    test('should return true for correct password', async () => {
      const password = 'mySecretPassword123';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    test('should return false for incorrect password', async () => {
      const password = 'mySecretPassword123';
      const wrongPassword = 'wrongPassword';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });

    test('should return false for empty password', async () => {
      const hash = await hashPassword('somePassword');
      
      const isValid = await verifyPassword('', hash);
      
      expect(isValid).toBe(false);
    });
  });
});
