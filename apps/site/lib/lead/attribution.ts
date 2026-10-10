// Источник визита (PRD 8.1): UTM, yclid, реферер, страница входа, реферальный код.
// Первая точка входа за сессию — в sessionStorage, последняя — по текущему адресу.
// Только для браузера.

import type { Touch } from "./types";

const KEY = "cc_first_touch";
const LAST = "cc_last_touch";
const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "yclid", "gclid", "ref"] as const;

const cut = (s: string, n = 300) => s.slice(0, n);

function read(key: string): Touch | null {
  try {
    const v = sessionStorage.getItem(key);
    return v ? (JSON.parse(v) as Touch) : null;
  } catch {
    return null;
  }
}

function write(key: string, t: Touch) {
  try {
    sessionStorage.setItem(key, JSON.stringify(t));
  } catch {
    // приватный режим — живём без хранилища
  }
}

/** Метки из адреса и реферер. Пустой объект, если меток нет и пришли изнутри сайта. */
function touchFromLocation(): Touch {
  const url = new URL(location.href);
  const t: Touch = {};
  for (const p of PARAMS) {
    const v = url.searchParams.get(p);
    if (v) t[p] = cut(v, 200);
  }
  try {
    const ref = document.referrer;
    if (ref && new URL(ref).host !== location.host) t.referrer = cut(ref);
  } catch {
    // кривой реферер — пропускаем
  }
  return t;
}

/** Вызывается на каждой загрузке страницы: запоминает первую точку входа и последнюю с метками. */
export function captureTouch() {
  if (typeof window === "undefined") return;
  const t = touchFromLocation();
  const stamp = { landing: cut(location.origin + location.pathname + location.search), at: new Date().toISOString() };
  if (!read(KEY)) write(KEY, { ...t, ...stamp });
  if (Object.keys(t).length) write(LAST, { ...t, ...stamp });
}

/** Первая и последняя точки входа для отправки с заявкой */
export function getTouches(): { first: Touch; last: Touch } {
  const first = read(KEY) ?? {};
  const last = read(LAST) ?? first;
  return { first, last };
}
