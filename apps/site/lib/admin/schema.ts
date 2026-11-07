import { DEFAULT_ROLES } from "./roles";

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
-- поля для фильтров и отчётов (заполняются при приёме заявки; старые дозаполняются из data)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS channel text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS src_group text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lang text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'form';
CREATE INDEX IF NOT EXISTS leads_channel ON leads(channel);
-- файлы: в бакете Railway (storage = 's3') или в базе (storage = 'db')
ALTER TABLE media ALTER COLUMN bytes DROP NOT NULL;
ALTER TABLE media ADD COLUMN IF NOT EXISTS storage text NOT NULL DEFAULT 'db';
ALTER TABLE media ADD COLUMN IF NOT EXISTS s3_key text;
ALTER TABLE media ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'library';
-- чаты: сайт, Telegram, MAX, WhatsApp (Wazzup). Каждый диалог связан с заявкой.
CREATE TABLE IF NOT EXISTS chats (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  channel text NOT NULL,
  ext_id text,
  token text,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  lang text,
  lead_id text,
  status text NOT NULL DEFAULT 'open',
  unread int NOT NULL DEFAULT 0,
  assignee uuid REFERENCES users(id) ON DELETE SET NULL,
  last_text text NOT NULL DEFAULT '',
  last_dir text,
  meta jsonb NOT NULL DEFAULT '{}'
);
CREATE UNIQUE INDEX IF NOT EXISTS chats_ext ON chats(channel, ext_id) WHERE ext_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS chats_updated ON chats(updated_at DESC);
CREATE TABLE IF NOT EXISTS chat_messages (
  id bigserial PRIMARY KEY,
  chat_id text NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  at timestamptz NOT NULL DEFAULT now(),
  dir text NOT NULL,
  text text NOT NULL,
  author text,
  ext_id text,
  error text
);
CREATE INDEX IF NOT EXISTS chat_messages_chat ON chat_messages(chat_id, id);
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

-- ── роли с настраиваемыми правами, вход по логину ──
CREATE TABLE IF NOT EXISTS roles (
  id text PRIMARY KEY,
  name text NOT NULL,
  perms jsonb NOT NULL DEFAULT '{}',
  lead_scope text NOT NULL DEFAULT 'all',
  system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS login text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change boolean NOT NULL DEFAULT false;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
UPDATE users SET login = email WHERE login IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_login ON users (lower(login));
-- ── настройки сайта и SEO ──
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);
CREATE TABLE IF NOT EXISTS seo_pages (
  lang text NOT NULL,
  path text NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text,
  PRIMARY KEY (lang, path)
);
CREATE TABLE IF NOT EXISTS redirects (
  id bigserial PRIMARY KEY,
  from_path text NOT NULL,
  to_path text NOT NULL DEFAULT '',
  code int NOT NULL DEFAULT 301,
  match text NOT NULL DEFAULT 'exact',
  active boolean NOT NULL DEFAULT true,
  note text NOT NULL DEFAULT '',
  hits int NOT NULL DEFAULT 0,
  last_hit timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);
