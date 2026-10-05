import { asset } from "@/lib/i18n";
import { carImages } from "@/lib/car-images";

type Body = "sedan" | "crossover" | "van" | "minivan";

export function bodyOf(name: string): Body {
  const n = name.toLowerCase();
  if (/sollers|largus/.test(n)) return "van";
  if (/gac m8|voyah/.test(n)) return "minivan";
  if (/tiggo|haval|exeed|atlas|omoda|belgee|москвич/.test(n)) return "crossover";
  return "sedan";
}

// Профили кузовов: пока нет фото машин, карточка рисует аккуратный силуэт с бликом и шашкой.
const PATHS: Record<Body, { body: string; glass: string; wheels: [number, number]; r: number }> = {
  sedan: {
    body: "M18 92c0-8 4-14 12-16l38-8 34-24c8-5 16-8 26-8h74c10 0 19 3 27 9l26 21 38 6c12 2 19 9 19 20v10c0 6-4 10-10 10h-20a28 28 0 0 0-55 0H107a28 28 0 0 0-55 0H28c-6 0-10-4-10-10z",
    glass: "M110 46c6-4 12-6 19-6h42v28h-82zM181 40h20c8 0 15 3 21 8l20 20h-61z",
    wheels: [80, 248], r: 24,
  },
  crossover: {
    body: "M16 90c0-9 5-16 13-18l36-8 30-30c7-6 15-9 25-9h88c10 0 18 3 25 9l28 26 34 6c12 2 20 10 20 21v12c0 6-4 10-10 10h-22a30 30 0 0 0-59 0H108a30 30 0 0 0-59 0H26c-6 0-10-4-10-10z",
    glass: "M104 38c6-5 12-7 20-7h48v34h-86zM182 31h24c8 0 14 3 20 8l24 26h-68z",
    wheels: [78, 250], r: 27,
  },
  van: {
    body: "M14 94V38c0-12 8-20 20-20h196c12 0 22 6 28 16l30 40 26 6c10 2 16 10 16 20v8c0 6-4 10-10 10h-18a28 28 0 0 0-55 0H100a28 28 0 0 0-55 0H24c-6 0-10-4-10-10z",
    glass: "M236 30h10c6 0 11 3 14 8l24 34h-48z",
    wheels: [72, 255], r: 25,
  },
  minivan: {
    body: "M16 92c0-9 5-15 13-17l30-6 34-36c8-8 18-12 30-12h112c12 0 22 5 29 14l24 30 30 6c12 2 20 10 20 21v10c0 6-4 10-10 10h-20a29 29 0 0 0-57 0H106a29 29 0 0 0-57 0H26c-6 0-10-4-10-10z",
    glass: "M98 40c6-6 14-9 22-9h46v36H86zM176 31h44c8 0 15 4 20 10l20 26h-84z",
    wheels: [77, 251], r: 26,
  },
};

export function CarArt({ slug, name, priority = false, sizes = "(max-width: 720px) 86vw, 560px" }: { slug: string; name: string; priority?: boolean; sizes?: string }) {
  const meta = carImages[slug];
  if (meta) {
    const base = asset(`/cars/${slug}`);
    return (
      <picture className="car-photo">
        <source type="image/avif" srcSet={`${base}-640.avif 640w, ${base}-1200.avif ${meta.w}w`} sizes={sizes} />
        <source type="image/webp" srcSet={`${base}-640.webp 640w, ${base}-1200.webp ${meta.w}w`} sizes={sizes} />
        <img src={`${base}-1200.webp`} alt={name} width={meta.w} height={meta.h} loading={priority ? "eager" : "lazy"} decoding="async" fetchPriority={priority ? "high" : undefined} />
      </picture>
    );
  }
  const p = PATHS[bodyOf(name)];
  const id = `g-${slug}`;
  return (
    <svg className="car-art" viewBox="0 0 340 140" role="img" aria-label={name}>
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD066" />
          <stop offset=".55" stopColor="#FFB700" />
          <stop offset="1" stopColor="#8A5F00" />
        </linearGradient>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2c4a5c" />
          <stop offset="1" stopColor="#0b1218" />
        </linearGradient>
        <pattern id={`${id}-c`} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#0B0B0C" /><rect width="4" height="4" fill="#FFB700" /><rect x="4" y="4" width="4" height="4" fill="#FFB700" />
        </pattern>
        <radialGradient id={`${id}-s`} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#000" stopOpacity=".7" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="170" cy="126" rx="150" ry="10" fill={`url(#${id}-s)`} />
      <path d={p.body} fill={`url(#${id}-b)`} />
      <path d={p.glass} fill={`url(#${id}-g)`} />
      <rect x="120" y="80" width="96" height="10" fill={`url(#${id}-c)`} rx="1" />
      <path d={p.body} fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="1" />
      {p.wheels.map((x) => (
        <g key={x}>
          <circle cx={x} cy={112} r={p.r} fill="#0c0c0d" />
          <circle cx={x} cy={112} r={p.r * 0.56} fill="#3a3f45" />
          <circle cx={x} cy={112} r={p.r * 0.2} fill="#9aa0a6" />
        </g>
      ))}
    </svg>
  );
}
