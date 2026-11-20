// Языки сайта (PRD, раздел 6). Русский живёт в корне, остальные в подпапках.
// Язык попадает в hreflang, sitemap и переключатель только когда published = true:
// до вычитки носителем страниц на нём нет (PRD 6.3).

export type Locale = "ru" | "ky" | "kk" | "uz" | "en";

export interface LocaleInfo {
  code: Locale;
  /** Название на самом языке, без флагов (PRD 6.2) */
  name: string;
  /** Префикс пути: "" для русского, "/ky" и т.д. */
  prefix: string;
  /** Письменность — для подбора сабсета шрифта */
  script: "cyrillic" | "latin";
  published: boolean;
}

export const locales: Record<Locale, LocaleInfo> = {
  ru: { code: "ru", name: "Русский", prefix: "", script: "cyrillic", published: true },
  ky: { code: "ky", name: "Кыргызча", prefix: "/ky", script: "cyrillic", published: false },
  kk: { code: "kk", name: "Қазақша", prefix: "/kk", script: "cyrillic", published: false },
  uz: { code: "uz", name: "Oʻzbekcha", prefix: "/uz", script: "latin", published: false },
  en: { code: "en", name: "English", prefix: "/en", script: "latin", published: false },
};

export const defaultLocale: Locale = "ru";

export const publishedLocales = (Object.values(locales) as LocaleInfo[]).filter((l) => l.published);

/** Страна по IP → язык-подсказка (PRD 6.1, п. 3). Россия и СНГ без своего языка → null. */
export function localeForCountry(iso2: string): Locale | null {
  switch (iso2.toUpperCase()) {
    case "KG":
      return "ky";
    case "KZ":
      return "kk";
    case "UZ":
      return "uz";
    case "RU":
    case "BY":
    case "AM":
    case "AZ":
    case "TJ":
    case "MD":
      return null;
    default:
      return "en";
  }
}

/** Разбор Accept-Language: первый поддерживаемый язык (PRD 6.1, п. 2). */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const tags = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of tags) {
    const base = tag.split("-")[0] as Locale;
    if (base in locales) return base;
  }
  return null;
}
