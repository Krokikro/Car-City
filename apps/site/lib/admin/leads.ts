// Заявки в админке: фильтры (период, источник, язык, город, статус), дозаполнение источника и города
// у старых заявок, строки для выгрузки и отчёта.

import { q } from "../db";
import { attribute, sourceLine } from "../lead/source";
import { geoLookup, geoLine } from "../lead/server/geo";
import { langOfPage } from "../lead/server/enrich";
import { LANG_NAMES } from "../lead/server/deliver";
import { EXTRA_LABELS, MESSENGER_LABELS, MODE_LABELS, type Lead } from "../lead/types";
import { LEAD_STATUS_NAME } from "./roles";
import { leadScope } from "./scope";
import type { AdminUser } from "./auth";

export const ORIGIN_NAMES: Record<string, string> = { form: "Форма на сайте", chat: "Чат на сайте", telegram: "Telegram", max: "MAX", whatsapp: "WhatsApp" };
export { LANG_NAMES };

export interface LeadFilter {
  from?: string; to?: string; period?: string; status?: string; q?: string; mine?: string;
  group?: string; channel?: string; lang?: string; origin?: string; city?: string;
}

const TZ = "Europe/Moscow";
const day = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(d); // YYYY-MM-DD по Москве

/** Готовые периоды → даты «с» и «по» (включительно, по московскому времени) */
export function periodRange(p?: string): { from?: string; to?: string } {
  const now = new Date();
  const today = day(now);
  const shift = (n: number) => day(new Date(now.getTime() - n * 86_400_000));
  const [y, m] = today.split("-").map(Number);
  const mStart = (yy: number, mm: number) => `${yy}-${String(mm).padStart(2, "0")}-01`;
  const mEnd = (yy: number, mm: number) => day(new Date(Date.UTC(yy, mm, 0, 12)));
  switch (p) {
    case "today": return { from: today, to: today };
    case "yesterday": return { from: shift(1), to: shift(1) };
    case "7d": return { from: shift(6), to: today };
    case "30d": return { from: shift(29), to: today };
    case "month": return { from: mStart(y, m), to: today };
    case "prev-month": { const pm = m === 1 ? 12 : m - 1, py = m === 1 ? y - 1 : y; return { from: mStart(py, pm), to: mEnd(py, pm) }; }
    case "quarter": { const qm = Math.floor((m - 1) / 3) * 3 + 1; return { from: mStart(y, qm), to: today }; }
    case "year": return { from: `${y}-01-01`, to: today };
    default: return {};
  }
}
export const PERIODS: [string, string][] = [["today", "Сегодня"], ["yesterday", "Вчера"], ["7d", "7 дней"], ["30d", "30 дней"], ["month", "Этот месяц"], ["prev-month", "Прошлый месяц"], ["quarter", "Квартал"], ["year", "Год"], ["all", "Всё время"]];

const isDate = (s?: string) => Boolean(s && /^\d{4}-\d{2}-\d{2}$/.test(s));

/** WHERE для заявок с учётом прав сотрудника и фильтров */
export function leadWhere(user: Pick<AdminUser, "id" | "leadScope">, f: LeadFilter) {
  const sc = leadScope(user);
  const params: unknown[] = [...sc.params];
  const where = [sc.sql.replace(/\bassignee\b/g, "l.assignee")];
  const add = (sql: (n: number) => string, v: unknown) => { params.push(v); where.push(sql(params.length)); };
  const range = f.period && f.period !== "custom" ? periodRange(f.period) : { from: f.from, to: f.to };
  if (isDate(range.from)) add((n) => `l.at >= ($${n}::date AT TIME ZONE '${TZ}')`, range.from);
  if (isDate(range.to)) add((n) => `l.at < (($${n}::date + 1) AT TIME ZONE '${TZ}')`, range.to);
  if (f.status) add((n) => `l.status = $${n}`, f.status);
  if (f.mine) add((n) => `l.assignee::text = $${n}`, user.id);
  if (f.group) add((n) => `l.src_group = $${n}`, f.group);
  if (f.channel) add((n) => `l.channel = $${n}`, f.channel);
  if (f.lang) add((n) => `l.lang = $${n}`, f.lang);
  if (f.origin) add((n) => `l.origin = $${n}`, f.origin);
  if (f.city) add((n) => `l.city = $${n}`, f.city);
  if (f.q?.trim()) add((n) => `(l.data->>'name' ILIKE $${n} OR l.data->>'phone' ILIKE $${n} OR l.id ILIKE $${n} OR l.comment ILIKE $${n})`, `%${f.q.trim()}%`);
  return { sql: where.join(" AND "), params, range };
}

