// Что можно править в разделе «Тексты»: наборы текстов, их поля, подписи и ограничения по длине.
// Ограничения подобраны так, чтобы текст не ломал вёрстку (строки заголовков, кнопки, плашки).
import { LANGS, type Lang } from "../i18n";
import { BASE_HOME } from "../home-text";
import { UI } from "../ui";
import { BASE_COMPANY, BASE_OFFICES } from "../content";
import { leadFormRu, cookieNoticeRu, MORE, PROMO, CALC_X, BUY_TEXT, FINALE, METER, OWNERS_X, LEAD_MODAL, type LeadFormText } from "../text-defaults";
import { leadFormI18n, cookieNoticeI18n } from "../lead/i18n";
import type { Section } from "./roles";

export interface Field { bundle: string; path: string; label: string; group: string; max: number; multiline: boolean; hint?: string }
export interface Bundle { id: string; langs: readonly Lang[]; base: (lang: Lang) => unknown; group: (path: string) => string; label: (path: string) => string; max: (path: string, longest: number) => number; skip?: (path: string) => boolean }
export interface Screen { id: string; title: string; sub: string; section: Section; bundles: Bundle[]; langs: readonly Lang[] }

const n = (p: string, i: number) => Number(p.split(".")[i]) + 1;
const fallbackMax = (longest: number) => Math.max(12, Math.ceil(longest * 1.3 + 4));

