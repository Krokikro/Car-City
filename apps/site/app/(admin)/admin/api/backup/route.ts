import { NextResponse } from "next/server";
import { gzipSync } from "node:zlib";
import { audit, requireUser } from "@/lib/admin/auth";
import { q } from "@/lib/db";
import { signedUrl } from "@/lib/media/store";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Полная резервная копия базы админки одним файлом (переезд на свой сервер 17.11.2026; Railway без бэкапов на нашем тарифе).
// Все таблицы как есть; файлы медиатеки из бакета вкладываются внутрь (storage='db'). Сессии и попытки входа не выгружаются.
// Зашифрованные секреты не выгружаются: 2FA пользователи подключат заново, токены интеграций вводятся в новой админке.
const SKIP = new Set(["sessions", "login_attempts"]);

const enc = (v: unknown): unknown => (Buffer.isBuffer(v) ? { $b64: v.toString("base64") } : v);

export async function GET() {
  const user = await requireUser({ section: "users", need: "write" });
  const tables = (await q<{ table_name: string }>("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name")).map((r) => r.table_name);
  const out: Record<string, Record<string, unknown>[]> = {};
  const missing: string[] = [];
  for (const t of tables) {
    if (SKIP.has(t)) continue;
    const rows = await q<Record<string, unknown>>(`SELECT * FROM "${t}"`);
    if (t === "users") for (const r of rows) { r.totp_secret = null; r.totp_on = false; }
    if (t === "settings") for (const r of rows) if (r.key === "integrations") r.value = stripSecrets(r.value);
    if (t === "media") {
      for (const r of rows) {
        if (r.storage === "s3" && r.s3_key) {
          const res = await fetch(await signedUrl(String(r.s3_key))).catch(() => null);
          if (res?.ok) { r.bytes = Buffer.from(await res.arrayBuffer()); r.storage = "db"; r.s3_key = null; }
          else missing.push(String(r.id));
        }
      }
    }
    out[t] = rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, enc(v)])));
  }
  const body = gzipSync(Buffer.from(JSON.stringify({ format: "carcity-backup-1", at: new Date().toISOString(), missingMedia: missing, tables: out })));
  await audit(user, "Скачана резервная копия базы", "settings", "backup", undefined, { tables: Object.keys(out).length, missingMedia: missing.length });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return new NextResponse(new Uint8Array(body), { headers: { "content-type": "application/gzip", "content-disposition": `attachment; filename="carcity-backup-${stamp}.json.gz"`, "cache-control": "no-store" } });
}

// Токены и ключи интеграций зашифрованы ключом этого сервера — в копию попадают только обычные настройки
function stripSecrets(v: unknown) {
  if (!v || typeof v !== "object") return v;
  const copy = JSON.parse(JSON.stringify(v)) as Record<string, Record<string, unknown>>;
  for (const block of Object.values(copy)) {
    if (!block || typeof block !== "object") continue;
    for (const [k, x] of Object.entries(block)) if (typeof x === "string" && x.startsWith("v1.")) block[k] = "";
  }
  return copy;
}
