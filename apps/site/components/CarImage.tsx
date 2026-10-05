import { carImages } from "@/lib/car-images";
import type { Model } from "@/lib/content";

// Фото: AVIF + WebP в двух ширинах, ~25–45 КБ на карточку. Нет фото — силуэт с шашкой.
export function CarImage({ model, priority = false }: { model: Model; priority?: boolean }) {
  const meta = carImages[model.slug];
  if (!meta) {
    return (
      <svg className="car-silhouette" viewBox="0 0 320 140" role="img" aria-label={model.name}>
        <path d="M24 104c0-10 6-18 16-21l44-12 38-30c6-5 13-7 21-7h70c9 0 17 4 23 10l30 30 30 6c10 2 16 10 16 20v8c0 6-4 10-10 10h-14a30 30 0 0 0-58 0H112a30 30 0 0 0-58 0H34c-6 0-10-4-10-10z" fill="currentColor" opacity=".9" />
        <path d="M128 46c4-4 9-6 15-6h33v32h-71zM186 40h30c6 0 11 2 15 6l24 26h-69z" fill="var(--bg)" opacity=".55" />
        <circle cx="83" cy="118" r="20" fill="var(--bg)" /><circle cx="83" cy="118" r="10" fill="currentColor" opacity=".5" />
        <circle cx="257" cy="118" r="20" fill="var(--bg)" /><circle cx="257" cy="118" r="10" fill="currentColor" opacity=".5" />
        <rect x="150" y="24" width="36" height="10" rx="2" fill={`url(#chk-${model.slug})`} />
        <defs>
          <pattern id={`chk-${model.slug}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#0B0B0C" /><rect width="3" height="3" fill="#FFB700" /><rect x="3" y="3" width="3" height="3" fill="#FFB700" />
          </pattern>
        </defs>
      </svg>
    );
  }
  const base = `/cars/${model.slug}`;
  return (
    <picture>
      <source type="image/avif" srcSet={`${base}-480.avif 480w, ${base}-800.avif 800w`} sizes="(max-width: 720px) 90vw, 400px" />
      <source type="image/webp" srcSet={`${base}-480.webp 480w, ${base}-800.webp 800w`} sizes="(max-width: 720px) 90vw, 400px" />
      <img src={`${base}-800.webp`} alt={model.name} width={meta.w} height={meta.h} loading={priority ? "eager" : "lazy"} decoding="async" />
    </picture>
  );
}