// ── главная ──
const HOME_GROUPS: [RegExp, string][] = [
  [/^hero\./, "Первый экран"], [/^ticker\./, "Бегущая лента"], [/^fleet\./, "Автопарк"], [/^steps\./, "Дорога «3 шага»"],
  [/^requirements\./, "Требования к водителям"], [/^benefits\./, "Почему с нами выгодно"], [/^calculator\./, "Калькулятор"],
  [/^trust\./, "Нам доверяют"], [/^promo\./, "Форма «Дарим первый день»"], [/^media\./, "Напишите нам"], [/^whyUs\./, "Почему мы"],
  [/^seo\./, "Текст «О таксопарке»"], [/^reviews\./, "Отзывы"], [/^faq\./, "Частые вопросы"],
];
const HOME_RULES: [RegExp, (p: string) => string, number][] = [
  [/^hero\.lines\.(\d)$/, (p) => `Заголовок H1, строка ${n(p, 2)}`, 24],
  [/^hero\.sub$/, () => "Подзаголовок", 70],
  [/^hero\.bullets\.\d$/, (p) => `Пункт ${n(p, 2)}`, 32],
  [/^hero\.book$/, () => "Кнопка «Забронировать»", 24],
  [/^hero\.pick$/, () => "Кнопка «Подобрать»", 24],
  [/^hero\.stats\.\d\.k$/, (p) => `Цифра ${n(p, 2)}: подпись`, 16],
  [/^hero\.stats\.\d\.v$/, (p) => `Цифра ${n(p, 2)}: значение`, 8],
  [/^hero\.scroll$/, () => "Подсказка «Листайте вниз»", 16],
  [/^hero\.eyebrow$/, () => "Надзаголовок (сейчас скрыт)", 40],
  [/^ticker\.\d$/, (p) => `Фраза ${n(p, 1)}`, 26],
  [/^fleet\.title$/, () => "Заголовок H2", 32],
  [/^fleet\.classes\./, (p) => `Класс: ${p.split(".")[2]}`, 12],
  [/^benefits\.title$/, () => "Заголовок H2", 32],
  [/^benefits\.items\.\d\.text$/, (p) => `Карточка ${n(p, 2)}`, 48],
  [/^trust\.title$/, () => "Заголовок H2", 24],
  [/^trust\.stats\.\d\.label$/, (p) => `Цифра ${n(p, 2)}: подпись`, 40],
  [/^trust\.stats\.\d\.suffix$/, (p) => `Цифра ${n(p, 2)}: знак после числа`, 2],
  [/^trust\.owners\.\d\.name$/, (p) => `Выкупщик ${n(p, 2)}: имя`, 24],
  [/^trust\.owners\.\d\.car$/, (p) => `Выкупщик ${n(p, 2)}: машина`, 22],
  [/^trust\.ctaTitle$/, () => "Заголовок над кнопкой", 36],
  [/^trust\.ctaText$/, () => "Кнопка", 20],
  [/^promo\.title$/, () => "Заголовок H2", 40],
  [/^promo\.text$/, () => "Текст", 90],
  [/^promo\.button$/, () => "Кнопка", 22],
  [/^requirements\.title$/, () => "Заголовок H2", 36],
  [/^requirements\.items\.\d\.k$/, (p) => `Требование ${n(p, 2)}: название`, 14],
  [/^requirements\.items\.\d\.v$/, (p) => `Требование ${n(p, 2)}: значение`, 70],
  [/^steps\.title$/, () => "Заголовок H2", 40],
  [/^steps\.items\.\d$/, (p) => `Шаг ${n(p, 2)}`, 26],
  [/^calculator\.title$/, () => "Заголовок H2", 56],
  [/^calculator\.text$/, () => "Подзаголовок", 90],
  [/^calculator\.q(\d)$/, (p) => `Вопрос ${p.slice(-1)}`, 48],
  [/^calculator\.resultPrefix$/, () => "Результат: «Ваш заработок в»", 20],
  [/^calculator\.resultSuffix$/, () => "Результат: «в месяц»", 12],
  [/^calculator\.note$/, () => "Сноска под суммой", 48],
  [/^calculator\.formTitle$/, () => "Форма: заголовок", 24],
  [/^calculator\.formText$/, () => "Форма: текст", 70],
  [/^calculator\.formButton$/, () => "Форма: кнопка", 22],
  [/^media\.title$/, () => "Заголовок H2", 24],
  [/^media\.youtube$/, () => "Текст", 100],
  [/^media\.watch$/, () => "Подпись к видео", 30],
  [/^whyUs\.title$/, () => "Заголовок H2", 20],
  [/^whyUs\.items\.\d\.title$/, (p) => `Карточка ${n(p, 2)}: заголовок`, 30],
  [/^whyUs\.items\.\d\.text$/, (p) => `Карточка ${n(p, 2)}: текст`, 100],
  [/^whyUs\.items\.\d\.num$/, (p) => `Карточка ${n(p, 2)}: крупная цифра`, 5],
  [/^whyUs\.items\.\d\.unit$/, (p) => `Карточка ${n(p, 2)}: подпись к цифре`, 12],
  [/^whyUs\.button$/, () => "Кнопка", 24],
  [/^seo\.title$/, () => "Заголовок H2", 40],
  [/^seo\.intro\.\d$/, (p) => `Абзац ${n(p, 2)}`, 400],
  [/^seo\.whyTitle$/, () => "Подзаголовок H3", 50],
  [/^seo\.whyLead$/, () => "Вводный абзац", 200],
  [/^seo\.why\.\d\.0$/, (p) => `Пункт ${n(p, 2)}: заголовок`, 40],
  [/^seo\.why\.\d\.1$/, (p) => `Пункт ${n(p, 2)}: текст`, 200],
  [/^seo\.whyOutro$/, () => "Итоговая плашка", 160],
  [/^seo\.fleetTitle$/, () => "Подзаголовок про автопарк", 50],
  [/^seo\.fleet\.\d$/, (p) => `Абзац про автопарк ${n(p, 2)}`, 500],
  [/^reviews\.title$/, () => "Заголовок H2", 24],
  [/^reviews\.more$/, () => "Кнопка «Показать ещё»", 20],
  [/^faq\.title$/, () => "Заголовок H2", 24],
  [/^faq\.items\.\d\.q$/, (p) => `Вопрос ${n(p, 2)}`, 80],
  [/^faq\.items\.\d\.a\.\d$/, (p) => `Ответ ${n(p, 2)}, абзац ${n(p, 4)}`, 500],
];
const HIDDEN_HOME = /^(benefits\.items\.\d\.icon|fleet\.eyebrow|benefits\.eyebrow|promo\.eyebrow|calculator\.eyebrow|calculator\.demo|media\.eyebrow|seo\.eyebrow|fleet\.(hint|drag|models))$/;

