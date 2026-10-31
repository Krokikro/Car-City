import type { AdminUser } from "./auth";

/** Какие заявки видит сотрудник: все, свои или свои и нераспределённые */
export function leadScope(u: Pick<AdminUser, "id" | "role">): { sql: string; params: unknown[] } {
  if (u.role === "manager") return { sql: "assignee = $1", params: [u.id] };
  if (u.role === "callcenter") return { sql: "(assignee = $1 OR assignee IS NULL)", params: [u.id] };
  return { sql: "TRUE", params: [] };
}
