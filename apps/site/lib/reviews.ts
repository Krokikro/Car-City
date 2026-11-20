// Отзывы на странице /reviews: 42 отзыва из файла + то, что админ опубликовал или скрыл в админке.
// Опубликованные из админки идут первыми в своём источнике; скрытые файловые отзывы с сайта убираются.
import { createHash } from "node:crypto";
import { dbEnabled, q } from "./db";
import type { Review } from "./blocks";

export const reviewKey = (r: { source: string; name: string; date: string; text: string }) =>
  createHash("sha1").update([r.source, r.name, r.date, r.text].map((x) => x.trim().toLowerCase().replace(/\s+/g, " ")).join("|")).digest("hex").slice(0, 20);

import { SOURCE_URL, SOURCES } from "./reviews-src";
export { SOURCE_URL, SOURCES };

const building = () => process.env.NEXT_PHASE === "phase-production-build";

export async function siteReviews(file: Review[]): Promise<Review[]> {
  if (!dbEnabled() || building()) return file;
  try {
    const rows = await q<{ key: string; source: string; name: string; date_text: string; text: string; url: string; status: string; origin: string }>(
      "SELECT key, source, name, date_text, text, url, status, origin FROM reviews WHERE status IN ('published','hidden') ORDER BY published_at DESC NULLS LAST, id DESC",
    );
    const hidden = new Set(rows.filter((r) => r.status === "hidden").map((r) => r.key));
    const added: Review[] = rows.filter((r) => r.status === "published" && r.origin !== "file").map((r) => ({ name: r.name, date: r.date_text, source: r.source, url: r.url || SOURCE_URL[r.source], text: r.text }));
    return [...added, ...file.filter((r) => !hidden.has(reviewKey(r)))];
  } catch (e) {
    console.error("reviews:", (e as Error).message);
    return file;
  }
}
