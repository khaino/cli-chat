import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { loadConfig } from '../src/config/index.js';
import { createDatabase } from '../src/database/connection.js';
import { BcryptHasher } from '../src/auth/PasswordHasher.js';
import { seedDummyUsers } from '../src/database/seed.js';
import { createConsoleLogger } from '../src/shared-infra/logger.js';
import { dummyUsers } from '../src/database/schema.js';

async function promptYesNo(question: string, defaultYes = false): Promise<boolean> {
  const yn = defaultYes ? 'Y/n' : 'y/N';
  if (!input.isTTY) {
    return defaultYes;
  }
  const rl = readline.createInterface({ input, output });
  try {
    const raw = (await rl.question(`${question} [${yn}] `)).trim().toLowerCase();
    if (!raw) return defaultYes;
    return raw === 'y' || raw === 'yes';
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const force = args.has('--yes') || args.has('-y');

  const cfg = loadConfig();
  const logger = createConsoleLogger(cfg.logger.level);
  const db = createDatabase({ path: cfg.dbPath });

  try {
    const row = db
      .prepare('SELECT COUNT(*) AS count FROM users')
      .get() as { count: number };

    if (row.count > 0) {
      logger.info(
        `Database already has ${row.count} user(s); skipping seed.`
      );
      return;
    }

    let proceed = force;
    if (!proceed) {
      proceed = await promptYesNo(
        `Seed ${dummyUsers.length} dummy users into '${cfg.dbPath}'?`,
        false
      );
    }

    if (!proceed) {
      logger.info('Seed declined.');
      return;
    }

    const hasher = new BcryptHasher(cfg.saltRounds);
    await seedDummyUsers(db, hasher, { password: cfg.seed.password }, logger);
  } finally {
    db.close();
  }
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
