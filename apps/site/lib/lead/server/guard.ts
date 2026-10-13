// Защита приёма заявок (PRD 8.1, 14.3): проверка Origin/Referer, лимит отправок с IP,
// отсев повторов. Счётчики в памяти процесса: на нескольких инстансах лимит считается
// на каждом отдельно (для общего лимита — Redis, PRD 14.2).

import { company } from "@/lib/content";

const num = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) ? Number(v) : d);

/** IP клиента. За балансировщиком берём первый адрес из X-Forwarded-For. */
export function clientIp(req: Request): string {
  const h = req.headers;
  return (h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0] || "").trim() || "unknown";
}

function allowedHosts(req: Request): Set<string> {
  const hosts = new Set<string>();
  const self = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (self) hosts.add(self.split(",")[0].trim().toLowerCase());
  const main = new URL(company.domain).host;
  hosts.add(main);
  hosts.add("www." + main);
  for (const o of (process.env.LEAD_ALLOWED_ORIGINS || "").split(",")) {
    const v = o.trim();
    if (!v) continue;
    try {
      hosts.add(new URL(v.includes("://") ? v : `https://${v}`).host.toLowerCase());
    } catch {}
  }
  return hosts;
}

/** Заявка пришла со своих страниц: Origin (или Referer, если Origin нет) из списка разрешённых. */
export function originAllowed(req: Request): boolean {
  const src = req.headers.get("origin") || req.headers.get("referer");
  if (!src || src === "null") return false;
  try {
    return allowedHosts(req).has(new URL(src).host.toLowerCase());
  } catch {
    return false;
  }
}

// Скользящее окно: время каждой отправки с IP за последние windowMs
const hits = new Map<string, number[]>();
let lastSweep = 0;

/** true — можно; число — сколько секунд ждать. */
export function rateLimit(ip: string): true | number {
  const limit = num(process.env.LEAD_RATE_LIMIT, 6);
  const windowMs = num(process.env.LEAD_RATE_WINDOW_SEC, 600) * 1000;
  const now = Date.now();
  if (now - lastSweep > windowMs) {
    lastSweep = now;
    for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > windowMs) hits.delete(k);
  }
  const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) {
    hits.set(ip, list);
    return Math.ceil((list[0] + windowMs - now) / 1000);
  }
  list.push(now);
  hits.set(ip, list);
  return true;
}

// Последняя заявка по телефону: двойной клик не шлём дважды, повтор за сутки помечаем
const phones = new Map<string, number>();
const DAY = 24 * 3600 * 1000;

export function repeatOf(phone: string): "double" | "repeat" | null {
  const now = Date.now();
  if (phones.size > 5000) for (const [k, t] of phones) if (now - t > DAY) phones.delete(k);
  const prev = phones.get(phone);
  phones.set(phone, now);
  if (prev === undefined) return null;
  if (now - prev < num(process.env.LEAD_DOUBLE_SEC, 60) * 1000) return "double";
  return now - prev < DAY ? "repeat" : null;
}

export function forgetPhone(phone: string) {
  phones.delete(phone);
}

/** Минимальное время заполнения формы, мс */
export const minFillMs = () => num(process.env.LEAD_MIN_FILL_MS, 3000);
