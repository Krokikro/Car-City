// Согласие на cookie (PRD 8.2, 14.4): необходимые всегда, аналитика и маркетинг — по выбору.
// До выбора работают только необходимые. Только для браузера.

export interface CookieConsent {
  analytics: boolean;
  marketing: boolean;
  /** Версия текста баннера и дата выбора */
  v: string;
  at: string;
}

export const COOKIE_CONSENT_VERSION = "2026-10-05";
const KEY = "cc_consent";
const EVENT = "cc-consent";
const OPEN = "cc-consent-open";
// Выбор живёт полгода, потом спрашиваем снова
const MAX_AGE = 180 * 24 * 3600;

export function getConsent(): CookieConsent | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)cc_consent=([^;]+)/);
  if (!m) return null;
  try {
    const c = JSON.parse(decodeURIComponent(m[1])) as CookieConsent;
    return c.v === COOKIE_CONSENT_VERSION ? c : null;
  } catch {
    return null;
  }
}

export function setConsent(choice: { analytics: boolean; marketing: boolean }) {
  const c: CookieConsent = { ...choice, v: COOKIE_CONSENT_VERSION, at: new Date().toISOString() };
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${KEY}=${encodeURIComponent(JSON.stringify(c))}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent<CookieConsent>(EVENT, { detail: c }));
}

/** Подписка на изменение выбора. Возвращает отписку. */
export function onConsent(cb: (c: CookieConsent) => void) {
  const h = (e: Event) => cb((e as CustomEvent<CookieConsent>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}

/** Открыть настройки cookie заново (ссылка «Настройки cookie» в подвале) */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN));
}

export function onOpenCookieSettings(cb: () => void) {
  window.addEventListener(OPEN, cb);
  return () => window.removeEventListener(OPEN, cb);
}
