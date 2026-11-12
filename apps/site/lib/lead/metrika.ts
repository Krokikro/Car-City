// Яндекс Метрика: цели и ClientID. Счётчик грузится только после согласия на аналитику
// (components/analytics/Analytics.tsx); без него вызовы молча ничего не делают.

type Ym = ((id: number, method: string, ...args: unknown[]) => void) & { a?: unknown[]; l?: number };

declare global {
  interface Window {
    ym?: Ym;
  }
}

/** Номер счётчика: из настроек SEO в админке (атрибут data-ym у <html>), иначе из переменной окружения */
export function ymId(): number {
  if (typeof document !== "undefined") {
    const v = Number(document.documentElement.dataset.ym);
    if (v) return v;
  }
  return Number(process.env.NEXT_PUBLIC_YM_ID) || 0;
}

/** Цели заявок. Те же имена заводим в интерфейсе Метрики как JavaScript-события. */
export const GOALS = {
  lead: "lead_sent",
  formStart: "form_start",
} as const;

export function reachGoal(goal: string, params?: Record<string, unknown>) {
  const YM_ID = ymId();
  if (!YM_ID || typeof window === "undefined" || !window.ym) return;
  try {
    window.ym(YM_ID, "reachGoal", goal, params);
  } catch {
    // Метрика не должна ломать форму
  }
}

/** ClientID Метрики для связки заявки с визитом. Ждём не дольше timeout мс. */
export function getYmClientId(timeout = 400): Promise<string | undefined> {
  return new Promise((resolve) => {
    const YM_ID = ymId();
    if (!YM_ID || typeof window === "undefined" || !window.ym) return resolve(undefined);
    const t = setTimeout(() => resolve(undefined), timeout);
    try {
      window.ym(YM_ID, "getClientID", (id: string) => {
        clearTimeout(t);
        resolve(id ? String(id) : undefined);
      });
    } catch {
      clearTimeout(t);
      resolve(undefined);
    }
  });
}
