import { afterAll, beforeAll, beforeEach } from 'vitest';
import { closePool, query } from '../src/db/client.js';
import { migrateUp } from '../src/db/migration-runner.js';
import { seedDatabase } from '../src/db/seed.js';

process.env.NODE_ENV = 'test';
process.env.DB_AUTO_MIGRATE = 'true';
process.env.DB_AUTO_SEED = 'false';

beforeAll(async () => {
  await migrateUp();
});

beforeEach(async () => {
  await query('TRUNCATE TABLE cameras, users RESTART IDENTITY CASCADE');
  await seedDatabase();
});

afterAll(async () => {
  await closePool();
});
