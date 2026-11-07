// Настройки сайта из админки: тема (тёмная/светлая) и все настройки SEO — общие и для каждой страницы.
// Хранятся в таблице settings (ключи "site" и "seo") и seo_pages. Значения по умолчанию перенесены со старого
// car-city.pro (коды верификации Яндекса и Google, счётчик Метрики, GA), чтобы при переезде ничего не потерять.
import type { Lang } from "./i18n";

export type Theme = "dark" | "light";
export type Variant = "M" | "A" | "B";

export interface SiteSettings {
  theme: Theme;
  /** вариант светлой подачи: M — цветные фоны классов, A — бетон, B — светлый подвал */
  variant: Variant;
}
export const DEFAULT_SITE: SiteSettings = { theme: "dark", variant: "M" };

export type PageType = "home" | "class" | "model" | "article" | "page";
export type Freq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export interface SeoSettings {
  /** основной адрес сайта: на него указывают canonical, sitemap, hreflang, Open Graph */
  canonicalOrigin: string;
  /** домены, которые можно индексировать; на остальных (Railway, превью) — noindex и запрет в robots.txt */
  indexHosts: string[];
  /** www.car-city.pro → car-city.pro (301) */
  wwwRedirect: boolean;
  /** адреса с заглавными буквами → строчные (301), как на старом сайте */
  lowercaseRedirect: boolean;
  /** полностью закрыть сайт от индексации (например, на время работ) */
  noindexAll: boolean;

  siteName: string;
  /** шаблон title, %s — заголовок страницы; пусто — title как есть */
  titleTemplate: string;
  defaultDescription: string;
  /** картинка для соцсетей по умолчанию */
  ogImage: string;
  twitterCard: "summary" | "summary_large_image";
  /** шаблоны title/description по типу страницы, {title} {h1} {name} {price}; пусто — не применяются */
  templates: Partial<Record<PageType, { title?: string; description?: string }>>;

  yandexVerification: string;
  googleVerification: string;
  bingVerification: string;
  mailruVerification: string;
  /** номер счётчика Яндекс Метрики (тот же, что на старом сайте — сохраняется история) */
  metrikaId: string;
  gaId: string;
  gtmId: string;
  /** свой код в <head> (meta/link/script) — только для администратора */
  headHtml: string;

  /** текст robots.txt; пусто — собирается автоматически */
  robotsTxt: string;
  sitemap: {
    langs: Lang[];
    /** адреса или маски (/lab, /novosti/*) — не попадают в sitemap */
    exclude: string[];
    priority: Record<PageType, number>;
    changefreq: Record<PageType, Freq>;
    images: boolean;
  };
  /** hreflang-ссылки на переводы */
  hreflang: boolean;
  /** микроразметка организации (AutoRental) на главной */
  orgLd: boolean;
}

export const DEFAULT_SEO: SeoSettings = {
  canonicalOrigin: "https://car-city.pro",
  indexHosts: ["car-city.pro"],
  wwwRedirect: true,
  lowercaseRedirect: true,
  noindexAll: false,
  siteName: "Car City",
  titleTemplate: "",
  defaultDescription: "Аренда машин для работы в такси и выкуп без кредита. Эконом, Комфорт, Комфорт+, Грузовой. Машина в день заявки.",
  ogImage: "/video/hero-poster.webp",
  twitterCard: "summary_large_image",
  templates: {},
  yandexVerification: "f9a1e204a0940193",
  googleVerification: "vMklyyzB6K622rKduIF6eqQ6rWnnIHsJe2OG0OyNCsc",
  bingVerification: "",
  mailruVerification: "",
  metrikaId: "96752669",
  gaId: "G-ECNBZN3PHM",
  gtmId: "",
  headHtml: "",
  robotsTxt: "",
  sitemap: {
    langs: ["ru", "en", "ky", "kk", "uz"],
    exclude: ["/lab", "/spasibo"],
    priority: { home: 1, class: 0.9, model: 0.8, article: 0.6, page: 0.7 },
    changefreq: { home: "daily", class: "weekly", model: "weekly", article: "monthly", page: "monthly" },
    images: true,
  },
  hreflang: true,
  orgLd: true,
};

/** SEO отдельной страницы. Пустое поле — берётся из текста страницы или общих настроек. */
export interface PageSeo {
  title?: string;
  description?: string;
  keywords?: string;
  /** свой canonical (полный адрес или путь); пусто — адрес самой страницы */
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  /** исключить из sitemap */
  sitemapExclude?: boolean;
  priority?: number;
  changefreq?: Freq;
  /** дополнительная микроразметка JSON-LD (массив или объект) */
  jsonLd?: string;
  /** не выводить hreflang у этой страницы */
  noHreflang?: boolean;
}

export const PAGE_TYPE_NAMES: Record<PageType, string> = { home: "Главная", class: "Классы и разделы", model: "Модели", article: "Статьи", page: "Остальные страницы" };
export const FREQS: Freq[] = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];

/** Объединить сохранённое с умолчаниями (новые поля появляются сами) */
export function mergeSeo(raw: unknown): SeoSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<SeoSettings>;
  return {
    ...DEFAULT_SEO,
    ...r,
    sitemap: {
      ...DEFAULT_SEO.sitemap,
      ...(r.sitemap ?? {}),
      priority: { ...DEFAULT_SEO.sitemap.priority, ...(r.sitemap?.priority ?? {}) },
      changefreq: { ...DEFAULT_SEO.sitemap.changefreq, ...(r.sitemap?.changefreq ?? {}) },
    },
    templates: { ...(r.templates ?? {}) },
    indexHosts: Array.isArray(r.indexHosts) ? r.indexHosts : DEFAULT_SEO.indexHosts,
  };
}
export function mergeSite(raw: unknown): SiteSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<SiteSettings>;
  return { theme: r.theme === "light" ? "light" : "dark", variant: r.variant === "A" || r.variant === "B" ? r.variant : "M" };
}

/** Тип страницы по адресу — для приоритета в sitemap и шаблонов */
export function pageType(path: string, kind?: string): PageType {
  if (path === "/") return "home";
  if (kind === "article" || path.startsWith("/novosti/")) return "article";
  if (kind === "model") return "model";
  if (/^\/(ekonom|komfort|komfortplus|biznes|gruzovoy|vykup|arenda-taksi-ip|kia-dlya-taksi|chery-dlya-taksi)(\/(ekonom|komfort|komfort-plyus|biznes|dostavka|gruzovoy))?$/.test(path)) return "class";
  return "page";
}

/** Адрес совпадает с маской: точный путь или префикс со звёздочкой */
export const matchMask = (path: string, mask: string) => {
  const m = mask.trim().toLowerCase();
  if (!m) return false;
  const p = path.toLowerCase();
  return m.endsWith("*") ? p.startsWith(m.slice(0, -1)) : p === m || p === m.replace(/\/$/, "");
};
