#!/usr/bin/env node
import { existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const force = process.argv.includes('--force');
const requested = force || process.env.npm_config_clear === 'true' || process.env.npm_config_clear === '1';

if (!requested) {
  process.exit(0);
}

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(here, '..');
const dbPath = process.env.DB_PATH ?? 'cli-chat.db';
const absoluteDbPath = resolve(backendRoot, dbPath);

const candidates = [
  absoluteDbPath,
  `${absoluteDbPath}-journal`,
  `${absoluteDbPath}-wal`,
  `${absoluteDbPath}-shm`,
];

let removed = 0;
for (const candidate of candidates) {
  if (existsSync(candidate)) {
    rmSync(candidate);
    console.log(`[db:clear] removed ${candidate}`);
    removed += 1;
  }
}

if (removed === 0) {
  console.log(`[db:clear] no database files at ${absoluteDbPath}`);
}
