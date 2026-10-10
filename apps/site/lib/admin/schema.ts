// Таблицы админки. Содержимое сайта лежит в файлах репозитория; всё, что правят в админке, — поверх них, в этих таблицах.
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'manager',
  pass_hash text,
  totp_secret text,
  totp_on boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  invite_hash text,
  invite_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'full',
  expires_at timestamptz NOT NULL,
  ip text,
  ua text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS login_attempts (
  id bigserial PRIMARY KEY,
  key text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_attempts_key ON login_attempts(key, at);
CREATE TABLE IF NOT EXISTS pages (
  lang text NOT NULL,
  path text NOT NULL,
  published jsonb,
  draft jsonb,
  publish_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text,
  PRIMARY KEY (lang, path)
);
CREATE TABLE IF NOT EXISTS page_versions (
  id bigserial PRIMARY KEY,
  lang text NOT NULL,
  path text NOT NULL,
  data jsonb NOT NULL,
  note text,
  at timestamptz NOT NULL DEFAULT now(),
  by text
);
CREATE INDEX IF NOT EXISTS page_versions_key ON page_versions(lang, path, id DESC);
CREATE TABLE IF NOT EXISTS fleet_overrides (
  slug text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);
CREATE TABLE IF NOT EXISTS reviews (
  id bigserial PRIMARY KEY,
  key text UNIQUE NOT NULL,
  source text NOT NULL,
  name text NOT NULL,
  date_text text NOT NULL DEFAULT '',
  text text NOT NULL,
  url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  origin text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  updated_by text
);
CREATE INDEX IF NOT EXISTS reviews_status ON reviews(status, published_at DESC);
CREATE TABLE IF NOT EXISTS media (
  id text PRIMARY KEY,
  name text NOT NULL,
  mime text NOT NULL,
  w int,
  h int,
  bytes bytea NOT NULL,
  size int NOT NULL,
  at timestamptz NOT NULL DEFAULT now(),
  by text
);
CREATE TABLE IF NOT EXISTS leads (
  id text PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'new',
  reason text,
  assignee uuid REFERENCES users(id) ON DELETE SET NULL,
  comment text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leads_at ON leads(at DESC);
CREATE TABLE IF NOT EXISTS audit (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  user_email text,
  role text,
  action text NOT NULL,
  entity text,
  entity_id text,
  before jsonb,
  after jsonb,
  ip text
);
CREATE INDEX IF NOT EXISTS audit_at ON audit(at DESC);
`;
