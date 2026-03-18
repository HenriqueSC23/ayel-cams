import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PoolClient } from 'pg';
import { withTransaction } from './client.js';

interface MigrationFilePair {
  id: string;
  upPath: string;
  downPath: string;
}

interface MigrationRow {
  id: string;
  applied_at: Date;
}

function getMigrationsDirectoryPath() {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  return path.join(currentDirectory, 'migrations');
}

function parseMigrationFileName(fileName: string) {
  const match = fileName.match(/^(\d+_[a-z0-9_-]+)\.(up|down)\.sql$/i);
  if (!match) {
    return null;
  }

  return { id: match[1], direction: match[2] as 'up' | 'down' };
}

async function listMigrationPairs() {
  const directoryPath = getMigrationsDirectoryPath();
  const fileNames = await readdir(directoryPath);
  const byId = new Map<string, Partial<MigrationFilePair>>();

  for (const fileName of fileNames) {
    const parsed = parseMigrationFileName(fileName);
    if (!parsed) {
      continue;
    }

    const current = byId.get(parsed.id) || { id: parsed.id };
    const absolutePath = path.join(directoryPath, fileName);

    if (parsed.direction === 'up') {
      current.upPath = absolutePath;
    } else {
      current.downPath = absolutePath;
    }

    byId.set(parsed.id, current);
  }

  const pairs = Array.from(byId.values())
    .filter((item): item is MigrationFilePair => Boolean(item.id && item.upPath && item.downPath))
    .sort((left, right) => left.id.localeCompare(right.id));

  return pairs;
}

async function ensureMigrationsTable(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function listAppliedMigrations(client: PoolClient) {
  const result = await client.query<MigrationRow>('SELECT id, applied_at FROM schema_migrations ORDER BY id ASC');
  return result.rows;
}

async function executeSqlFile(client: PoolClient, absolutePath: string) {
  const sql = await readFile(absolutePath, 'utf-8');
  await client.query(sql);
}

export async function migrateUp() {
  const migrationPairs = await listMigrationPairs();

  return withTransaction(async (client) => {
    await ensureMigrationsTable(client);

    const applied = await listAppliedMigrations(client);
    const appliedIds = new Set(applied.map((item) => item.id));
    let appliedCount = 0;

    for (const migration of migrationPairs) {
      if (appliedIds.has(migration.id)) {
        continue;
      }

      await executeSqlFile(client, migration.upPath);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [migration.id]);
      appliedCount += 1;
    }

    return appliedCount;
  });
}

export async function migrateDown(steps = 1) {
  if (!Number.isInteger(steps) || steps <= 0) {
    throw new Error('Quantidade de passos para rollback deve ser um inteiro positivo.');
  }

  const migrationPairs = await listMigrationPairs();
  const byId = new Map(migrationPairs.map((item) => [item.id, item]));

  return withTransaction(async (client) => {
    await ensureMigrationsTable(client);
    const applied = await listAppliedMigrations(client);
    const targets = applied.slice(-steps).reverse();
    let revertedCount = 0;

    for (const migration of targets) {
      const pair = byId.get(migration.id);
      if (!pair) {
        throw new Error(`Arquivo de rollback nao encontrado para migracao ${migration.id}.`);
      }

      await executeSqlFile(client, pair.downPath);
      await client.query('DELETE FROM schema_migrations WHERE id = $1', [migration.id]);
      revertedCount += 1;
    }

    return revertedCount;
  });
}
