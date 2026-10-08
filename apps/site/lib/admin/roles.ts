// Роли и права по PRD 9.2. Проверяются на сервере в каждом действии, а не скрытием кнопок.
export const ROLES = ["admin", "owner", "commercial", "manager", "callcenter"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_NAMES: Record<Role, string> = {
  admin: "Администратор",
  owner: "Собственник",
  commercial: "Коммерческий директор",
  manager: "Менеджер",
  callcenter: "Колл-центр",
};

export const SECTIONS = ["dashboard", "leads", "catalog", "content", "media", "users", "audit"] as const;
export type Section = (typeof SECTIONS)[number];
export type Level = "none" | "read" | "write";

export const SECTION_NAMES: Record<Section, string> = {
  dashboard: "Дашборд",
  leads: "Заявки",
  catalog: "Автопарк",
  content: "Контент и SEO",
  media: "Медиатека",
  users: "Пользователи и роли",
  audit: "Журнал действий",
};

// «Свои» заявки — те, что назначены на сотрудника; колл-центр видит ещё нераспределённые.
const MATRIX: Record<Role, Record<Section, Level>> = {
  admin: { dashboard: "write", leads: "write", catalog: "write", content: "write", media: "write", users: "write", audit: "read" },
  owner: { dashboard: "read", leads: "read", catalog: "read", content: "none", media: "none", users: "write", audit: "read" },
  commercial: { dashboard: "read", leads: "write", catalog: "write", content: "read", media: "read", users: "none", audit: "read" },
  manager: { dashboard: "read", leads: "write", catalog: "read", content: "none", media: "none", users: "none", audit: "none" },
  callcenter: { dashboard: "read", leads: "write", catalog: "read", content: "none", media: "none", users: "none", audit: "none" },
};

export const levelOf = (role: Role, s: Section): Level => MATRIX[role]?.[s] ?? "none";
export const can = (role: Role, s: Section, need: "read" | "write" = "read") => {
  const l = levelOf(role, s);
  return need === "read" ? l !== "none" : l === "write";
};
export const isRole = (s: string): s is Role => (ROLES as readonly string[]).includes(s);

/** Что в таблице прав показывать словами */
export const LEVEL_NAMES: Record<Level, string> = { none: "—", read: "Чтение", write: "Полный" };
export const MATRIX_VIEW = MATRIX;

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
