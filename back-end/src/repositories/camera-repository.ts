import type { CameraRecord } from '../types/domain-types.js';
import { query } from '../db/client.js';

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
  streamUrl: string;
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
    stream_url AS "streamUrl",
    description,
    updated_at_label AS "updatedAt"
  FROM cameras
`;

function mapCameraRow(row: CameraRow): CameraRecord {
  return row;
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
        description,
        updated_at_label
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
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
      camera.streamUrl,
      camera.description,
      camera.updatedAt,
    ],
  );

  return camera;
}

export async function updateCameraInDb(camera: CameraRecord) {
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
        stream_url = $10,
        description = $11,
        updated_at_label = $12,
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
        stream_url AS "streamUrl",
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
      camera.streamUrl,
      camera.description,
      camera.updatedAt,
    ],
  );

  return result.rows[0] ? mapCameraRow(result.rows[0]) : null;
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
