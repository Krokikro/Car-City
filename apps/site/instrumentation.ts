// После запуска сервера один раз просим сайт обновить страницы с учётом правок из админки:
// при каждом деплое страницы собираются из файлов, а правки лежат в базе.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URL || process.env.NEXT_PHASE === "phase-production-build") return;
  const port = process.env.PORT || "3000";
  const secret = process.env.ADMIN_SECRET_KEY || process.env.DATABASE_URL;
  let tries = 0;
  const knock = async () => {
    tries++;
    try {
      const r = await fetch(`http://127.0.0.1:${port}/api/revalidate`, { method: "POST", headers: { "x-revalidate-secret": secret! }, signal: AbortSignal.timeout(8000) });
      if (r.ok) return;
    } catch {
      /* сервер ещё поднимается */
    }
    if (tries < 6) setTimeout(knock, 3000 * tries).unref();
  };
  setTimeout(knock, 2500).unref();
}
