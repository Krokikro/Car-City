// Пределы длины для всего, что вводится текстом в админке. Одни и те же числа стоят в полях формы (maxlength — больше ввести нельзя,
// рядом счётчик «N / max») и проверяются на сервере, чтобы длинный текст не ломал вёрстку сайта.
// warn — рекомендуемая длина (для title/description: сколько поисковик показывает в выдаче).

export const LIM = {
  // страницы и статьи
  h1: 140,
  title: 160, titleWarn: 70,
  description: 320, descriptionWarn: 170,
  pagePath: 200,
  body: 60000,
  // SEO страницы
  keywords: 250,
  canonical: 300,
  ogTitle: 120, ogDescription: 300, ogImage: 300,
  jsonLd: 20000,
  // SEO сайта
  origin: 100, hosts: 1000, siteName: 60, titleTemplate: 60, verification: 120, counterId: 30,
  tplTitle: 160, tplDescription: 320, headHtml: 8000, robotsTxt: 10000, sitemapExclude: 5000,
  // автопарк — карточка машины
  carName: 28, engine: 14, gearbox: 12, badge: 22,
  // отзывы
  reviewName: 60, reviewDate: 40, reviewText: 1200, url: 500,
  // заявки
  leadComment: 4000,
  // пользователи и роли
  personName: 80, login: 60, email: 120, roleName: 40, roleId: 31,
  // редиректы
  redirectPath: 500, redirectNote: 200, redirectCsv: 200000,
  search: 100,
} as const;

/** Проверка длины полей формы на сервере. Возвращает текст ошибки или null. */
export function lenError(fd: FormData, spec: Record<string, [label: string, max: number]>): string | null {
  const bad: string[] = [];
  for (const [name, [label, max]] of Object.entries(spec)) {
    for (const v of fd.getAll(name)) {
      if (typeof v === "string" && [...v.trim()].length > max) { bad.push(`«${label}» — не больше ${max} символов`); break; }
    }
  }
  return bad.length ? `Слишком длинный текст: ${bad.join("; ")}` : null;
}