/** Дозаполнить источник, город и язык у заявок, принятых до автозаполнения или пока база городов грузилась */
export async function backfillLeads(limit = 300) {
  const rows = await q<{ id: string; data: Lead }>(
    "SELECT id, data FROM leads WHERE channel IS NULL OR lang IS NULL OR (city IS NULL AND COALESCE(data->>'geoTried','') = '') ORDER BY at DESC LIMIT $1", [limit],
  );
  let wait = 4000; // первый раз даём базе городов загрузиться
  for (const r of rows) {
    const d = r.data;
    const attr = d.attr ?? attribute(d.first, d.last);
    const lang = d.lang || langOfPage(d.page);
    // null — база городов ещё не загружена (попробуем в следующий раз), {} — IP в базе не найден
    const found = d.geo ?? (await geoLookup(d.ip, wait));
    wait = 0;
    const geo = found && Object.keys(found).length ? found : null;
    const patch: Partial<Lead> & { geoTried?: string } = { attr, lang };
    if (geo) patch.geo = geo; else if (found) patch.geoTried = new Date().toISOString();
    await q(
      "UPDATE leads SET data = data || $2::jsonb, channel=$3, src_group=$4, lang=$5, city=COALESCE(city,$6), country=COALESCE(country,$7) WHERE id=$1",
      [r.id, JSON.stringify(patch), attr.channel, attr.group, lang, geo?.city ?? null, geo?.country ?? null],
    );
  }
  return rows.length;
}

export interface LeadRow { id: string; at: string; data: Lead; status: string; reason: string | null; comment: string; assignee_name: string | null; channel: string | null; src_group: string | null; city: string | null; country: string | null; lang: string | null; origin: string }

export async function listLeads(user: AdminUser, f: LeadFilter, limit = 50, offset = 0) {
  const w = leadWhere(user, f);
  const total = Number((await q<{ n: string }>(`SELECT count(*) n FROM leads l WHERE ${w.sql}`, w.params))[0].n);
  const rows = await q<LeadRow>(
    `SELECT l.id, l.at, l.data, l.status, l.reason, l.comment, u.name assignee_name, l.channel, l.src_group, l.city, l.country, l.lang, l.origin
     FROM leads l LEFT JOIN users u ON u.id = l.assignee WHERE ${w.sql} ORDER BY l.at DESC LIMIT ${limit} OFFSET ${offset}`, w.params,
  );
  return { total, rows, range: w.range };
}

const MSK = new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });
const want = (d: Lead) => [d.extra?.mode && (MODE_LABELS[d.extra.mode] ?? d.extra.mode), d.extra?.model, d.extra?.cls].filter(Boolean).join(", ");

/** Колонки выгрузки */
export const EXPORT_COLS = [
  "№", "Дата и время (МСК)", "Имя", "Телефон", "Как связаться", "Что хотел", "Сообщение", "Откуда заявка", "Источник", "Группа источника", "Кампания", "Ключевая фраза",
  "Объявление / площадка", "Первый вход", "Последний вход", "Страница входа", "Страница заявки", "Форма", "Версия сайта", "Город", "Регион", "Страна", "Устройство",
  "Статус", "Причина отказа", "Ответственный", "Комментарий", "Лид в Битрикс24",
];

export function exportRow(r: LeadRow): (string | number)[] {
  const d = r.data;
  const a = d.attr ?? attribute(d.first, d.last);
  return [
    r.id, MSK.format(new Date(r.at)), d.name || "", d.phone || "", d.messenger ? MESSENGER_LABELS[d.messenger] : "", want(d), d.extra?.message ?? "",
    ORIGIN_NAMES[r.origin] ?? r.origin, a.channel, a.group, a.campaign ?? "", a.term ?? "", a.content ?? "", sourceLine(a.first), sourceLine(a.last),
    d.first?.landing ?? "", d.page ?? "", d.source, LANG_NAMES[r.lang ?? d.lang ?? "ru"] ?? r.lang ?? "", d.geo?.city ?? "", d.geo?.region ?? "", d.geo?.country ?? "",
    { mobile: "телефон", tablet: "планшет", desktop: "компьютер" }[d.device] ?? d.device, LEAD_STATUS_NAME[r.status] ?? r.status, r.reason ?? "", r.assignee_name ?? "", r.comment ?? "",
    (d as Lead & { bitrixId?: number }).bitrixId ?? "",
  ];
}

