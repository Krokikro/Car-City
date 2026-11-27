import { NextResponse } from "next/server";
import { audit, getSession, twoFaRequired, type AdminUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { getSetting, setSetting } from "@/lib/admin/store";
import { bust } from "@/lib/admin/pages";
import { BASE_FLEET } from "@/lib/admin/fleet";
import { familyById, type Family } from "@/lib/media/families";
import { processGalleryPhoto, processUpload, UploadError } from "@/lib/media/process";
import { deleteFile } from "@/lib/media/store";
import type { CarGallery } from "@/lib/media/live";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Замена графики сайта и фото машин. multipart: op=replace (key, kind, file) | op=extra (slug, file).
// JSON: op=reset (key, kind) | op=hide / show (slug, shot) | op=remove-extra (slug, id).
type Log = Record<string, { at: string; by: string; ids: string[] }>;
const SHOTS = ["front", "rear", "side", "interior"];

function allowed(u: AdminUser, carRelated: boolean) {
  return can(u, "media", "write") || (carRelated && can(u, "catalog", "write"));
}
const bad = (msg: string, status = 400) => NextResponse.json({ ok: false, error: msg }, { status });

async function setFamily(f: Family, map: Record<string, string> | null, ids: string[], by: string) {
  const assets = ((await getSetting<Record<string, string>>("assets")) ?? {}) as Record<string, string>;
  const log = ((await getSetting<Log>("assetsLog")) ?? {}) as Log;
  const id = `${f.key}|${f.kind}`;
  for (const v of f.variants) delete assets[v.path];
  if (map) Object.assign(assets, map);
  const old = log[id]?.ids ?? [];
  if (map) log[id] = { at: new Date().toISOString(), by, ids }; else delete log[id];
  await setSetting("assets", assets, by);
  await setSetting("assetsLog", log, by);
  for (const o of old) await deleteFile(o).catch(() => {}); // прежняя замена больше не нужна
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.stage !== "full" || (!s.user.totpOn && twoFaRequired())) return bad("Нет доступа", 403);
  const u = s.user;
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return bad("Запрос с чужого сайта", 403);
  const by = u.login || u.email;
  try {
    if ((req.headers.get("content-type") || "").includes("multipart/form-data")) {
      const fd = await req.formData();
      const op = String(fd.get("op"));
      const file = fd.get("file");
      if (!(file instanceof File) || !file.size) return bad("Файл не выбран");
      const up = { buf: Buffer.from(await file.arrayBuffer()), mime: file.type || "", name: file.name.slice(0, 120) };
      if (op === "replace") {
        const f = familyById(String(fd.get("key")), String(fd.get("kind")));
        if (!f) return bad("Нет такого места на сайте");
        if (!allowed(u, f.key.startsWith("/cars"))) return bad("Нет доступа", 403);
        const r = await processUpload(f, up, by);
        await setFamily(f, r.map, r.ids, by);
        await bust();
        await audit(u, "Заменена графика сайта", "graphics", f.key, undefined, { variants: Object.keys(r.map).length });
        return NextResponse.json({ ok: true, url: Object.values(r.map)[0], notes: r.notes });
      }
      if (op === "extra") {
        const slug = String(fd.get("slug"));
        if (!BASE_FLEET.some((c) => c.slug === slug)) return bad("Нет такой машины");
        if (!allowed(u, true)) return bad("Нет доступа", 403);
        const all = ((await getSetting<Record<string, CarGallery>>("carGallery")) ?? {}) as Record<string, CarGallery>;
        const g = all[slug] ?? {};
        if ((g.extra?.length ?? 0) >= 12) return bad("В галерее машины не больше 12 дополнительных фото");
        const r = await processGalleryPhoto(up, by);
        g.extra = [...(g.extra ?? []), { id: r.ids[0], big: r.big, thumb: r.thumb, alt: String(fd.get("alt") || "").slice(0, 80) || undefined }];
        all[slug] = g;
        await setSetting("carGallery", all, by);
        await bust();
        await audit(u, "Добавлено фото машины", "car", slug);
        return NextResponse.json({ ok: true, url: r.thumb });
      }
      return bad("Неизвестное действие");
    }
    const b = (await req.json().catch(() => ({}))) as { op?: string; key?: string; kind?: string; slug?: string; shot?: string; id?: string };
    if (b.op === "reset") {
      const f = familyById(String(b.key), String(b.kind));
      if (!f) return bad("Нет такого места на сайте");
      if (!allowed(u, f.key.startsWith("/cars"))) return bad("Нет доступа", 403);
      await setFamily(f, null, [], by);
      await bust();
      await audit(u, "Возвращена исходная графика", "graphics", f.key);
      return NextResponse.json({ ok: true });
    }
    if (b.op === "hide" || b.op === "show" || b.op === "remove-extra") {
      const slug = String(b.slug);
      if (!BASE_FLEET.some((c) => c.slug === slug)) return bad("Нет такой машины");
      if (!allowed(u, true)) return bad("Нет доступа", 403);
      const all = ((await getSetting<Record<string, CarGallery>>("carGallery")) ?? {}) as Record<string, CarGallery>;
      const g = all[slug] ?? {};
      if (b.op === "remove-extra") {
        const item = g.extra?.find((x) => x.id === b.id);
        g.extra = (g.extra ?? []).filter((x) => x.id !== b.id);
        if (item) for (const m of [item.big, item.thumb]) await deleteFile(m.replace("/media/", "")).catch(() => {});
      } else {
        if (!SHOTS.includes(String(b.shot))) return bad("Нет такого кадра");
        const hide = new Set(g.hide ?? []);
        if (b.op === "hide") hide.add(String(b.shot)); else hide.delete(String(b.shot));
        g.hide = [...hide];
      }
      all[slug] = g;
      await setSetting("carGallery", all, by);
      await bust();
      await audit(u, b.op === "hide" ? "Фото машины убрано" : b.op === "show" ? "Фото машины возвращено" : "Удалено фото машины", "car", slug);
      return NextResponse.json({ ok: true });
    }
    return bad("Неизвестное действие");
  } catch (e) {
    if (e instanceof UploadError) return bad(e.message);
    console.error("graphics:", e instanceof Error ? e.message : e);
    return bad("Не удалось обработать файл", 500);
  }
}
