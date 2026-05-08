import type { LogLevel } from '../config/index.js';

export interface Logger {
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

export function createConsoleLogger(level: LogLevel = 'info'): Logger {
  const threshold = LEVEL_PRIORITY[level];

  const log = (lvl: Exclude<LogLevel, 'silent'>, message: string, meta?: unknown) => {
    if (LEVEL_PRIORITY[lvl] < threshold) return;
    const ts = new Date().toISOString();
    const prefix = `[${ts}] ${lvl.toUpperCase()}`;
    if (meta !== undefined) {
      console.log(`${prefix} ${message}`, meta);
    } else {
      console.log(`${prefix} ${message}`);
    }
  };

  return {
    debug: (msg, meta) => log('debug', msg, meta),
    info: (msg, meta) => log('info', msg, meta),
    warn: (msg, meta) => log('warn', msg, meta),
    error: (msg, meta) => log('error', msg, meta),
  };
}

export const silentLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};
