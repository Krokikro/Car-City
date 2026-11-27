import type { Lang } from "@/lib/i18n";

// Корневой layout общий для всех языков, поэтому язык документа выставляем здесь, до гидрации.
export function HtmlLang({ lang }: { lang: Lang }) {
  if (lang === "ru") return null;
  return <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(lang)}` }} />;
}
