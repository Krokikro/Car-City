// Светлая версия сайта для A/B-сравнения с тёмной. Включается при сборке: NEXT_PUBLIC_THEME=light.
// Код и контент общие, отличаются только стили (app/styles/light*.css) и фоны фото машин (public/cars-light).
export const LIGHT = process.env.NEXT_PUBLIC_THEME === "light";
