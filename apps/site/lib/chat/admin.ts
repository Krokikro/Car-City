// Чаты в админке: список диалогов с учётом прав, отметка о прочтении, взятие диалога менеджером.
import { q, q1 } from "../db";
import type { AdminUser } from "../admin/auth";
import type { ChatRow } from "./server";

/** Какие диалоги видит сотрудник. «Только свои» в чатах = свои и ничьи: иначе новый диалог никто не увидит. */
export function chatScope(u: Pick<AdminUser, "id" | "leadScope">, n = 1) {
  if (u.leadScope === "all") return { sql: "TRUE", params: [] as unknown[] };
  return { sql: `(c.assignee = $${n} OR c.assignee IS NULL)`, params: [u.id] as unknown[] };
}

export interface ChatListRow extends ChatRow { assignee_name: string | null; city: string | null }

export async function listChats(u: AdminUser, f: { status?: string; channel?: string; mine?: string; q?: string }) {
  const sc = chatScope(u);
  const params = [...sc.params];
  const where = [sc.sql];
  const add = (sql: (n: number) => string, v: unknown) => { params.push(v); where.push(sql(params.length)); };
  if (f.status === "open" || f.status === "closed") add((n) => `c.status = $${n}`, f.status);
  if (f.status === "unread") where.push("c.unread > 0");
  if (f.channel) add((n) => `c.channel = $${n}`, f.channel);
  if (f.mine) add((n) => `c.assignee::text = $${n}`, u.id);
  if (f.q?.trim()) add((n) => `(c.name ILIKE $${n} OR c.phone ILIKE $${n} OR c.last_text ILIKE $${n} OR EXISTS (SELECT 1 FROM chat_messages m WHERE m.chat_id = c.id AND m.text ILIKE $${n}))`, `%${f.q.trim()}%`);
  return q<ChatListRow>(
    `SELECT c.*, u.name assignee_name, c.meta->>'city' city FROM chats c LEFT JOIN users u ON u.id = c.assignee WHERE ${where.join(" AND ")} ORDER BY (c.unread > 0) DESC, c.updated_at DESC LIMIT 200`, params,
  );
}

export async function chatForUser(u: AdminUser, id: string) {
  const sc = chatScope(u, 2);
  return (await q1<ChatListRow>(`SELECT c.*, u.name assignee_name, c.meta->>'city' city FROM chats c LEFT JOIN users u ON u.id = c.assignee WHERE c.id = $1 AND ${sc.sql}`, [id, ...sc.params])) ?? null;
}

export async function unreadCount(u: AdminUser) {
  const sc = chatScope(u);
  const r = await q1<{ n: string }>(`SELECT count(*) n FROM chats c WHERE c.unread > 0 AND c.status = 'open' AND ${sc.sql}`, sc.params);
  return Number(r?.n ?? 0);
}
