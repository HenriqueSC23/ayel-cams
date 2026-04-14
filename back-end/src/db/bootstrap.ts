import { migrateUp } from './migration-runner.js';
import { seedDatabase } from './seed.js';
import { migrateLegacyPlaintextStreamUrls } from '../repositories/camera-repository.js';

function asBoolean(value: string | undefined, fallback: boolean) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

export async function initializeDatabase() {
  const shouldAutoMigrate = asBoolean(process.env.DB_AUTO_MIGRATE, true);
  const shouldAutoSeed = asBoolean(process.env.DB_AUTO_SEED, true);

  if (shouldAutoMigrate) {
    await migrateUp();
  }

  if (!shouldAutoSeed) {
    return;
  }

  await seedDatabase();
  await migrateLegacyPlaintextStreamUrls();
}