const rule = (rules: [RegExp, (p: string) => string, number][], p: string) => rules.find(([re]) => re.test(p));
const groupOf = (groups: [RegExp, string][], p: string, d: string) => groups.find(([re]) => re.test(p))?.[1] ?? d;

const human = (p: string) => p.split(".").map((x) => (/^\d+$/.test(x) ? `№${Number(x) + 1}` : x)).join(" · ");

const home: Bundle = {
  id: "home", langs: LANGS, base: (l) => BASE_HOME[l] ?? BASE_HOME.ru,
  group: (p) => groupOf(HOME_GROUPS, p, "Прочее"),
  label: (p) => rule(HOME_RULES, p)?.[1](p) ?? human(p),
  max: (p, longest) => rule(HOME_RULES, p)?.[2] ?? fallbackMax(longest),
  skip: (p) => HIDDEN_HOME.test(p),
};

const simple = (id: string, groupTitle: string, base: (l: Lang) => unknown, labels: Record<string, [string, number]>, langs: readonly Lang[] = LANGS): Bundle => ({
  id, langs, base,
  group: () => groupTitle,
  label: (p) => labels[p]?.[0] ?? human(p),
  max: (p, longest) => labels[p]?.[1] ?? fallbackMax(longest),
});

const fleetX = simple("fleet-x", "Автопарк: фильтр и кнопки", (l) => MORE[l] ?? MORE.ru, {
  all: ["Плитка «Смотреть весь автопарк»", 30], less: ["Кнопка «Свернуть»", 16], popular: ["Подсказка «Популярные модели…»", 50], popularShort: ["Фильтр «Популярные»", 14], allCls: ["Фильтр «Все»", 10], models: ["Слово «моделей»", 12],
});
const promoX = simple("promo-x", "Автопарк: промо-карточки", (l) => PROMO[l] ?? PROMO.ru, {
  orderTitle: ["«Под заказ»: заголовок", 40], orderText: ["«Под заказ»: текст", 80], orderBtn: ["«Под заказ»: кнопка", 16],
  "friendTitle.0": ["«Бонус»: заголовок, начало", 14], "friendTitle.1": ["«Бонус»: выделенное жёлтым", 12], "friendTitle.2": ["«Бонус»: заголовок, конец", 24],
  friendText: ["«Бонус»: текст", 70], friendNote: ["«Бонус»: сноска", 40], friendBtn: ["«Бонус»: кнопка", 22], copied: ["«Бонус»: «Ссылка скопирована»", 24], shareText: ["«Бонус»: текст при отправке ссылки", 100], upTo: ["«Бонус»: «до» перед суммой", 6],
});
const calcX = simple("calc-x", "Калькулятор: подписи", (l) => CALC_X[l] ?? CALC_X.ru, {
  net: ["«Вам на руки»", 24], rent: ["«Аренда авто»", 24], fuel: ["«Топливо…»", 30], fee: ["«Комиссия парка {n}%»", 30], fromPerDay: ["«от {price} ₽/сутки»", 24],
  day1: ["«день»", 8], day2: ["«дня»", 8], day5: ["«дней»", 8], perWeek: ["«в неделю»", 12], hour2: ["«часа»", 8], hour5: ["«часов»", 8], perDay: ["«в день»", 10],
  split: ["«Куда уходит выручка за месяц»", 40], disclaimer: ["Оговорка под результатом", 120],
});
const stepsX = simple("steps-x", "Дорога шагов: подписи", (l) => {
  const b = BUY_TEXT[l] ?? BUY_TEXT.ru, m = METER[l] ?? METER.ru;
  return { finish: FINALE[l] ?? FINALE.ru, buyTitle: b.title, buyExtra: [...b.extra], free: m.free, busy: m.busy };
}, {
  finish: ["Подпись у таксометра", 26], buyTitle: ["Выкуп: заголовок «за 5 шагов»", 50], "buyExtra.0": ["Выкуп: шаг 3", 26], "buyExtra.1": ["Выкуп: шаг 4", 26], free: ["Таксометр «Свободно»", 10], busy: ["Таксометр «В пути»", 10],
});
const ownersX = simple("owners-x", "Нам доверяют: окно истории", (l) => OWNERS_X[l] ?? OWNERS_X.ru, {
  title: ["Заголовок ({name} — имя)", 40], story: ["История ({name}, {car})", 300], cta: ["Кнопка", 40], close: ["«Закрыть»", 12], more: ["«Открыть историю»", 24],
});

