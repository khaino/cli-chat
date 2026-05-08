export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface Config {
  port: number;
  dbPath: string;
  saltRounds: number;
  cors: { origin: string };
  seed: { password: string };
  logger: { level: LogLevel };
}

const DEFAULTS = {
  port: 3000,
  dbPath: 'cli-chat.db',
  saltRounds: 10,
  corsOrigin: '*',
  seedPassword: 'password123',
  logLevel: 'info' as LogLevel,
};

function parseInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseLogLevel(value: string | undefined, fallback: LogLevel): LogLevel {
  const allowed: LogLevel[] = ['debug', 'info', 'warn', 'error', 'silent'];
  if (value && (allowed as string[]).includes(value)) {
    return value as LogLevel;
  }
  return fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: parseInt(env.PORT, DEFAULTS.port),
    dbPath: env.DB_PATH ?? DEFAULTS.dbPath,
    saltRounds: parseInt(env.SALT_ROUNDS, DEFAULTS.saltRounds),
    cors: { origin: env.CORS_ORIGIN ?? DEFAULTS.corsOrigin },
    seed: {
      password: env.SEED_PASSWORD ?? DEFAULTS.seedPassword,
    },
    logger: { level: parseLogLevel(env.LOG_LEVEL, DEFAULTS.logLevel) },
  };
}
