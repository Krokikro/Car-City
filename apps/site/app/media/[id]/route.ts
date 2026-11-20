import { q1 } from "@/lib/db";
import { s3Enabled, signedUrl } from "@/lib/media/store";

export const dynamic = "force-dynamic";

// Публичная выдача файлов медиатеки и замен графики. Содержимое по id не меняется (новая загрузка — новый id).
// Файл в бакете — переадресация на подписанную ссылку (одинаковую весь день, поэтому кэшируется);
// файл в базе — отдаём сами, с вечным кэшем.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{16}$/.test(id)) return new Response("Not found", { status: 404 });
  const etag = `"${id}"`;
  const m = await q1<{ mime: string; bytes: Buffer | null; storage: string; s3_key: string | null }>("SELECT mime, bytes, storage, s3_key FROM media WHERE id=$1", [id]).catch(() => undefined);
  if (!m) return new Response("Not found", { status: 404 });
  const csp: Record<string, string> = m.mime === "image/svg+xml" ? { "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox" } : {};
  if (m.storage === "s3" && m.s3_key && s3Enabled()) {
    return new Response(null, { status: 302, headers: { location: await signedUrl(m.s3_key), "cache-control": "public, max-age=3600", ...csp } });
  }
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { etag } });
  if (!m.bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(m.bytes), { headers: { "content-type": m.mime, "cache-control": "public, max-age=31536000, immutable", etag, "x-content-type-options": "nosniff", ...csp } });
}