CREATE UNIQUE INDEX IF NOT EXISTS redirects_exact ON redirects (lower(from_path)) WHERE match = 'exact';
CREATE TABLE IF NOT EXISTS not_found (
  path text PRIMARY KEY,
  hits int NOT NULL DEFAULT 1,
  first_at timestamptz NOT NULL DEFAULT now(),
  last_at timestamptz NOT NULL DEFAULT now(),
  referer text,
  ignored boolean NOT NULL DEFAULT false
);
-- тексты сайта из админки (Тексты): правки поверх исходных текстов, черновик и опубликованное
CREATE TABLE IF NOT EXISTS texts (
  bundle text NOT NULL,
  lang text NOT NULL,
  published jsonb,
  draft jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text,
  PRIMARY KEY (bundle, lang)
);
CREATE TABLE IF NOT EXISTS text_versions (
  id bigserial PRIMARY KEY,
  bundle text NOT NULL,
  lang text NOT NULL,
  data jsonb NOT NULL,
  note text,
  at timestamptz NOT NULL DEFAULT now(),
  by text
);
CREATE INDEX IF NOT EXISTS text_versions_key ON text_versions(bundle, lang, id DESC);
-- ── статьи: просмотры и комментарии читателей (E-E-A-T, правка 06.11.2026) ──
CREATE TABLE IF NOT EXISTS article_views (
  path text PRIMARY KEY,
  views bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS article_comments (
  id bigserial PRIMARY KEY,
  path text NOT NULL,
  lang text NOT NULL DEFAULT 'ru',
  name text NOT NULL,
  text text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  ip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  moderated_at timestamptz,
  moderated_by text
);
CREATE INDEX IF NOT EXISTS article_comments_path ON article_comments(path, status, created_at);
CREATE TABLE IF NOT EXISTS migration_checks (
  path text PRIMARY KEY,
  result jsonb NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now()
);
`;

// Роли по умолчанию: добавляются, если их ещё нет (права уже настроенных ролей не трогаем)
export const SEED = DEFAULT_ROLES.map(
  (r) => `INSERT INTO roles (id, name, perms, lead_scope, system) VALUES ('${r.id}', '${r.name.replace(/'/g, "''")}', '${JSON.stringify(r.perms)}', '${r.leadScope}', ${r.system}) ON CONFLICT (id) DO NOTHING;`,
).join("\n");


// Редиректы переезда со старого car-city.pro (адреса, которых на новом сайте нет или которые старый сайт уже
// перенаправлял). Добавляются один раз — потом ими управляют в админке (Редиректы), удалённые не вернутся.
const MOVE: [string, string, string][] = [
  ["/index.php", "/", "Дубль главной на старом MODX"],
  ["/klassyi-avtomobilej/ekonom", "/ekonom", "Как на старом сайте"],
  ["/klassyi-avtomobilej/komfort", "/komfort", "Как на старом сайте"],
  ["/klassyi-avtomobilej/komfort-plyus", "/komfortplus", "Как на старом сайте"],
  ["/biznes", "/klassyi-avtomobilej/biznes", "Бизнес-класс — по адресу старого сайта"],
  ["/klassyi-avtomobilej/gruzovoy/lada-largus", "/vykup/gruzovoy/lada-largus", "Lada Largus — только выкуп"],
  ["/klassyi-avtomobilej/komfort-plyus/kia-k5", "/klassyi-avtomobilej/komfort/kia-k5", "Kia K5 перешла в «Комфорт»"],
  ["/vykup/komfort-plyus/kia-k5", "/vykup/komfort/kia-k5", "Kia K5 перешла в «Комфорт»"],
  ["/vykup/komfort-plyus/jetour-dashing", "/vykup/komfort-plyus", "Jetour Dashing больше нет в парке — на класс"],
];
const sq = (s: string) => `'${s.replace(/'/g, "''")}'`;
export const SEED_REDIRECTS = `DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM settings WHERE key='seed_redirects_v1') THEN
${MOVE.map(([a, b, n]) => `  INSERT INTO redirects (from_path, to_path, code, match, note, created_by) VALUES (${sq(a)}, ${sq(b)}, 301, 'exact', ${sq(n)}, 'переезд') ON CONFLICT DO NOTHING;`).join("\n")}
  INSERT INTO settings (key, value) VALUES ('seed_redirects_v1', 'true');
END IF;
-- 06.11.2026: у бизнес-класса появилась аренда — старые адреса /klassyi-avtomobilej/biznes/* снова страницы, а /biznes ведёт на раздел
IF NOT EXISTS (SELECT 1 FROM settings WHERE key='seed_redirects_v2') THEN
  DELETE FROM redirects WHERE match = 'exact' AND lower(from_path) IN ('/klassyi-avtomobilej/biznes', '/klassyi-avtomobilej/biznes/gac-m8', '/klassyi-avtomobilej/biznes/hongqi-h5', '/klassyi-avtomobilej/biznes/voyah-dream');
  INSERT INTO redirects (from_path, to_path, code, match, note, created_by) VALUES ('/biznes', '/klassyi-avtomobilej/biznes', 301, 'exact', 'Бизнес-класс — по адресу старого сайта', 'переезд') ON CONFLICT DO NOTHING;
  INSERT INTO settings (key, value) VALUES ('seed_redirects_v2', 'true');
END IF;
END $$;`;
