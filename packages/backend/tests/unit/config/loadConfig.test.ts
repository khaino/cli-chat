import { loadConfig } from '../../../src/config/index.js';

describe('loadConfig', () => {
  test('returns defaults for empty env', () => {
    const cfg = loadConfig({});
    expect(cfg.port).toBe(3000);
    expect(cfg.dbPath).toBe('cli-chat.db');
    expect(cfg.saltRounds).toBe(10);
    expect(cfg.cors.origin).toBe('*');
    expect(cfg.seed.password).toBe('password123');
    expect(cfg.logger.level).toBe('info');
  });

  test('overrides via env', () => {
    const cfg = loadConfig({
      PORT: '4242',
      DB_PATH: '/tmp/x.db',
      SALT_ROUNDS: '6',
      CORS_ORIGIN: 'https://example.com',
      SEED_PASSWORD: 'hunter2',
      LOG_LEVEL: 'debug',
    });
    expect(cfg.port).toBe(4242);
    expect(cfg.dbPath).toBe('/tmp/x.db');
    expect(cfg.saltRounds).toBe(6);
    expect(cfg.cors.origin).toBe('https://example.com');
    expect(cfg.seed.password).toBe('hunter2');
    expect(cfg.logger.level).toBe('debug');
  });

  test('falls back when PORT is non-numeric', () => {
    const cfg = loadConfig({ PORT: 'not-a-number' });
    expect(cfg.port).toBe(3000);
  });

  test('falls back to info when LOG_LEVEL is invalid', () => {
    const cfg = loadConfig({ LOG_LEVEL: 'verbose' });
    expect(cfg.logger.level).toBe('info');
  });
});
