// Генерируется скриптом scripts/optimize-cars.mjs: какие фото машин уже сжаты и лежат в public/cars.
// Пока фото нет, карточка рисует силуэт.
export const carImages: Record<string, { w: number; h: number }> = {};
