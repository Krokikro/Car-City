"use server";
import { redirect } from "next/navigation";
import { audit, requireCan } from "@/lib/admin/auth";
import { q } from "@/lib/db";
import { chatForUser } from "@/lib/chat/admin";
import { addSystem } from "@/lib/chat/server";

const f = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Закрыть / открыть диалог, взять себе */
export async function chatToolAction(fd: FormData) {
  const u = await requireCan("chats", "write");
  const id = f(fd, "id");
  const chat = await chatForUser(u, id);
  if (!chat) redirect("/admin/chats?e=" + encodeURIComponent("Нет такого диалога"));
  const op = f(fd, "op");
  if (op === "close") { await q("UPDATE chats SET status='closed', unread=0 WHERE id=$1", [id]); await addSystem(id, `Диалог закрыт (${u.name || u.login})`); }
  if (op === "open") { await q("UPDATE chats SET status='open' WHERE id=$1", [id]); await addSystem(id, `Диалог снова открыт (${u.name || u.login})`); }
  if (op === "take") { await q("UPDATE chats SET assignee=$2 WHERE id=$1", [id, u.id]); await addSystem(id, `Диалог взял ${u.name || u.login}`); if (chat!.lead_id) await q("UPDATE leads SET assignee=$2 WHERE id=$1 AND assignee IS NULL", [chat!.lead_id, u.id]); }
  await audit(u, op === "close" ? "Чат закрыт" : op === "open" ? "Чат открыт" : "Чат взят", "chat", id);
  redirect(`/admin/chats/${id}`);
}
