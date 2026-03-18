import 'dotenv/config';
import { closePool } from './client.js';
import { migrateDown, migrateUp } from './migration-runner.js';
import { seedDatabase } from './seed.js';

async function run() {
  const command = process.argv[2] || 'up';
  const maybeSteps = process.argv[3];

  if (command === 'up') {
    const appliedCount = await migrateUp();
    // eslint-disable-next-line no-console
    console.log(`[db] migracoes aplicadas: ${appliedCount}`);
    return;
  }

  if (command === 'down') {
    const parsedSteps = Number(maybeSteps || '1');
    const revertedCount = await migrateDown(parsedSteps);
    // eslint-disable-next-line no-console
    console.log(`[db] migracoes revertidas: ${revertedCount}`);
    return;
  }

  if (command === 'seed') {
    await seedDatabase();
    // eslint-disable-next-line no-console
    console.log('[db] seed concluido.');
    return;
  }

  throw new Error(`Comando de banco invalido: ${command}. Use "up", "down" ou "seed".`);
}

run()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('[db] erro ao executar comando:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
