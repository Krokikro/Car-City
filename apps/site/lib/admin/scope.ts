import type { AdminUser } from "./auth";

/** Какие заявки видит сотрудник: все, свои или свои и нераспределённые (настраивается у роли) */
export function leadScope(u: Pick<AdminUser, "id" | "leadScope">): { sql: string; params: unknown[] } {
  if (u.leadScope === "own") return { sql: "assignee = $1", params: [u.id] };
  if (u.leadScope === "own_free") return { sql: "(assignee = $1 OR assignee IS NULL)", params: [u.id] };
  return { sql: "TRUE", params: [] };
}
