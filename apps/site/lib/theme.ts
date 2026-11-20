// Тема сайта: тёмная или светлая. Выбирается в админке (Настройки → Тема) и применяется без пересборки:
// сервер берёт её из базы (overlay), браузер — из атрибута data-theme на <html>, который отрисовал сервер.
// NEXT_PUBLIC_THEME / NEXT_PUBLIC_LIGHT_VARIANT при сборке жёстко закрепляют тему — для копий сайта под опрос
// (Car-City-Light, -A, -B на Railway); у основного сайта эти переменные не задаются.
import type { Theme, Variant } from "./site-settings";

const env = process.env.NEXT_PUBLIC_THEME;
const FORCED: Theme | null = env === "light" ? "light" : env === "dark" ? "dark" : null;
const ENV_VARIANT = (process.env.NEXT_PUBLIC_LIGHT_VARIANT || "").toUpperCase();
const asVariant = (v: string | undefined): Variant => (v === "A" || v === "B" ? v : "M");

// Хранится в globalThis: серверные компоненты и серверная отрисовка клиентских — разные копии модулей
// в одном процессе Node, а тема у них должна быть одна.
type State = { theme: Theme; variant: Variant };
const g = globalThis as typeof globalThis & { __ccTheme?: State };
if (!g.__ccTheme) g.__ccTheme = { theme: FORCED ?? "dark", variant: asVariant(ENV_VARIANT) };

/** Тема закреплена переменной окружения — переключатель в админке на этой копии не действует */
export const themeForced = () => FORCED !== null;

/** Вызывается при загрузке настроек из базы */
export function setSiteTheme(theme: Theme, variant: Variant) {
  if (FORCED) return;
  g.__ccTheme = { theme, variant: ENV_VARIANT ? asVariant(ENV_VARIANT) : variant };
}

export function siteTheme(): { theme: Theme; variant: Variant } {
  if (typeof document !== "undefined") {
    const d = document.documentElement.dataset;
    return { theme: d.theme === "light" ? "light" : "dark", variant: asVariant(d.variant) };
  }
  return g.__ccTheme!;
}

export const isLight = () => siteTheme().theme === "light";
/** папка фото машин каталога для текущей темы */
export const carsDir = () => {
  const t = siteTheme();
  return t.theme !== "light" ? "cars" : t.variant === "A" ? "cars-light-a" : "cars-light";
};
