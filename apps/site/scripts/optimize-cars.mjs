// Сжимает фото машин для сайта: node scripts/optimize-cars.mjs <папка с исходниками>
// Источник: car-city.pro/assets/components/phpthumbof/cache/<src из lib/content.ts>.
// Файл в папке ищется по имени src или по slug. Выход: public/cars/<slug>-{480,800}.{avif,webp}
// и lib/car-images.ts с размерами (чтобы не было сдвига вёрстки).
import sharp from "sharp";
import { readdir, mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const inDir = process.argv[2];
if (!inDir) throw new Error("Укажите папку с исходными фото");
const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "public/cars");
await mkdir(outDir, { recursive: true });

const content = await readFile(path.join(root, "lib/content.ts"), "utf8");
const models = [...content.matchAll(/slug: "([^"]+)".*?src: "([^"]+)"/g)].map((m) => ({ slug: m[1], src: m[2] }));
const files = await readdir(inDir);
const norm = (s) => s.toLowerCase().replace(/\.(webp|jpe?g|png|avif)$/i, "");

const meta = {};
for (const { slug, src } of models) {
  const file = files.find((f) => norm(f) === norm(src) || norm(f) === slug);
  if (!file) { console.warn("нет фото:", slug); continue; }
  const img = sharp(path.join(inDir, file)).rotate();
  for (const w of [480, 800]) {
    const r = img.clone().resize({ width: w, withoutEnlargement: true });
    await r.clone().avif({ quality: 50, effort: 6 }).toFile(path.join(outDir, `${slug}-${w}.avif`));
    await r.clone().webp({ quality: 72, effort: 6 }).toFile(path.join(outDir, `${slug}-${w}.webp`));
  }
  const m = await sharp(path.join(outDir, `${slug}-800.webp`)).metadata();
  meta[slug] = { w: m.width, h: m.height };
  console.log("ok", slug, m.width + "×" + m.height);
}
await writeFile(
  path.join(root, "lib/car-images.ts"),
  `// Генерируется скриптом scripts/optimize-cars.mjs — не править руками.\nexport const carImages: Record<string, { w: number; h: number }> = ${JSON.stringify(meta, null, 2)};\n`,
);
