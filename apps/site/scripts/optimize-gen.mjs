// Сжимает сгенерированные картинки (Higgsfield) для сайта: node scripts/optimize-gen.mjs
//   assets-src/gen/cars/<slug>.png   → public/cars/<slug>-{640,1200}.{avif,webp}   + lib/car-images.ts
//   assets-src/gen/pages/<key>.png   → public/pages/<key>-{960,1920}.{avif,webp}  + lib/page-images.ts
//   assets-src/gen/news/<slug>.png   → public/news/<slug>-{640,1200}.{avif,webp}  + lib/news-images.ts
import sharp from "sharp";
import { mkdir, writeFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const kinds = [
  { dir: "cars", sizes: [640, 1200], out: "lib/car-images.ts", name: "carImages" },
  { dir: "pages", sizes: [960, 1920], out: "lib/page-images.ts", name: "pageImages" },
  { dir: "news", sizes: [640, 1200], out: "lib/news-images.ts", name: "newsImages" },
  { dir: "team", sizes: [480, 960], out: "lib/team-images.ts", name: "teamImages" },
];
// пропускаем файлы, у которых готовые размеры новее исходника
const fresh = async (srcFile, outFile) => {
  const [a, b] = await Promise.all([stat(srcFile).catch(() => null), stat(outFile).catch(() => null)]);
  return a && b && b.mtimeMs >= a.mtimeMs;
};
for (const k of kinds) {
  const src = path.join(root, "assets-src/gen", k.dir);
  const dst = path.join(root, "public", k.dir);
  await mkdir(dst, { recursive: true });
  const files = (await readdir(src).catch(() => [])).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
  const meta = {};
  for (const f of files) {
    const slug = f.replace(/\.[^.]+$/, "");
    const img = sharp(path.join(src, f)).rotate();
    const skip = await fresh(path.join(src, f), path.join(dst, `${slug}-${k.sizes[1]}.avif`));
    for (const w of skip ? [] : k.sizes) {
      const r = img.clone().resize({ width: w, withoutEnlargement: true });
      await r.clone().avif({ quality: 50, effort: 3 }).toFile(path.join(dst, `${slug}-${w}.avif`));
      await r.clone().webp({ quality: 78, effort: 4 }).toFile(path.join(dst, `${slug}-${w}.webp`));
    }
    const m = await sharp(path.join(dst, `${slug}-${k.sizes[1]}.webp`)).metadata();
    meta[slug] = { w: m.width, h: m.height };
    if (!skip) console.log("ok", k.dir, slug, `${m.width}×${m.height}`);
  }
  if (!files.length && k.dir === "cars") continue; // старые фото машин не трогаем, пока нет новых
  await writeFile(path.join(root, k.out), `// Генерируется скриптом scripts/optimize-gen.mjs — не править руками.\nexport const ${k.name}: Record<string, { w: number; h: number }> = ${JSON.stringify(meta, null, 2)};\n`);
}
