// Копирует снятые с car-city.pro тексты из общей папки проекта в content/ репозитория.
// Это исходник для статической сборки и будущий сид для админки.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SRC = process.env.CONTENT_SRC ?? "/mnt/project-files/Сайт car-city/контент";
const DST = new URL("../content/", import.meta.url).pathname;
const map = { "страницы": "pages", "модели": "models", "статьи": "articles" };
for (const [from, to] of Object.entries(map)) {
  const dir = join(SRC, from);
  if (!existsSync(dir)) continue;
  mkdirSync(join(DST, to), { recursive: true });
  for (const f of readdirSync(dir)) if (/\.(md|json)$/.test(f)) cpSync(join(dir, f), join(DST, to, f));
  console.log(to, readdirSync(join(DST, to)).length);
}