// ── интерфейс ──
const UI_LABELS: Record<string, [string, number]> = {
  skip: ["«К содержанию» (для экранных дикторов)", 30], home: ["«Главная» в крошках", 16], menu: ["Кнопка «Меню»", 12], lead: ["Кнопка «Оставить заявку» в шапке", 20],
  call: ["Кнопка «Позвонить»", 14], request: ["Кнопка «Заявка»", 12], quick: ["«Быстрая связь»", 20],
  "nav.fleet": ["Меню: Автопарк", 14], "nav.vykup": ["Меню: Выкуп", 14], "nav.usloviya": ["Меню: Условия", 14], "nav.onas": ["Меню: О нас", 14], "nav.reviews": ["Меню: Отзывы", 14], "nav.contact": ["Меню: Контакты", 14], "nav.news": ["Меню: Статьи", 14],
  finalTitle: ["Блок заявки внизу страниц: заголовок", 50], finalText: ["Блок заявки внизу: текст", 200], finalButton: ["Блок заявки внизу: кнопка", 24], finalEyebrow: ["Блок заявки внизу: надзаголовок (скрыт)", 20],
};
const uiB: Bundle = {
  id: "ui", langs: LANGS, base: (l) => UI[l] ?? UI.ru,
  group: (p) => (p.startsWith("nav.") ? "Меню" : p.startsWith("footer.") ? "Подвал" : p.startsWith("cls.") ? "Названия классов" : /^final/.test(p) ? "Блок заявки внизу страниц" : "Кнопки и подписи"),
  label: (p) => UI_LABELS[p]?.[0] ?? (p.startsWith("footer.") ? `Подвал: ${p.slice(7)}` : p.startsWith("cls.") ? `Класс: ${p.slice(4)}` : human(p)),
  max: (p, longest) => UI_LABELS[p]?.[1] ?? fallbackMax(longest),
};

// ── контакты (не переводятся) ──
const COMPANY_LABELS: Record<string, [string, number]> = {
  name: ["Название", 30], legalName: ["Юрлицо", 60], domain: ["Сайт", 60], city: ["Город", 30], "phones.0": ["Телефон", 20], email: ["Почта", 60],
  fleet: ["Авто в парке", 8], renters: ["Водителей арендовали", 8], boughtOut: ["Выкупили авто", 8], messengerPhone: ["Телефон для мессенджеров", 20],
  telegram: ["Ссылка Telegram", 200], whatsapp: ["Ссылка WhatsApp", 200], max: ["Ссылка MAX", 200], youtube: ["Ссылка YouTube", 200], group: ["«Входит в группу…»", 60], privacyUrl: ["Политика конфиденциальности (ссылка)", 300],
};
const companyB: Bundle = { id: "company", langs: ["ru"], base: () => BASE_COMPANY, group: (p) => (/^(telegram|whatsapp|max|youtube|messengerPhone)$/.test(p) ? "Мессенджеры и соцсети" : /^(fleet|renters|boughtOut)$/.test(p) ? "Цифры" : "Компания"), label: (p) => COMPANY_LABELS[p]?.[0] ?? human(p), max: (p, l) => COMPANY_LABELS[p]?.[1] ?? fallbackMax(l) };
const officesB: Bundle = {
  id: "offices", langs: ["ru"], base: () => BASE_OFFICES, group: (p) => `Офис ${n(p, 0)}`,
  label: (p) => ({ name: "Название", address: "Адрес", metro: "Метро", hours: "Часы работы" } as Record<string, string>)[p.split(".")[1]] ?? human(p),
  max: (p) => ({ name: 40, address: 70, metro: 30, hours: 40 } as Record<string, number>)[p.split(".")[1]] ?? 60,
};

