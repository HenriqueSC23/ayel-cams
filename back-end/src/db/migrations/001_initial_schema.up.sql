CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('cliente', 'administrador')),
  password_hash TEXT NOT NULL,
  profile TEXT NOT NULL CHECK (profile IN ('Administrador', 'Cliente')),
  status TEXT NOT NULL CHECK (status IN ('Ativo', 'Inativo')),
  access TEXT NOT NULL CHECK (access IN ('Administrador', 'Area restrita', 'Sem acesso')),
  last_access TEXT NOT NULL,
  unit TEXT NOT NULL,
  avatar TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL,
  job_title TEXT NOT NULL,
  preferences JSONB NOT NULL DEFAULT '{"notifyAlerts":true,"prioritizeFavorites":true,"rememberLastView":true,"preferGridView":true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);
CREATE INDEX IF NOT EXISTS users_status_idx ON users (status);

CREATE TABLE IF NOT EXISTS cameras (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  unit TEXT NOT NULL,
  category TEXT NOT NULL,
  access TEXT NOT NULL CHECK (access IN ('public', 'restricted')),
  status TEXT NOT NULL CHECK (status IN ('live', 'offline')),
  quality TEXT NOT NULL CHECK (quality IN ('HD', 'FHD', '4K')),
  image TEXT NOT NULL,
  stream_url TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  updated_at_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cameras_access_idx ON cameras (access);
CREATE INDEX IF NOT EXISTS cameras_status_idx ON cameras (status);
CREATE INDEX IF NOT EXISTS cameras_category_idx ON cameras (category);
