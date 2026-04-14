import type { AuthRole } from '../types/domain-types.js';
import { query } from '../db/client.js';

interface StreamPlaySessionRow {
  jti: string;
  userId: string;
  cameraId: string;
  role: AuthRole;
  expiresAt: Date;
  fingerprintHash: string | null;
  activatedAt: Date | null;
  lastSeenAt: Date | null;
  revokedAt: Date | null;
  isActive: boolean;
}

const selectSessionColumns = `
  SELECT
    jti,
    user_id AS "userId",
    camera_id AS "cameraId",
    role,
    expires_at AS "expiresAt",
    fingerprint_hash AS "fingerprintHash",
    activated_at AS "activatedAt",
    last_seen_at AS "lastSeenAt",
    revoked_at AS "revokedAt",
    is_active AS "isActive"
  FROM stream_play_sessions
`;

let lastCleanupAtMs = 0;
const cleanupIntervalMs = 60_000;

async function cleanupExpiredSessions() {
  const now = Date.now();
  if (now - lastCleanupAtMs < cleanupIntervalMs) {
    return;
  }

  lastCleanupAtMs = now;
  await query(
    `
      DELETE FROM stream_play_sessions
      WHERE expires_at <= NOW()
         OR revoked_at IS NOT NULL
    `,
  );
}

export async function createStreamPlaySession(input: {
  tokenId: string;
  userId: string;
  cameraId: string;
  role: AuthRole;
  expiresAt: Date;
}) {
  await cleanupExpiredSessions();
  await query(
    `
      INSERT INTO stream_play_sessions (
        jti,
        user_id,
        camera_id,
        role,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (jti) DO UPDATE
      SET
        user_id = EXCLUDED.user_id,
        camera_id = EXCLUDED.camera_id,
        role = EXCLUDED.role,
        expires_at = EXCLUDED.expires_at,
        fingerprint_hash = NULL,
        activated_at = NULL,
        last_seen_at = NULL,
        revoked_at = NULL,
        is_active = FALSE
    `,
    [input.tokenId, input.userId, input.cameraId, input.role, input.expiresAt],
  );
}

export async function findStreamPlaySessionByTokenId(tokenId: string) {
  await cleanupExpiredSessions();
  const result = await query<StreamPlaySessionRow>(`${selectSessionColumns} WHERE jti = $1 LIMIT 1`, [tokenId]);
  return result.rows[0] || null;
}

export async function activateStreamPlaySession(tokenId: string, fingerprintHash: string) {
  const result = await query(
    `
      UPDATE stream_play_sessions
      SET
        is_active = TRUE,
        fingerprint_hash = COALESCE(fingerprint_hash, $2),
        activated_at = COALESCE(activated_at, NOW()),
        last_seen_at = NOW()
      WHERE jti = $1
        AND revoked_at IS NULL
        AND expires_at > NOW()
        AND is_active = FALSE
        AND (fingerprint_hash IS NULL OR fingerprint_hash = $2)
    `,
    [tokenId, fingerprintHash],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function touchStreamPlaySession(tokenId: string) {
  await query(
    `
      UPDATE stream_play_sessions
      SET last_seen_at = NOW()
      WHERE jti = $1
        AND revoked_at IS NULL
        AND expires_at > NOW()
    `,
    [tokenId],
  );
}

export async function completeStreamPlaySession(tokenId: string) {
  await query(
    `
      UPDATE stream_play_sessions
      SET
        is_active = FALSE,
        revoked_at = NOW(),
        last_seen_at = NOW()
      WHERE jti = $1
    `,
    [tokenId],
  );
}

export async function countActiveStreamSessionsForUserCamera(userId: string, cameraId: string) {
  await cleanupExpiredSessions();
  const result = await query<{ total: string }>(
    `
      SELECT COUNT(*)::text AS total
      FROM stream_play_sessions
      WHERE user_id = $1
        AND camera_id = $2
        AND revoked_at IS NULL
        AND expires_at > NOW()
    `,
    [userId, cameraId],
  );

  return Number(result.rows[0]?.total || '0');
}

export async function clearStreamPlaySessions() {
  await query('DELETE FROM stream_play_sessions');
}