// ── форма заявки и cookie ──
const formB: Bundle = {
  id: "form", langs: LANGS, base: (l) => (leadFormI18n[l] ?? leadFormRu) as LeadFormText,
  group: (p) => (p.startsWith("errors.") ? "Ошибки" : p.startsWith("messengers.") ? "Мессенджеры" : /^done/.test(p) ? "После отправки" : "Поля и кнопки"),
  label: (p) => human(p), max: (_, l) => fallbackMax(l),
};
const cookieB: Bundle = { id: "cookie", langs: LANGS, base: (l) => cookieNoticeI18n[l] ?? cookieNoticeRu, group: () => "Баннер cookie", label: (p) => human(p), max: (_, l) => fallbackMax(l) };

const modalB: Bundle = {
  id: "modal", langs: LANGS, base: (l) => LEAD_MODAL[l] ?? LEAD_MODAL.ru, group: () => "Всплывающее окно заявки",
  label: (p) => ({ "rent.title": "Заголовок (аренда)", "rent.text": "Текст (аренда)", "buyout.title": "Заголовок (выкуп)", "buyout.text": "Текст (выкуп)", close: "Кнопка «Закрыть»", button: "Кнопка отправки" } as Record<string, string>)[p] ?? human(p),
  max: (p) => (p.endsWith(".title") ? 40 : p.endsWith(".text") ? 160 : 30),
};

export const SCREENS: Screen[] = [
  { id: "home", title: "Главная", sub: "Все тексты главной страницы по блокам", section: "pages", bundles: [home, fleetX, promoX, calcX, stepsX, ownersX], langs: LANGS },
  { id: "ui", title: "Интерфейс", sub: "Меню, подвал, кнопки и подписи на всех страницах", section: "settings", bundles: [uiB], langs: LANGS },
  { id: "contacts", title: "Контакты", sub: "Телефон, почта, мессенджеры, адреса и часы работы офисов", section: "settings", bundles: [companyB, officesB], langs: ["ru"] },
  { id: "form", title: "Форма заявки и cookie", sub: "Подписи полей, ошибки, сообщения и баннер cookie", section: "settings", bundles: [modalB, formB, cookieB], langs: LANGS },
];
export const screenOf = (id: string) => SCREENS.find((s) => s.id === id);
export const bundleOf = (id: string) => SCREENS.flatMap((s) => s.bundles).find((b) => b.id === id);

/** Все строковые поля набора: путь → исходный текст */
export function flat(o: unknown, p = "", out: [string, string][] = []): [string, string][] {
  if (typeof o === "string") out.push([p, o]);
  else if (Array.isArray(o)) o.forEach((v, i) => flat(v, p ? `${p}.${i}` : String(i), out));
  else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) if (typeof v !== "function") flat(v, p ? `${p}.${k}` : k, out);
  return out;
}

/** Поля набора с подписями и ограничениями. Ограничение не меньше, чем длина самого длинного исходного текста на любом языке. */
export function fieldsOf(b: Bundle): (Field & { def: Record<string, string> })[] {
  const per = new Map<string, Record<string, string>>();
  for (const l of b.langs) for (const [p, v] of flat(b.base(l))) (per.get(p) ?? per.set(p, {}).get(p)!)[l] = v;
  const out: (Field & { def: Record<string, string> })[] = [];
  for (const [p, def] of per) {
    if (b.skip?.(p)) continue;
    const longest = Math.max(...Object.values(def).map((v) => v.length));
    const max = Math.max(b.max(p, longest), longest);
    out.push({ bundle: b.id, path: p, label: b.label(p), group: b.group(p), max, multiline: max > 90 || Object.values(def).some((v) => v.includes("\n")), def });
  }
  return out;
}