export { EXTRA_LABELS, MODE_LABELS, geoLine, sourceLine };

// ── отчёт ──
export interface Bucket { key: string; n: number; won: number; lost: number }
export interface Report {
  total: number; won: number; lost: number; inWork: number; days: number;
  byDay: Bucket[]; byGroup: Bucket[]; byChannel: Bucket[]; byCampaign: Bucket[]; byCity: Bucket[]; byLang: Bucket[]; byOrigin: Bucket[]; byStatus: Bucket[]; byModel: Bucket[];
}

export async function leadReport(user: AdminUser, f: LeadFilter): Promise<Report> {
  const w = leadWhere(user, f);
  const agg = async (expr: string, order = "n DESC", limit = 50) => (await q<{ key: string | null; n: string; won: string; lost: string }>(
    `SELECT ${expr} AS key, count(*) n, count(*) FILTER (WHERE l.status='issued') won, count(*) FILTER (WHERE l.status='lost') lost
     FROM leads l WHERE ${w.sql} GROUP BY 1 ORDER BY ${order} LIMIT ${limit}`, w.params,
  )).map((r) => ({ key: r.key ?? "—", n: Number(r.n), won: Number(r.won), lost: Number(r.lost) }));
  const [tot] = await agg("'all'");
  const byDay = await agg(`to_char(l.at AT TIME ZONE '${TZ}', 'YYYY-MM-DD')`, "1 ASC", 400);
  const days = byDay.length ? Math.max(1, Math.round((Date.parse(byDay[byDay.length - 1].key) - Date.parse(byDay[0].key)) / 86_400_000) + 1) : 0;
  return {
    total: tot?.n ?? 0, won: tot?.won ?? 0, lost: tot?.lost ?? 0, inWork: (tot?.n ?? 0) - (tot?.won ?? 0) - (tot?.lost ?? 0), days,
    byDay,
    byGroup: await agg("COALESCE(l.src_group, 'не определён')"),
    byChannel: await agg("COALESCE(l.channel, 'не определён')"),
    byCampaign: (await agg("COALESCE(l.channel,'—') || ' · ' || COALESCE(NULLIF(l.data->'attr'->>'campaign',''), 'без кампании')", "n DESC", 30)),
    byCity: await agg("COALESCE(l.city, 'не определён')", "n DESC", 30),
    byLang: await agg("COALESCE(l.lang, 'ru')"),
    byOrigin: await agg("l.origin"),
    byStatus: await agg("l.status"),
    byModel: await agg("COALESCE(NULLIF(l.data->'extra'->>'model',''), 'не указана')", "n DESC", 30),
  };
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
/** Листы отчёта для выгрузки */
export function reportSheets(r: Report, title: string) {
  const t = (name: string, rows: Bucket[], label: string, map?: (k: string) => string) => ({
    name, rows: [[label, "Заявок", "Доля, %", "Выдано", "Конверсия в выдачу, %", "Отказ"], ...rows.map((b) => [map ? map(b.key) : b.key, b.n, pct(b.n, r.total), b.won, pct(b.won, b.n), b.lost])],
  });
  return [
    { name: "Итоги", rows: [["Показатель", "Значение"], ["Период", title], ["Всего заявок", r.total], ["В среднем в день", r.days ? Math.round((r.total / r.days) * 10) / 10 : 0], ["Выдано", r.won], ["Конверсия в выдачу, %", pct(r.won, r.total)], ["Отказ", r.lost], ["В работе", r.inWork]] },
    t("По дням", r.byDay, "День"),
    t("Группы источников", r.byGroup, "Группа"),
    t("Источники", r.byChannel, "Источник"),
    t("Кампании", r.byCampaign, "Источник · кампания"),
    t("Города", r.byCity, "Город"),
    t("Версии сайта", r.byLang, "Язык", (k) => LANG_NAMES[k] ?? k),
    t("Откуда заявка", r.byOrigin, "Откуда", (k) => ORIGIN_NAMES[k] ?? k),
    t("Статусы", r.byStatus, "Статус", (k) => LEAD_STATUS_NAME[k] ?? k),
    t("Модели", r.byModel, "Модель"),
  ];
}
