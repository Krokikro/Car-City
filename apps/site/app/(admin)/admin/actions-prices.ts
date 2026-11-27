"use server";
// Таблицы цен аренды и выкупа (раздел «Автопарк и цены»). Хранятся в settings.prices: { slug: { rent, buy, rentDisp, buyDisp } }.
import { redirect } from "next/navigation";
import { audit, requireCan } from "@/lib/admin/auth";
import { getSetting, setSetting } from "@/lib/admin/store";
import { BASE_FLEET } from "@/lib/admin/fleet";
import { bust } from "@/lib/admin/pages";
import type { Disp, PriceRow, PriceTables } from "@/lib/prices";

const DISP: Disp[] = ["auto", "old", "badge", "upto", "none"];
const go = (kind: string, t: "ok" | "e", msg: string): never => redirect(`/admin/catalog?tab=${kind}&${t}=${encodeURIComponent(msg)}`);

export async function savePricesAction(fd: FormData) {
  const u = await requireCan("catalog", "write");
  const kind = String(fd.get("kind")) === "buy" ? "buy" : "rent";
  let list: { slug: string; disp: string; rows: PriceRow[] }[];
  try { list = JSON.parse(String(fd.get("json") ?? "[]")); } catch { go(kind, "e", "Не удалось прочитать таблицу"); }
  if (!Array.isArray(list!) || !list!.length) go(kind, "e", "Изменений нет");
  if (list!.length > 80) go(kind, "e", "Слишком много моделей за раз");
  const errs: string[] = [];
  const clean: Record<string, { rows: PriceRow[]; disp: Disp }> = {};
  for (const m of list!) {
    const car = BASE_FLEET.find((c) => c.slug === m.slug);
    if (!car) { errs.push(`неизвестная модель ${String(m.slug).slice(0, 40)}`); continue; }
    if (!Array.isArray(m.rows) || m.rows.length > 10) { errs.push(`${car.name}: не больше 10 строк`); continue; }
    const rows: PriceRow[] = [];
    const seen = new Set<string>();
    m.rows.forEach((r, i) => {
      const n = `${car.name}, строка ${i + 1}`;
      const k = String(r.k ?? "").trim().replace(/\s+/g, " ");
      const p = Math.round(Number(r.p));
      const o = r.o ? Math.round(Number(r.o)) : undefined;
      const dep = kind === "buy" ? Math.max(0, Math.round(Number(r.dep ?? 0))) : undefined;
      if (!k || [...k].length > 20) return errs.push(`${n}: укажите график или срок (до 20 символов)`);
      if (seen.has(k)) return errs.push(`${n}: график «${k}» повторяется`);
      seen.add(k);
      if (!Number.isFinite(p) || p < 300 || p > 100000) return errs.push(`${n}: цена в сутки — от 300 до 100 000 ₽`);
      if (o !== undefined && (!Number.isFinite(o) || o <= p || o > 300000)) return errs.push(`${n}: старая цена должна быть больше новой`);
      if (dep !== undefined && (!Number.isFinite(dep) || dep > 5_000_000)) return errs.push(`${n}: взнос — до 5 000 000 ₽`);
      rows.push({ k, p, ...(o ? { o } : {}), ...(dep !== undefined ? { dep } : {}) });
    });
    clean[car.slug] = { rows, disp: DISP.includes(m.disp as Disp) ? (m.disp as Disp) : "auto" };
  }
  if (errs.length) go(kind, "e", `Не сохранено. ${errs.slice(0, 6).join("; ")}${errs.length > 6 ? ` и ещё ${errs.length - 6}` : ""}`);
  const all = ((await getSetting<PriceTables>("prices")) ?? {}) as PriceTables;
  const before: PriceTables = {};
  for (const [slug, v] of Object.entries(clean)) {
    before[slug] = all[slug] ?? {};
    all[slug] = { ...(all[slug] ?? {}), [kind]: v.rows, [kind === "rent" ? "rentDisp" : "buyDisp"]: v.disp };
  }
  await setSetting("prices", all, u.login || u.email);
  await bust();
  await audit(u, kind === "rent" ? "Изменены цены аренды" : "Изменены цены выкупа", "prices", Object.keys(clean).join(","), before, clean);
  go(kind, "ok", `Цены сохранены (${Object.keys(clean).length} мод.) и уже на сайте`);
}
