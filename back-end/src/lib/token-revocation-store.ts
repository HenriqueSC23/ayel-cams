import { query } from '../db/client.js';

let lastExpiredTokenCleanupAt = 0;
const cleanupIntervalMs = 60_000;

async function cleanupExpiredRevokedTokens() {
  const now = Date.now();
  if (now - lastExpiredTokenCleanupAt < cleanupIntervalMs) {
    return;
  }

  lastExpiredTokenCleanupAt = now;
  await query('DELETE FROM revoked_tokens WHERE expires_at <= NOW()');
}

export async function revokeTokenId(tokenId: string, exp: number) {
  const expiresAt = new Date(exp * 1000);

  await query(
    `
      INSERT INTO revoked_tokens (token_id, expires_at)
      VALUES ($1, $2)
      ON CONFLICT (token_id)
      DO UPDATE SET expires_at = EXCLUDED.expires_at
    `,
    [tokenId, expiresAt],
  );

  await cleanupExpiredRevokedTokens();
}

export async function isTokenIdRevoked(tokenId: string) {
  await cleanupExpiredRevokedTokens();

  const result = await query<{ is_revoked: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM revoked_tokens
        WHERE token_id = $1
          AND expires_at > NOW()
      ) AS is_revoked
    `,
    [tokenId],
  );

  return Boolean(result.rows[0]?.is_revoked);
}

export async function clearRevokedTokenStore() {
  await query('DELETE FROM revoked_tokens');
}
