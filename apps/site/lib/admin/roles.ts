// Роли и права. Роли и их права лежат в базе (таблица roles) и настраиваются администратором по каждому разделу:
// нет доступа / чтение / полный. Здесь — список разделов, роли по умолчанию и проверка права.
// Права проверяются на сервере в каждом действии, а не скрытием кнопок.

export const SECTIONS = [
  "dashboard", "leads", "catalog", "reviews", "pages", "articles", "seo", "redirects", "migration", "media", "settings", "users", "roles", "audit",
] as const;
export type Section = (typeof SECTIONS)[number];
export type Level = "none" | "read" | "write";
export type Perms = Record<Section, Level>;
/** какие заявки видит роль: все, свои, свои и нераспределённые */
export type LeadScope = "all" | "own" | "own_free";

export const SECTION_NAMES: Record<Section, string> = {
  dashboard: "Дашборд",
  leads: "Заявки",
  catalog: "Автопарк и цены",
  reviews: "Отзывы",
  pages: "Страницы",
  articles: "Статьи и блог",
  seo: "SEO",
  redirects: "Редиректы и 404",
  migration: "Переезд сайта",
  media: "Медиатека",
  settings: "Настройки сайта и тема",
  users: "Пользователи",
  roles: "Роли и права",
  audit: "Журнал действий",
};
export const SECTION_HINTS: Partial<Record<Section, string>> = {
  pages: "Тексты страниц, H1, черновики и публикация",
  articles: "Статьи и новости: создание, правка, публикация",
  seo: "Title, description, canonical, robots, OG, sitemap, микроразметка, счётчики",
  redirects: "301/302/410, журнал 404",
  migration: "Сравнение со старым car-city.pro, проверка адресов",
  settings: "Тёмная или светлая версия сайта",
};

export const LEVEL_NAMES: Record<Level, string> = { none: "Нет доступа", read: "Просмотр", write: "Полный" };
export const SCOPE_NAMES: Record<LeadScope, string> = { all: "Все заявки", own: "Только свои", own_free: "Свои и нераспределённые" };

const all = (l: Level): Perms => Object.fromEntries(SECTIONS.map((s) => [s, l])) as Perms;
const perms = (p: Partial<Perms>): Perms => ({ ...all("none"), ...p });

export interface RoleDef { id: string; name: string; perms: Perms; leadScope: LeadScope; system: boolean }

/** Роли при первом запуске. Администратор может менять права любой роли (кроме своей) и заводить новые. */
export const DEFAULT_ROLES: RoleDef[] = [
  { id: "admin", name: "Администратор", perms: all("write"), leadScope: "all", system: true },
  {
    id: "manager", name: "Менеджер", leadScope: "own", system: true,
    perms: perms({ dashboard: "read", leads: "write", catalog: "read", reviews: "read" }),
  },
  {
    id: "seo", name: "SEO-специалист", leadScope: "all", system: true,
    perms: perms({ dashboard: "read", pages: "write", articles: "write", seo: "write", redirects: "write", migration: "write", media: "write", catalog: "read", reviews: "read", settings: "read", audit: "read" }),
  },
  {
    id: "marketer", name: "Маркетолог", leadScope: "all", system: true,
    perms: perms({ dashboard: "read", leads: "read", catalog: "write", reviews: "write", pages: "write", articles: "write", seo: "read", redirects: "read", media: "write", settings: "write" }),
  },
  {
    id: "copywriter", name: "Копирайтер", leadScope: "all", system: true,
    perms: perms({ dashboard: "read", articles: "write", pages: "read", media: "write" }),
  },
  // роли прошлой версии админки — остаются, чтобы у заведённых сотрудников не пропал доступ
  {
    id: "owner", name: "Собственник", leadScope: "all", system: false,
    perms: perms({ dashboard: "read", leads: "read", catalog: "read", reviews: "read", pages: "read", articles: "read", seo: "read", migration: "read", settings: "read", users: "read", roles: "read", audit: "read" }),
  },
  {
    id: "commercial", name: "Коммерческий директор", leadScope: "all", system: false,
    perms: perms({ dashboard: "read", leads: "write", catalog: "write", reviews: "write", pages: "read", media: "read", audit: "read" }),
  },
  {
    id: "callcenter", name: "Колл-центр", leadScope: "own_free", system: false,
    perms: perms({ dashboard: "read", leads: "write", catalog: "read" }),
  },
];

/** Права из базы приводим к полному набору разделов; администратор всегда имеет всё. */
export function normPerms(roleId: string, raw: unknown): Perms {
  if (roleId === "admin") return all("write");
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  // старая схема: один раздел «content» → страницы, статьи и SEO
  const legacy = src.content;
  return Object.fromEntries(SECTIONS.map((s) => {
    let v = src[s];
    if (v === undefined && legacy !== undefined && (s === "pages" || s === "articles" || s === "seo")) v = legacy;
    return [s, v === "read" || v === "write" ? v : "none"];
  })) as Perms;
}
export const isScope = (s: string): s is LeadScope => s === "all" || s === "own" || s === "own_free";
export const isLevel = (s: string): s is Level => s === "none" || s === "read" || s === "write";
export const roleIdOk = (s: string) => /^[a-z][a-z0-9_-]{1,30}$/.test(s);

/** Пользователь с правами (из сессии) */
export interface WithPerms { role: string; perms: Perms }
export const levelOf = (u: WithPerms, s: Section): Level => (u.role === "admin" ? "write" : u.perms?.[s] ?? "none");
export const can = (u: WithPerms, s: Section, need: "read" | "write" = "read") => {
  const l = levelOf(u, s);
  return need === "read" ? l !== "none" : l === "write";
};
/** Раздел контента для страницы по её типу */
export const sectionOfKind = (kind: string | undefined): Section => (kind === "article" ? "articles" : "pages");

export const LEAD_STATUSES = [
  { id: "new", name: "Новая" },
  { id: "call", name: "Дозвон" },
  { id: "qual", name: "Квалификация" },
  { id: "visit", name: "Визит" },
  { id: "issued", name: "Выдача" },
  { id: "lost", name: "Отказ" },
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number]["id"];
export const LEAD_STATUS_NAME = Object.fromEntries(LEAD_STATUSES.map((s) => [s.id, s.name])) as Record<string, string>;
export const LOST_REASONS = ["Не дозвонились", "Не прошёл проверку СБ", "Нет документов", "Передумал", "Выбрал другой парк", "Дубль / спам", "Другое"];
