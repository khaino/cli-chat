import { loadConfig } from '../../../src/config/index.js';

describe('frontend loadConfig', () => {
  test('defaults to localhost:3000 for both URLs', () => {
    const cfg = loadConfig({});
    expect(cfg.apiUrl).toBe('http://localhost:3000');
    expect(cfg.socketUrl).toBe('http://localhost:3000');
  });

  test('CLI_CHAT_API_URL overrides both URLs by default', () => {
    const cfg = loadConfig({ CLI_CHAT_API_URL: 'http://example.com' });
    expect(cfg.apiUrl).toBe('http://example.com');
    expect(cfg.socketUrl).toBe('http://example.com');
  });

  test('CLI_CHAT_SOCKET_URL takes precedence for socket', () => {
    const cfg = loadConfig({
      CLI_CHAT_API_URL: 'http://example.com',
      CLI_CHAT_SOCKET_URL: 'http://socket.example.com',
    });
    expect(cfg.apiUrl).toBe('http://example.com');
    expect(cfg.socketUrl).toBe('http://socket.example.com');
  });
});
