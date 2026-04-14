DROP TABLE IF EXISTS stream_play_sessions;

ALTER TABLE cameras
  DROP COLUMN IF EXISTS stream_url_key_version,
  DROP COLUMN IF EXISTS stream_url_tag,
  DROP COLUMN IF EXISTS stream_url_iv,
  DROP COLUMN IF EXISTS stream_url_encrypted;
