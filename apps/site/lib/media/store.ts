// Хранилище файлов медиатеки и графики сайта. Если подключён бакет Railway (S3_* переменные), файлы лежат в нём,
// а /media/{id} отдаёт временную подписанную ссылку на бакет (трафик бакета бесплатный, видео перематывается
// через Range-запросы самим хранилищем). Без бакета (локальная разработка) — файлы в Postgres, как раньше.

import { randomUUID } from "node:crypto";
import { AwsClient } from "aws4fetch";
import { q, q1 } from "../db";

const env = () => ({
  endpoint: (process.env.S3_ENDPOINT || "").replace(/\/$/, ""),
  bucket: process.env.S3_BUCKET || "",
  region: process.env.S3_REGION || "auto",
  key: process.env.S3_ACCESS_KEY_ID || "",
  secret: process.env.S3_SECRET_ACCESS_KEY || "",
  pathStyle: process.env.S3_URL_STYLE === "path" || /localhost|127\.0\.0\.1/.test(process.env.S3_ENDPOINT || ""),
});
export const s3Enabled = () => { const e = env(); return Boolean(e.endpoint && e.bucket && e.key && e.secret); };

let client: AwsClient | null = null;
function aws() {
  const e = env();
  client ??= new AwsClient({ accessKeyId: e.key, secretAccessKey: e.secret, region: e.region, service: "s3" });
  return client;
}
function objectUrl(key: string) {
  const e = env();
  const u = new URL(e.endpoint);
  const path = key.split("/").map(encodeURIComponent).join("/");
  return e.pathStyle ? `${u.origin}/${e.bucket}/${path}` : `${u.protocol}//${e.bucket}.${u.host}/${path}`;
}

async function putObject(key: string, body: Uint8Array, type: string) {
  const res = await aws().fetch(objectUrl(key), { method: "PUT", body: new Uint8Array(body), headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable" } });
  if (!res.ok) throw new Error(`bucket: загрузка не удалась (${res.status})`);
}
async function deleteObject(key: string) {
  await aws().fetch(objectUrl(key), { method: "DELETE" }).catch(() => null);
}

/** Подписанная ссылка на объект. Подпись от начала суток (UTC) на 7 дней: весь день адрес одинаковый и кэшируется. */
export async function signedUrl(key: string) {
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  const u = new URL(objectUrl(key));
  u.searchParams.set("X-Amz-Expires", String(7 * 86400));
  const signed = await aws().sign(u.toString(), { method: "GET", aws: { signQuery: true, datetime: day.toISOString().replace(/[:-]|\.\d{3}/g, "") } });
  return signed.url;
}

export interface Saved { id: string; mime: string; w?: number; h?: number; size: number }

/** Сохранить файл: в бакет (если подключён) или в базу. Возвращает id для адреса /media/{id}. */
export async function saveFile(body: Uint8Array, opts: { name: string; mime: string; w?: number; h?: number; by: string; kind?: string }): Promise<Saved> {
  const id = randomUUID().replace(/-/g, "").slice(0, 16);
  const ext = opts.mime.split("/")[1]?.replace("svg+xml", "svg").replace("jpeg", "jpg") || "bin";
  if (s3Enabled()) {
    const key = `media/${id}.${ext}`;
    await putObject(key, body, opts.mime);
    await q("INSERT INTO media (id, name, mime, w, h, bytes, size, by, storage, s3_key, kind) VALUES ($1,$2,$3,$4,$5,NULL,$6,$7,'s3',$8,$9)", [id, opts.name, opts.mime, opts.w ?? null, opts.h ?? null, body.length, opts.by, key, opts.kind ?? "library"]);
  } else {
    await q("INSERT INTO media (id, name, mime, w, h, bytes, size, by, storage, kind) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'db',$9)", [id, opts.name, opts.mime, opts.w ?? null, opts.h ?? null, Buffer.from(body), body.length, opts.by, opts.kind ?? "library"]);
  }
  return { id, mime: opts.mime, w: opts.w, h: opts.h, size: body.length };
}

export async function deleteFile(id: string) {
  const m = await q1<{ storage: string; s3_key: string | null }>("SELECT storage, s3_key FROM media WHERE id=$1", [id]);
  if (m?.storage === "s3" && m.s3_key && s3Enabled()) await deleteObject(m.s3_key);
  await q("DELETE FROM media WHERE id=$1", [id]);
}
