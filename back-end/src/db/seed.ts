import type { PoolClient } from 'pg';
import { query, withTransaction } from './client.js';
import { seedCameras, seedUsers } from './seed-data.js';
import { encryptStreamUrl } from '../lib/stream-url-crypto.js';

async function seedUsersTable(client: PoolClient) {
  for (const user of seedUsers) {
    await client.query(
      `
        INSERT INTO users (
          id,
          name,
          email,
          role,
          password_hash,
          profile,
          status,
          access,
          last_access,
          unit,
          avatar,
          phone,
          company,
          job_title,
          preferences
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb
        )
        ON CONFLICT (id) DO NOTHING
      `,
      [
        user.id,
        user.name,
        user.email,
        user.role,
        user.passwordHash,
        user.profile,
        user.status,
        user.access,
        user.lastAccess,
        user.unit,
        user.avatar,
        user.phone,
        user.company,
        user.jobTitle,
        JSON.stringify(user.preferences),
      ],
    );
  }
}

async function seedCamerasTable(client: PoolClient) {
  const seedCameraIds = seedCameras.map((camera) => camera.id);

  if (seedCameraIds.length > 0) {
    await client.query('DELETE FROM cameras WHERE NOT (id = ANY($1::text[]))', [seedCameraIds]);
  } else {
    await client.query('DELETE FROM cameras');
  }

  for (const camera of seedCameras) {
    const encryptedStream = encryptStreamUrl(camera.streamUrl);

    await client.query(
      `
        INSERT INTO cameras (
          id,
          name,
          location,
          unit,
          category,
          access,
          status,
          quality,
          image,
          stream_url,
          stream_url_encrypted,
          stream_url_iv,
          stream_url_tag,
          stream_url_key_version,
          description,
          updated_at_label
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, '', $10, $11, $12, $13, $14, $15
        )
        ON CONFLICT (id) DO UPDATE
        SET
          name = EXCLUDED.name,
          location = EXCLUDED.location,
          unit = EXCLUDED.unit,
          category = EXCLUDED.category,
          access = EXCLUDED.access,
          status = EXCLUDED.status,
          quality = EXCLUDED.quality,
          image = EXCLUDED.image,
          stream_url = '',
          stream_url_encrypted = EXCLUDED.stream_url_encrypted,
          stream_url_iv = EXCLUDED.stream_url_iv,
          stream_url_tag = EXCLUDED.stream_url_tag,
          stream_url_key_version = EXCLUDED.stream_url_key_version,
          description = EXCLUDED.description,
          updated_at_label = EXCLUDED.updated_at_label,
          updated_at = NOW()
      `,
      [
        camera.id,
        camera.name,
        camera.location,
        camera.unit,
        camera.category,
        camera.access,
        camera.status,
        camera.quality,
        camera.image,
        encryptedStream.encrypted,
        encryptedStream.iv,
        encryptedStream.authTag,
        encryptedStream.keyVersion,
        camera.description,
        camera.updatedAt,
      ],
    );
  }
}

export async function seedDatabase() {
  await withTransaction(async (client) => {
    await seedUsersTable(client);
    await seedCamerasTable(client);
  });
}

export async function hasSeedData() {
  const [usersResult, camerasResult] = await Promise.all([
    query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users'),
    query<{ count: string }>('SELECT COUNT(*)::text AS count FROM cameras'),
  ]);

  return Number(usersResult.rows[0]?.count || '0') > 0 && Number(camerasResult.rows[0]?.count || '0') > 0;
}
