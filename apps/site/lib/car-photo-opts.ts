// Машины, у которых фото собраны не скриптом scripts/optimize-gen.mjs, а перенесены как есть со старого сайта:
// нет AVIF-версий, нет слоя с фарами (-lit) и только часть ракурсов. Карточка и сцена модели учитывают это и не просят несуществующие файлы.
export interface CarPhotoOpts { avif: boolean; lit: boolean; shots?: ("front" | "rear" | "side" | "interior")[] }

const OPTS: Record<string, CarPhotoOpts> = {
  // Jetour Dashing — возвращён 12.11.2026, фото со старого car-city.pro
  "jetour-dashing": { avif: false, lit: false, shots: ["front", "side", "interior"] },
};

export const photoOpts = (slug: string): CarPhotoOpts => OPTS[slug] ?? { avif: true, lit: true };
