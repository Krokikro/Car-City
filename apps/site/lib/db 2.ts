// Postgres админки (PRD 14.1). Подключение лениво: без DATABASE_URL сайт работает как раньше, из файлов в content/.
// Схема создаётся при первом обращении (CREATE TABLE IF NOT EXISTS), отдельных миграций на демо не нужно.
import { Pool, type QueryResultRow } from "pg";
import { SCHEMA } from "./admin/schema";

declare global {
  // eslint-disable-next-line no-var
  var __ccPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __ccSchema: Promise<void> | undefined;
}

export const dbEnabled = () => Boolean(process.env.DATABASE_URL);

function pool() {
  if (!globalThis.__ccPool) {
    const url = process.env.DATABASE_URL!;
    // Внутри Railway (postgres.railway.internal) TLS не нужен; по публичному адресу — нужен, без проверки цепочки
    const ssl = /railway\.internal|localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false };
    globalThis.__ccPool = new Pool({ connectionString: url, ssl, max: 6, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 });
    globalThis.__ccPool.on("error", (e) => console.error("pg pool:", e.message));
  }
  return globalThis.__ccPool;
}

async function ensure() {
  if (!globalThis.__ccSchema) {
    globalThis.__ccSchema = pool()
      .query(SCHEMA)
      .then(() => undefined)
      .catch((e) => {
        globalThis.__ccSchema = undefined;
        throw e;
      });
  }
  return globalThis.__ccSchema;
}

export async function q<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []) {
  if (!dbEnabled()) throw new Error("DATABASE_URL не задан");
  await ensure();
  return (await pool().query<T>(sql, params)).rows;
}

export async function q1<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []) {
  return (await q<T>(sql, params))[0] as T | undefined;
}
