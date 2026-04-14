CREATE TABLE IF NOT EXISTS revoked_tokens (
  token_id TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS revoked_tokens_expires_at_idx ON revoked_tokens (expires_at);
