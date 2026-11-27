// Просмотры и комментарии статей (E-E-A-T, правка 06.11.2026).
// Всё хранится в Postgres админки; без базы сайт работает как раньше — счётчик и комментарии просто не показываются.
import { dbEnabled, q, q1 } from "../db";

export interface ArticleComment { id: string; name: string; text: string; at: string }

const cleanPath = (p: string) => (p.startsWith("/novosti/") ? p.slice(0, 300).toLowerCase() : "");

/** +1 просмотр, возвращает новое значение */
export async function addView(path: string): Promise<number | null> {
  const p = cleanPath(path);
  if (!p || !dbEnabled()) return null;
  const r = await q1<{ views: string }>(
    "INSERT INTO article_views (path, views) VALUES ($1, 1) ON CONFLICT (path) DO UPDATE SET views = article_views.views + 1, updated_at = now() RETURNING views::text",
    [p],
  );
  return r ? Number(r.views) : null;
}

export async function viewsOf(path: string): Promise<number | null> {
  const p = cleanPath(path);
  if (!p || !dbEnabled()) return null;
  const r = await q1<{ views: string }>("SELECT views::text FROM article_views WHERE path=$1", [p]);
  return r ? Number(r.views) : 0;
}

/** Опубликованные комментарии статьи (для страницы; при ошибке базы — пустой список) */
export async function commentsOf(path: string): Promise<ArticleComment[]> {
  const p = cleanPath(path);
  // при сборке базы нет — страница соберётся без комментариев и обновится после публикации
  if (!p || !dbEnabled() || process.env.NEXT_PHASE === "phase-production-build") return [];
  try {
    const rows = await q<{ id: string; name: string; text: string; created_at: Date }>(
      "SELECT id::text, name, text, created_at FROM article_comments WHERE path=$1 AND status='published' ORDER BY created_at ASC LIMIT 200",
      [p],
    );
    return rows.map((r) => ({ id: r.id, name: r.name, text: r.text, at: new Date(r.created_at).toISOString() }));
  } catch (e) {
    console.error("comments:", (e as Error).message);
    return [];
  }
}

export const COMMENT_LIMITS = { name: 60, text: 2000 } as const;

/** Новый комментарий уходит на модерацию (статус new) */
export async function addComment(path: string, lang: string, name: string, text: string, ip: string): Promise<boolean> {
  const p = cleanPath(path);
  if (!p || !dbEnabled()) return false;
  await q("INSERT INTO article_comments (path, lang, name, text, ip) VALUES ($1, $2, $3, $4, $5)", [p, lang.slice(0, 5) || "ru", name, text, ip.slice(0, 60)]);
  return true;
}
