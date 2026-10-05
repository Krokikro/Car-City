// Сжимает фото машин для сайта: node scripts/optimize-cars.mjs [папка]
// Берёт assets-src/fleet/map.json (файл → slug-и из lib/fleet.ts).
// Выход: public/cars/<slug>-{640,1200}.{avif,webp} и lib/car-images.ts с размерами (без сдвига вёрстки).
import sharp from "sharp";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const inDir = path.resolve(process.argv[2] ?? path.join(root, "assets-src/fleet"));
const outDir = path.join(root, "public/cars");
await mkdir(outDir, { recursive: true });
const map = JSON.parse(await readFile(path.join(inDir, "map.json"), "utf8"));

const meta = {};
for (const [file, slugs] of Object.entries(map)) {
  const img = sharp(path.join(inDir, file)).rotate();
  for (const slug of slugs) {
    for (const w of [640, 1200]) {
      const r = img.clone().resize({ width: w, withoutEnlargement: true });
      await r.clone().avif({ quality: 48, effort: 6 }).toFile(path.join(outDir, `${slug}-${w}.avif`));
      await r.clone().webp({ quality: 74, effort: 6 }).toFile(path.join(outDir, `${slug}-${w}.webp`));
    }
    const m = await sharp(path.join(outDir, `${slug}-1200.webp`)).metadata();
    meta[slug] = { w: m.width, h: m.height };
    console.log("ok", slug, m.width + "×" + m.height);
  }
}
await writeFile(
  path.join(root, "lib/car-images.ts"),
  `// Генерируется скриптом scripts/optimize-cars.mjs — не править руками.\nexport const carImages: Record<string, { w: number; h: number }> = ${JSON.stringify(meta, null, 2)};\n`,
);
