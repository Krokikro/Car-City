// Журнал 404: какие адреса ищут и не находят — для раздела «Редиректы и 404» в админке.
// Пишем не чаще раза в минуту на адрес, чтобы боты не нагружали базу.
import { dbEnabled, q } from "./db";

const recent = new Map<string, number>();

export async function log404(path: string, referer: string) {
  if (!dbEnabled() || !path || path.length > 500) return;
  if (/^\/(_next|admin|api)\//.test(path) || /\.(php|env|git|asp|cgi|sql|bak)\b/i.test(path)) return; // сканеры уязвимостей
  const now = Date.now();
  if ((recent.get(path) ?? 0) > now - 60_000) return;
  recent.set(path, now);
  if (recent.size > 5000) recent.clear();
  await q(
    "INSERT INTO not_found (path, referer) VALUES ($1, $2) ON CONFLICT (path) DO UPDATE SET hits = not_found.hits + 1, last_at = now(), referer = COALESCE(NULLIF($2, ''), not_found.referer)",
    [path, referer.slice(0, 500)],
  ).catch(() => {});
}
