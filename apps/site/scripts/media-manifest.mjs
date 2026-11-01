// Манифест графики сайта: для каждой картинки и видео из public/ — размеры, формат, вес (и длительность у видео).
// По нему админка («Графика сайта») показывает рекомендованные размеры и проверяет загружаемые замены.
// Запуск: node scripts/media-manifest.mjs (нужны sharp и ffprobe). Результат: lib/media-manifest.json
import { execFileSync } from "node:child_process";
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import sharp from "sharp";

const PUB = new URL("../public", import.meta.url).pathname;
const SKIP = /^(cars-light-a|news-light-a)\/|\.ico$|^carcity-|^favicon|^icon\.svg$/;
const IMG = /\.(webp|avif|png|jpe?g|gif|svg)$/i;
const VID = /\.(mp4|webm)$/i;
const out = {};
function walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    const rel = relative(PUB, p).split("\\").join("/");
    if (SKIP.test(rel) || !(IMG.test(rel) || VID.test(rel))) continue;
    out["/" + rel] = { bytes: statSync(p).size };
  }
}
walk(PUB);
for (const [k, v] of Object.entries(out)) {
  const file = join(PUB, k);
  try {
    if (VID.test(k)) {
      const j = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", file]).toString());
      Object.assign(v, { w: j.streams?.[0]?.width, h: j.streams?.[0]?.height, dur: Math.round(Number(j.format?.duration ?? 0)) });
    } else {
      const m = await sharp(file, { animated: false }).metadata();
      Object.assign(v, { w: m.width, h: m.height });
    }
  } catch { /* битый файл — без размеров */ }
}
const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(new URL("../lib/media-manifest.json", import.meta.url), JSON.stringify(sorted));
console.log("media-manifest:", Object.keys(sorted).length, "файлов");
