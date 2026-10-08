import { q1 } from "@/lib/db";

export const dynamic = "force-dynamic";

// Публичная выдача файлов из медиатеки. Адрес не меняется, содержимое не правится, поэтому кэш вечный.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{16}$/.test(id)) return new Response("Not found", { status: 404 });
  const etag = `"${id}"`;
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { etag } });
  const m = await q1<{ mime: string; bytes: Buffer }>("SELECT mime, bytes FROM media WHERE id=$1", [id]).catch(() => undefined);
  if (!m) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(m.bytes), { headers: { "content-type": m.mime, "cache-control": "public, max-age=31536000, immutable", etag, "x-content-type-options": "nosniff" } });
}
