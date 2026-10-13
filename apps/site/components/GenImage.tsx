import { asset } from "@/lib/i18n";
import { pageImages } from "@/lib/page-images";
import { newsImages } from "@/lib/news-images";

const SETS = {
  pages: { meta: pageImages, sizes: [960, 1920] },
  news: { meta: newsImages, sizes: [640, 1200] },
} as const;

/** Картинка из assets-src/gen (Higgsfield), сжатая scripts/optimize-gen.mjs. Нет файла — ничего не рисуем. */
export function GenImage({ kind, id, className, sizes = "100vw", priority = false, alt = "" }: { kind: keyof typeof SETS; id: string; className?: string; sizes?: string; priority?: boolean; alt?: string }) {
  const set = SETS[kind];
  const m = set.meta[id];
  if (!m) return null;
  const f = (n: number, ext: string) => asset(`/${kind}/${id}-${n}.${ext}`);
  const [a, b] = set.sizes;
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={`${f(a, "avif")} ${a}w, ${f(b, "avif")} ${m.w}w`} sizes={sizes} />
      <source type="image/webp" srcSet={`${f(a, "webp")} ${a}w, ${f(b, "webp")} ${m.w}w`} sizes={sizes} />
      <img src={f(b, "webp")} alt={alt} width={m.w} height={m.h} loading={priority ? "eager" : "lazy"} decoding="async" fetchPriority={priority ? "high" : undefined} />
    </picture>
  );
}

export const hasGen = (kind: keyof typeof SETS, id: string) => Boolean(SETS[kind].meta[id]);

/** Какая картинка шапки у внутренней страницы без машин */
export function pageKey(path: string): string {
  if (path.startsWith("/o-nas")) return "about";
  if (path.startsWith("/usloviya")) return "terms";
  if (path.startsWith("/contact")) return "contacts";
  if (path.startsWith("/novosti")) return "news";
  if (path.startsWith("/reviews")) return "reviews";
  if (path.startsWith("/arenda-taksi-ip")) return "ip";
  return "general";
}
