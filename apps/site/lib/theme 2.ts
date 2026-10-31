// Светлая версия сайта для A/B-сравнения с тёмной. Включается при сборке: NEXT_PUBLIC_THEME=light.
// Код и контент общие, отличаются только стили (app/styles/light*.css) и фоны фото машин.
// NEXT_PUBLIC_LIGHT_VARIANT — вариант светлой подачи для опроса:
//   M (по умолчанию) — машины на цветных фонах классов, графитовые кнопки и подвал;
//   A — тёплый бетон: все машины на сером бетоне; B — цвета классов, белые кнопки, светлый подвал.
export const LIGHT = process.env.NEXT_PUBLIC_THEME === "light";
export const LIGHT_VARIANT = (process.env.NEXT_PUBLIC_LIGHT_VARIANT || "M").toUpperCase();
/** папка фото машин каталога для текущей темы */
export const CARS_DIR = !LIGHT ? "cars" : LIGHT_VARIANT === "A" ? "cars-light-a" : "cars-light";
