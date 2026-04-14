ALTER TABLE cameras
  ADD COLUMN IF NOT EXISTS stream_url_encrypted TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS stream_url_iv TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS stream_url_tag TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS stream_url_key_version INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS stream_play_sessions (
  jti TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  camera_id TEXT NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('cliente', 'administrador')),
  expires_at TIMESTAMPTZ NOT NULL,
  fingerprint_hash TEXT,
  activated_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stream_play_sessions_user_camera_idx
  ON stream_play_sessions (user_id, camera_id);

CREATE INDEX IF NOT EXISTS stream_play_sessions_expires_at_idx
  ON stream_play_sessions (expires_at);
