// Все тексты главной в одном объекте, чтобы переводить её целиком (lib/home-i18n/<язык>.ts).
// Русские тексты — дословно с car-city.pro (lib/home.ts), подписи блоков — нового дизайна.
import * as h from "./home";
import type { Lang } from "./i18n";
import { en } from "./home-i18n/en";
import { ky } from "./home-i18n/ky";
import { kk } from "./home-i18n/kk";
import { uz } from "./home-i18n/uz";

export const ruHome = {
  hero: {
    eyebrow: "Таксопарк в Москве · 1000+ авто",
    lines: ["Аренда авто", "для работы в такси", "с выкупом в Москве"],
    sub: "Начни зарабатывать уже сегодня от 170\u00a0000\u00a0рублей",
    bullets: h.heroBullets as readonly string[],
    book: "Забронировать авто",
    pick: "Подобрать автомобиль",
    stats: [
      { k: "Авто в парке", v: "1000+" },
      { k: "Водителей", v: "4000+" },
      { k: "Выкупили авто", v: "1400+" },
      { k: "Комиссия", v: "4%" },
    ],
    scroll: "Листайте вниз",
  },
  ticker: ["Первый день бесплатно", "Без залога и депозита", "Машина в день заявки", "Поддержка 24/7", "Выкуп от 1 года", "Комиссия 4%"],
  fleet: {
    eyebrow: "Автопарк",
    models: "моделей",
    title: "Подобрать автомобиль",
    classLabel: "Класс автомобиля",
    classes: { ekonom: "Эконом", komfort: "Комфорт", "komfort-plus": "Комфорт+", biznes: "Бизнес", gruzovoy: "Грузовой", dostavka: "Доставка" } as Record<string, string>,
    engine: "Объем двигателя",
    gearbox: "Коробка",
    auto: "Автомат",
    from: "от",
    perDay: "/сутки",
    rent: "Арендовать",
    buy: "Выкупить",
    hint: "Наведите на машину — включим фары",
    drag: "Листайте",
  },
  benefits: { eyebrow: "Преимущества", title: "Почему с нами выгодно?", items: h.benefits.map((b) => ({ icon: b.icon as string, text: b.text as string })) },
  trust: { title: h.trust.title, stats: h.trust.stats.map((s) => ({ ...s })), owners: h.trust.owners.map((o) => ({ ...o })), ctaTitle: h.trust.cta.title, ctaText: h.trust.cta.text },
  promo: { eyebrow: "Подарок", title: h.promo.title, text: h.promo.text, button: h.promo.button },
  requirements: { title: h.requirementsBlock.title, items: h.requirementsBlock.items.map((r) => ({ ...r })) },
  steps: { title: h.steps.title, items: [...h.steps.items] as string[] },
  calculator: {
    ...h.calculator,
    eyebrow: "Калькулятор дохода",
    demo: "Выручка в час и расход на топливо — предварительные ставки, точные зададут в админке.",
  },
  media: { eyebrow: "или", title: "Напишите нам", youtube: h.youtube.text, watch: "Смотреть видео Car City" },
  whyUs: { title: h.whyUs.title, items: h.whyUs.items.map((i) => ({ ...i })), button: h.whyUs.button },
  seo: {
    eyebrow: "О таксопарке",
    title: "Аренда авто под такси в Москве",
    intro: [...h.seo.intro] as string[],
    whyTitle: h.seo.whyTitle,
    whyLead: h.seo.whyLead,
    why: h.seo.why.map(([a, b]) => [a, b] as [string, string]),
    whyOutro: h.seo.whyOutro,
    fleetTitle: h.seo.fleetTitle,
    fleet: [...h.seo.fleet] as string[],
  },
  reviews: { title: "Отзывы", more: "Показать еще", on: "на", label: "Отзывы водителей", stars: "5 из 5" },
  faq: { title: "Частые вопросы", items: h.faqHome.map((f) => ({ q: f.q, a: [...f.a] })) },
};

export type HomeText = typeof ruHome;

const BY_LANG: Record<Lang, HomeText | null> = { ru: ruHome, en, ky, kk, uz };
export const homeText = (lang: Lang): HomeText => BY_LANG[lang] ?? ruHome;
