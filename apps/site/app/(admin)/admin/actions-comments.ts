"use server";
// Модерация комментариев к статьям (правка 06.11.2026): опубликовать, скрыть, удалить.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { q1 } from "@/lib/db";
import { audit, requireCan } from "@/lib/admin/auth";

const f = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
function go(tab: string, kind: "e" | "ok", msg: string): never {
  redirect(`/admin/comments?tab=${encodeURIComponent(tab)}&${kind}=${encodeURIComponent(msg)}`);
}

export async function commentAction(fd: FormData) {
  const u = await requireCan("articles", "write");
  const id = f(fd, "id"), op = f(fd, "op"), tab = f(fd, "tab") || "new";
  if (!/^\d+$/.test(id)) go(tab, "e", "Комментарий не найден");
  let row: { path: string; lang: string } | undefined;
  if (op === "delete") {
    row = await q1<{ path: string; lang: string }>("DELETE FROM article_comments WHERE id=$1 RETURNING path, lang", [id]);
  } else {
    const st = op === "publish" ? "published" : op === "hide" ? "hidden" : "";
    if (!st) go(tab, "e", "Неизвестное действие");
    row = await q1<{ path: string; lang: string }>("UPDATE article_comments SET status=$2, moderated_at=now(), moderated_by=$3 WHERE id=$1 RETURNING path, lang", [id, st, u.login]);
  }
  if (!row) go(tab, "e", "Комментарий не найден");
  await audit(u, `Комментарий: ${op}`, "comment", id);
  // страница статьи обновится сразу, а не через 5 минут
  revalidatePath(row.lang === "ru" ? row.path : `/${row.lang}${row.path}`);
  go(tab, "ok", op === "publish" ? "Комментарий опубликован" : op === "hide" ? "Комментарий скрыт" : "Комментарий удалён");
}
