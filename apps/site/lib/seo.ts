// Метаданные страниц сайта с учётом настроек SEO из админки: title/description/canonical/robots/OG/hreflang.
// По умолчанию title и description — как на старом car-city.pro (тексты перенесены один в один),
// админка может переопределить их для любой страницы или задать шаблоны по типу страницы.
import type { Metadata } from "next";
import { LANGS, type Lang } from "./i18n";
import { pageSeo, type Overlay } from "./admin/overlay";
import { pageType, type PageSeo, type PageType } from "./site-settings";
import { fleet } from "./fleet";

/** Путь в нижнем регистре: так адреса отдаёт и старый сайт (заглавные → 301 на строчные) */
export const lc = (p: string) => p.toLowerCase();

/** Адрес страницы на языке lang по русскому пути */
export const langPath = (path: string, lang: Lang) => (lang === "ru" ? lc(path) : `/${lang}${path === "/" ? "" : lc(path)}`);

function fill(tpl: string, v: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "").replace(/\s{2,}/g, " ").trim();
}

export interface MetaInput {
  ov: Overlay;
  lang: Lang;
  /** русский путь страницы (как в файлах контента) */
  path: string;
  title: string;
  description?: string;
  h1?: string;
  kind?: string;
  image?: string;
  /** только эти языки есть у страницы (для hreflang); по умолчанию все */
  langs?: Lang[];
}

export function seoOf(ov: Overlay, lang: Lang, path: string): PageSeo {
  return pageSeo(ov, lang, path);
}

export function buildMeta(m: MetaInput): Metadata {
  const { ov, lang, path } = m;
  const s = ov.seo;
  const ps = seoOf(ov, lang, path);
  const type: PageType = pageType(lc(path), m.kind);
  const slug = path.split("/").pop() ?? "";
  const car = m.kind === "model" ? fleet.find((c) => c.rent?.toLowerCase().endsWith("/" + slug.toLowerCase()) || c.buy?.toLowerCase().endsWith("/" + slug.toLowerCase())) : undefined;
  const vars = { title: m.title, h1: m.h1 ?? m.title, name: car?.name ?? m.h1 ?? "", price: car ? String(car.price || car.buyPrice || "") : "" };
  const tpl = s.templates[type];
  let title = ps.title || (tpl?.title ? fill(tpl.title, vars) : "") || m.title;
  if (!ps.title && s.titleTemplate && s.titleTemplate.includes("%s") && !title.includes(s.siteName)) title = s.titleTemplate.replace("%s", title);
  const description = ps.description || (tpl?.description ? fill(tpl.description, vars) : "") || m.description || s.defaultDescription;
  const self = langPath(path, lang);
  const canonical = ps.canonical ? (ps.canonical.startsWith("http") ? ps.canonical : lc(ps.canonical)) : self;
  const noindex = s.noindexAll || ps.noindex;
  const langs = m.langs ?? LANGS;
  const languages = s.hreflang && !ps.noHreflang
    ? Object.fromEntries([...langs.filter((l) => s.sitemap.langs.includes(l)).map((l) => [l, langPath(path, l)]), ["x-default", lc(path)]])
    : undefined;
  const image = ps.ogImage || m.image || s.ogImage;
  return {
    title: { absolute: title },
    description,
    keywords: ps.keywords || undefined,
    alternates: { canonical, languages },
    robots: noindex || ps.nofollow ? { index: !noindex, follow: !ps.nofollow } : undefined,
    openGraph: {
      title: ps.ogTitle || title,
      description: ps.ogDescription || description,
      url: self,
      siteName: s.siteName,
      locale: lang === "ru" ? "ru_RU" : lang === "en" ? "en_US" : lang,
      type: m.kind === "article" ? "article" : "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: s.twitterCard, title: ps.ogTitle || title, description: ps.ogDescription || description, images: image ? [image] : undefined },
  };
}

/** Своя микроразметка страницы из админки (JSON-LD), если задана и это корректный JSON */
export function extraLd(ov: Overlay, lang: Lang, path: string): string | null {
  const raw = seoOf(ov, lang, path).jsonLd?.trim();
  if (!raw) return null;
  try { return JSON.stringify(JSON.parse(raw)); } catch { return null; }
}
