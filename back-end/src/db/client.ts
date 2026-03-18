import { Pool, type PoolClient, type QueryResultRow } from 'pg';

const defaultDevelopmentDatabaseName = 'ayel_cams';

function buildPoolConfig() {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (connectionString) {
    return { connectionString };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL obrigatorio em producao para conexao com PostgreSQL.');
  }

  return {
    host: process.env.PGHOST || '127.0.0.1',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || defaultDevelopmentDatabaseName,
  };
}

const pool = new Pool(buildPoolConfig());

export function getPool() {
  return pool;
}

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  return pool.query<T>(text, params);
}

export async function withTransaction<T>(executor: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await executor(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool.end();
}
