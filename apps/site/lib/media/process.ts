// Подготовка загруженной замены: проверка формата и размеров, нарезка всех вариантов слота, сохранение в хранилище.
import sharp, { type Metadata } from "sharp";
import { ratio, type Family } from "./families";
import { saveFile } from "./store";

export interface Upload { buf: Buffer; mime: string; name: string }
export interface Result { map: Record<string, string>; ids: string[]; notes: string[] }
export class UploadError extends Error {}

const MIME: Record<string, string> = { webp: "image/webp", avif: "image/avif", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", svg: "image/svg+xml", mp4: "video/mp4", webm: "video/webm" };

/** Размер кадра из заголовка MP4 (атом tkhd видеодорожки) — чтобы проверить пропорции без ffmpeg */
export function mp4Size(buf: Buffer): { w: number; h: number } | null {
  const head = buf.subarray(0, Math.min(buf.length, 8 * 1024 * 1024));
  const tail = buf.length > head.length ? buf.subarray(buf.length - 4 * 1024 * 1024) : null; // moov бывает в конце файла
  for (const part of [head, tail]) {
    if (!part) continue;
    let i = part.indexOf("tkhd");
    while (i > 0) {
      const v = part[i + 4];
      const off = i + 4 + (v === 1 ? 88 : 76);
      if (off + 8 <= part.length) {
        const w = part.readUInt32BE(off) / 65536, h = part.readUInt32BE(off + 4) / 65536;
        if (w > 0 && h > 0) return { w: Math.round(w), h: Math.round(h) };
      }
      i = part.indexOf("tkhd", i + 4);
    }
  }
  return null;
}

function safeSvg(buf: Buffer) {
  const s = buf.toString("utf8");
  if (!/<svg[\s>]/i.test(s)) throw new UploadError("Это не SVG-файл");
  if (/<script|<foreignObject|\son[a-z]+\s*=|javascript:|<iframe|<embed|<object|xlink:href\s*=\s*["'](?!#)|href\s*=\s*["'](?!#|data:image)/i.test(s)) throw new UploadError("SVG содержит скрипты или внешние ссылки — такой файл загрузить нельзя");
  return Buffer.from(s);
}

export async function processUpload(f: Family, up: Upload, by: string): Promise<Result> {
  const notes: string[] = [];
  const map: Record<string, string> = {};
  const ids: string[] = [];
  if (up.buf.length > f.maxBytes) throw new UploadError(`Файл слишком большой: ${(up.buf.length / 1048576).toFixed(1)} МБ, можно до ${Math.round(f.maxBytes / 1048576)} МБ`);

  if (f.kind === "video") {
    const ext = up.mime === "video/webm" ? "webm" : up.mime === "video/mp4" || up.mime === "video/quicktime" ? "mp4" : "";
    if (!ext) throw new UploadError("Нужен видеофайл MP4 (H.264)");
    const targets = f.variants.filter((v) => v.fmt === ext);
    if (!targets.length) throw new UploadError(`Для этого места нужен ${f.formats.join(" или ").toUpperCase()}`);
    if (ext === "mp4") {
      const sz = mp4Size(up.buf);
      if (sz && f.w && f.h && Math.abs(sz.w / sz.h - f.w / f.h) / (f.w / f.h) > 0.03) throw new UploadError(`Пропорции видео ${sz.w}×${sz.h} (${ratio(sz.w, sz.h)}), а нужно ${f.w}×${f.h} (${ratio(f.w, f.h)}) — иначе вёрстка поедет`);
      if (sz && f.w && sz.w < f.w * 0.6) notes.push(`Видео ${sz.w}×${sz.h} меньше рекомендованного ${f.w}×${f.h} — на больших экранах может быть нечётким`);
      if (!sz) notes.push("Не удалось прочитать размер кадра — проверьте видео на сайте");
    }
    const saved = await saveFile(up.buf, { name: up.name, mime: MIME[ext], by, kind: "graphics" });
    ids.push(saved.id);
    for (const v of targets) map[v.path] = `/media/${saved.id}`;
    if (targets.length > 1) notes.push("Один файл используется для всех размеров экрана");
    return { map, ids, notes };
  }

  if (f.svg) {
    if (up.mime !== "image/svg+xml" && !up.name.toLowerCase().endsWith(".svg")) throw new UploadError("Для этого места нужен SVG");
    const saved = await saveFile(safeSvg(up.buf), { name: up.name, mime: "image/svg+xml", by, kind: "graphics" });
    ids.push(saved.id);
    for (const v of f.variants) map[v.path] = `/media/${saved.id}`;
    return { map, ids, notes };
  }

  let meta: Metadata;
  try { meta = await sharp(up.buf, { failOn: "error" }).metadata(); } catch { throw new UploadError("Не удалось прочитать картинку — нужен JPG, PNG, WebP или AVIF"); }
  if (!meta.width || !meta.height) throw new UploadError("Не удалось прочитать размер картинки");
  const rot = (meta.orientation ?? 1) >= 5;
  const iw = rot ? meta.height : meta.width, ih = rot ? meta.width : meta.height;
  if (f.w && f.h) {
    if (iw < f.w * 0.6 || ih < f.h * 0.6) throw new UploadError(`Картинка ${iw}×${ih} слишком маленькая: нужно ${f.w}×${f.h} px — иначе будет мыльной`);
    if (Math.abs(iw / ih - f.w / f.h) / (f.w / f.h) > 0.02) notes.push(`Пропорции ${iw}×${ih} отличаются от нужных ${f.w}×${f.h} — лишнее обрезано по центру`);
    if (iw < f.w || ih < f.h) notes.push(`Картинка меньше рекомендованной (${f.w}×${f.h}) — растянута`);
  }
  if (f.transparent && !meta.hasAlpha) notes.push("Здесь нужна картинка с прозрачным фоном, а у загруженной фон сплошной");
  const done = new Map<string, string>(); // одинаковые размер+формат — один файл
  for (const v of f.variants) {
    const k = `${v.w}x${v.h}.${v.fmt}`;
    if (!done.has(k)) {
      let img = sharp(up.buf, { failOn: "error" }).rotate();
      if (v.w && v.h) img = img.resize(v.w, v.h, { fit: "cover", position: "centre" });
      const fmt = v.fmt === "jpeg" ? "jpg" : v.fmt;
      const out = fmt === "avif" ? img.avif({ quality: 55 }) : fmt === "png" ? img.png({ compressionLevel: 9 }) : fmt === "jpg" ? img.jpeg({ quality: 84, mozjpeg: true }) : fmt === "gif" ? img.gif() : img.webp({ quality: 82 });
      const { data, info } = await out.toBuffer({ resolveWithObject: true });
      const saved = await saveFile(data, { name: `${up.name.replace(/\.[a-z0-9]+$/i, "")}-${v.w}.${fmt}`, mime: MIME[fmt] ?? "image/webp", w: info.width, h: info.height, by, kind: "graphics" });
      ids.push(saved.id);
      done.set(k, `/media/${saved.id}`);
    }
    map[v.path] = done.get(k)!;
  }
  return { map, ids, notes };
}

/** Новое фото в галерею машины: большое 1000 px и превью 480 px, пропорции как у остальных кадров */
export async function processGalleryPhoto(up: Upload, by: string, size = { w: 1000, h: 664 }) {
  let meta: Metadata;
  try { meta = await sharp(up.buf, { failOn: "error" }).metadata(); } catch { throw new UploadError("Не удалось прочитать картинку — нужен JPG, PNG, WebP или AVIF"); }
  if (!meta.width || meta.width < 700) throw new UploadError(`Фото слишком маленькое: нужно от ${size.w} px в ширину`);
  const make = async (w: number, h: number) => {
    const { data, info } = await sharp(up.buf).rotate().resize(w, h, { fit: "cover" }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
    return saveFile(data, { name: up.name.replace(/\.[a-z0-9]+$/i, "") + `-${w}.webp`, mime: "image/webp", w: info.width, h: info.height, by, kind: "graphics" });
  };
  const big = await make(size.w, size.h);
  const thumb = await make(480, Math.round((480 * size.h) / size.w));
  return { big: `/media/${big.id}`, thumb: `/media/${thumb.id}`, ids: [big.id, thumb.id] };
}
