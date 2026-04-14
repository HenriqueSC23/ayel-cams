import type { CameraRecord } from '../types/domain-types.js';
import { query } from '../db/client.js';
import { decryptStreamUrl, encryptStreamUrl } from '../lib/stream-url-crypto.js';

interface CameraRow {
  id: string;
  name: string;
  location: string;
  unit: string;
  category: string;
  access: 'public' | 'restricted';
  status: 'live' | 'offline';
  quality: 'HD' | 'FHD' | '4K';
  image: string;
  streamUrlPlain: string;
  streamUrlEncrypted: string;
  streamUrlIv: string;
  streamUrlTag: string;
  streamUrlKeyVersion: number;
  description: string;
  updatedAt: string;
}

const selectCameraColumns = `
  SELECT
    id,
    name,
    location,
    unit,
    category,
    access,
    status,
    quality,
    image,
    stream_url AS "streamUrlPlain",
    stream_url_encrypted AS "streamUrlEncrypted",
    stream_url_iv AS "streamUrlIv",
    stream_url_tag AS "streamUrlTag",
    stream_url_key_version AS "streamUrlKeyVersion",
    description,
    updated_at_label AS "updatedAt"
  FROM cameras
`;

function mapCameraRow(row: CameraRow): CameraRecord {
  let streamUrl = '';

  if (row.streamUrlEncrypted && row.streamUrlIv && row.streamUrlTag) {
    try {
      streamUrl = decryptStreamUrl({
        encrypted: row.streamUrlEncrypted,
        iv: row.streamUrlIv,
        authTag: row.streamUrlTag,
        keyVersion: row.streamUrlKeyVersion,
      });
    } catch {
      streamUrl = '';
    }
  } else {
    streamUrl = row.streamUrlPlain || '';
  }

  return {
    id: row.id,
    name: row.name,
    location: row.location,
    unit: row.unit,
    category: row.category,
    access: row.access,
    status: row.status,
    quality: row.quality,
    image: row.image,
    streamUrl,
    description: row.description,
    updatedAt: row.updatedAt,
  };
}

export async function listCamerasFromDb() {
  const result = await query<CameraRow>(`${selectCameraColumns} ORDER BY id ASC`);
  return result.rows.map(mapCameraRow);
}

export async function findCameraByIdFromDb(cameraId: string) {
  const result = await query<CameraRow>(`${selectCameraColumns} WHERE id = $1 LIMIT 1`, [cameraId]);
  return result.rows[0] ? mapCameraRow(result.rows[0]) : undefined;
}

export async function insertCameraToDb(camera: CameraRecord) {
  const encryptedStream = encryptStreamUrl(camera.streamUrl);

  await query(
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

  return camera;
}

export async function updateCameraInDb(camera: CameraRecord) {
  const encryptedStream = encryptStreamUrl(camera.streamUrl);

  const result = await query<CameraRow>(
    `
      UPDATE cameras
      SET
        name = $2,
        location = $3,
        unit = $4,
        category = $5,
        access = $6,
        status = $7,
        quality = $8,
        image = $9,
        stream_url = '',
        stream_url_encrypted = $10,
        stream_url_iv = $11,
        stream_url_tag = $12,
        stream_url_key_version = $13,
        description = $14,
        updated_at_label = $15,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        name,
        location,
        unit,
        category,
        access,
        status,
        quality,
        image,
        stream_url AS "streamUrlPlain",
        stream_url_encrypted AS "streamUrlEncrypted",
        stream_url_iv AS "streamUrlIv",
        stream_url_tag AS "streamUrlTag",
        stream_url_key_version AS "streamUrlKeyVersion",
        description,
        updated_at_label AS "updatedAt"
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

  return result.rows[0] ? mapCameraRow(result.rows[0]) : null;
}

export async function migrateLegacyPlaintextStreamUrls() {
  const result = await query<{
    id: string;
    streamUrlPlain: string;
    streamUrlEncrypted: string;
  }>(
    `
      SELECT
        id,
        stream_url AS "streamUrlPlain",
        stream_url_encrypted AS "streamUrlEncrypted"
      FROM cameras
      WHERE stream_url <> ''
    `,
  );

  for (const row of result.rows) {
    if (row.streamUrlEncrypted) {
      continue;
    }

    const encryptedStream = encryptStreamUrl(row.streamUrlPlain);
    await query(
      `
        UPDATE cameras
        SET
          stream_url = '',
          stream_url_encrypted = $2,
          stream_url_iv = $3,
          stream_url_tag = $4,
          stream_url_key_version = $5,
          updated_at = NOW()
        WHERE id = $1
      `,
      [row.id, encryptedStream.encrypted, encryptedStream.iv, encryptedStream.authTag, encryptedStream.keyVersion],
    );
  }
}

export async function removeCameraFromDb(cameraId: string) {
  const result = await query('DELETE FROM cameras WHERE id = $1', [cameraId]);
  return (result.rowCount ?? 0) > 0;
}

export async function getNextCameraIdFromDb() {
  const result = await query<{ nextId: number }>(
    `
      SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM '[0-9]+$') AS INTEGER)), 0) + 1 AS "nextId"
      FROM cameras
    `,
  );

  return `cam-${String(result.rows[0]?.nextId || 1).padStart(3, '0')}`;
}
