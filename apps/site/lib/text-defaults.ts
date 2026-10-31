// Исходные тексты интерфейса, которые правятся в админке (Тексты). Лежат в обычном модуле, а не в
// клиентских компонентах: серверу (админке) нужны сами значения, а не ссылки на клиентский код.
import type { Lang } from "./i18n";
import type { LeadErrorCode, Messenger } from "./lead/types";
import { BASE_COMPANY as company } from "./content";

export interface LeadFormText {
  name: string;
  phone: string;
  messenger: string;
  messengers: Record<Messenger, string>;
  consentPrefix: string;
  consentLink: string;
  marketing: string;
  submit: string;
  sending: string;
  doneTitle: string;
  doneText: string;
  doneWrite: string;
  demoNote: string;
  errors: Record<LeadErrorCode | "network", string>;
}

export const leadFormRu: LeadFormText = {
  name: "Имя",
  phone: "Телефон",
  messenger: "Как удобнее связаться",
  messengers: { call: "Звонок", telegram: "Telegram", whatsapp: "WhatsApp", max: "MAX" },
  consentPrefix: "Даю согласие на",
  consentLink: "обработку персональных данных",
  marketing: "Согласен получать рекламные предложения и на передачу номера телефона рекламным сервисам",
  submit: "Перезвоните мне",
  sending: "Отправляем…",
  doneTitle: "Заявка принята",
  doneText: "Менеджер свяжется с вами в течение 1 минуты в рабочее время офиса.",
  doneWrite: "Или напишите нам сами:",
  demoNote: "Демо-версия сайта: заявка никуда не отправлена.",
  errors: {
    format: "Не получилось отправить, обновите страницу",
    name: "Проверьте имя: только буквы",
    phone: "Проверьте номер телефона",
    consent: "Нужно согласие на обработку персональных данных",
    too_fast: "Форма отправлена слишком быстро, попробуйте ещё раз",
    rate: "Слишком много заявок. Попробуйте позже или позвоните нам",
    captcha: "Не прошли проверку на робота, попробуйте ещё раз",
    captcha_required: "Нужна проверка на робота, попробуйте ещё раз",
    origin: "Не получилось отправить, обновите страницу",
    delivery: `Не получилось отправить заявку. Позвоните нам: ${company.phones[0]}`,
    network: "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз",
  },
};

export interface CookieNoticeText {
  title: string;
  text: string;
  policy: string;
  acceptAll: string;
  necessaryOnly: string;
  settings: string;
  save: string;
  necessary: string;
  necessaryNote: string;
  analytics: string;
  analyticsNote: string;
  marketing: string;
  marketingNote: string;
}

export const cookieNoticeRu: CookieNoticeText = {
  title: "Мы используем cookie",
  text: "Необходимые cookie нужны для работы сайта. Аналитику и рекламные cookie включим только с вашего согласия.",
  policy: "Политика обработки данных",
  acceptAll: "Принять все",
  necessaryOnly: "Только необходимые",
  settings: "Настроить",
  save: "Сохранить выбор",
  necessary: "Необходимые",
  necessaryNote: "Работа сайта и форм. Всегда включены.",
  analytics: "Аналитика",
  analyticsNote: "Яндекс Метрика с вебвизором: как пользуются сайтом.",
  marketing: "Маркетинг",
  marketingNote: "Показ нашей рекламы тем, кто уже был на сайте.",
};

export const MORE: Record<string, { all: string; less: string; popular: string; popularShort: string; allCls: string; models: string }> = {
  ru: { all: "Смотреть весь автопарк", less: "Свернуть", popular: "Популярные модели из каждого класса", popularShort: "Популярные", allCls: "Все", models: "моделей" },
  en: { all: "See the whole fleet", less: "Show less", popular: "Popular models from every class", popularShort: "Popular", allCls: "All", models: "models" },
};

export type PromoText = { orderTitle: string; orderText: string; orderBtn: string; friendTitle: [string, string, string]; friendText: string; friendNote: string; friendBtn: string; copied: string; shareText: string; upTo: string };

export const PROMO: Record<string, PromoText> = {
  ru: {
    orderTitle: "Не устраивает авто из наличия?", orderText: "Приобретём автомобиль на заказ под ваши пожелания", orderBtn: "Выкупить",
    friendTitle: ["Получай ", "бонус", " за каждого друга"], friendText: "Количество выплат на одного человека не ограничено", friendNote: "*действует на аренду и выкуп",
    friendBtn: "Поделиться ссылкой", copied: "Ссылка скопирована", shareText: "Car City — аренда и выкуп авто для такси в Москве", upTo: "до",
  },
  en: {
    orderTitle: "Nothing suitable in stock?", orderText: "We will buy a car to order for your needs", orderBtn: "Buy out",
    friendTitle: ["Get a ", "bonus", " for every friend"], friendText: "No limit on the number of payouts per person", friendNote: "*valid for rental and rent-to-own",
    friendBtn: "Share the link", copied: "Link copied", shareText: "Car City — taxi car rental and rent-to-own in Moscow", upTo: "up to",
  },
};

export const CALC_X: Record<string, { net: string; rent: string; fuel: string; fee: string; fromPerDay: string; day1: string; day2: string; day5: string; perWeek: string; hour2: string; hour5: string; perDay: string; split: string; disclaimer: string }> = {
  ru: {
    net: "Вам на руки", rent: "Аренда авто", fuel: "Топливо (350 км в смену)", fee: "Комиссия парка {n}%", fromPerDay: "от {price} ₽/сутки",
    day1: "день", day2: "дня", day5: "дней", perWeek: "в неделю", hour2: "часа", hour5: "часов", perDay: "в день",
    split: "Куда уходит выручка за месяц", disclaimer: "Расчёт ориентировочный: реальный заработок зависит от спроса и вашего графика.",
  },
  en: {
    net: "Your take-home", rent: "Car rental", fuel: "Fuel (350 km per shift)", fee: "Fleet commission {n}%", fromPerDay: "from {price} ₽/day",
    day1: "day", day2: "days", day5: "days", perWeek: "a week", hour2: "hours", hour5: "hours", perDay: "a day",
    split: "Where the monthly revenue goes", disclaimer: "An estimate: real earnings depend on demand and your schedule.",
  },
};

export const FINALE: Record<string, string> = {
  ru: "Отправляйтесь в путь",
  en: "Hit the road",
  ky: "Жолго чыгыңыз",
  kk: "Жолға шығыңыз",
  uz: "Yo‘lga chiqing",
};

export const BUY_TEXT: Record<string, { title: string; extra: [string, string] }> = {
  ru: { title: "Как получить авто под выкуп за 5 шагов?", extra: ["Выбираете автомобиль", "Вносите первый взнос"] },
  en: { title: "How to get a car on rent-to-own in 5 steps?", extra: ["Choose a car", "Pay the first instalment"] },
  ky: { title: "Сатып алуу менен унааны 5 кадамда кантип алса болот?", extra: ["Унааны тандайсыз", "Биринчи төлөмдү төлөйсүз"] },
  kk: { title: "Сатып алумен көлікті 5 қадамда қалай алуға болады?", extra: ["Көлікті таңдайсыз", "Алғашқы жарнаны төлейсіз"] },
  uz: { title: "Sotib olish bilan avtomobilni 5 qadamda qanday olish mumkin?", extra: ["Avtomobilni tanlaysiz", "Birinchi to‘lovni qilasiz"] },
};

export const METER: Record<string, { free: string; busy: string }> = {
  ru: { free: "Свободно", busy: "В пути" },
  en: { free: "Free", busy: "On trip" },
  ky: { free: "Бош", busy: "Жолдо" },
  kk: { free: "Бос", busy: "Жолда" },
  uz: { free: "Bo‘sh", busy: "Yo‘lda" },
};

export const OWNERS_X: Record<Lang, { title: string; story: string; cta: string; close: string; more: string }> = {
  ru: {
    title: "{name} выкупил(а) авто",
    story: "{name} уже выкупил у нас {car}. Как и у каждого нашего клиента, на машину был отдельный договор выкупа, а в работе — отпуск 14 дней в год, комиссия парка 3% и возможность работать в любом парке.",
    cta: "Хочу так же — выкупить авто",
    close: "Закрыть",
    more: "Открыть историю",
  },
  en: {
    title: "{name} bought a car",
    story: "{name} has already bought a {car} from us. Like every client, there was a separate buyout contract for the car, 14 days of vacation a year, a 3% fleet fee and the freedom to work in any fleet.",
    cta: "I want the same — buy a car",
    close: "Close",
    more: "Open story",
  },
  ky: {
    title: "{name} унааны сатып алды",
    story: "{name} бизден {car} унаасын сатып алды. Ар бир кардарыбыздай, унаага өзүнчө келишим түзүлдү, жылына 14 күн эс алуу жана парктын 3% комиссиясы бар.",
    cta: "Мен да ушундай — унаа сатып алгым келет",
    close: "Жабуу",
    more: "Окуяны ачуу",
  },
  kk: {
    title: "{name} көлікті сатып алды",
    story: "{name} бізден {car} көлігін сатып алды. Әр клиентіміз сияқты, көлікке жеке келісімшарт жасалды, жылына 14 күн демалыс және парктің 3% комиссиясы бар.",
    cta: "Мен де осылай — көлік сатып алғым келеді",
    close: "Жабу",
    more: "Әңгімені ашу",
  },
  uz: {
    title: "{name} avtomobil sotib oldi",
    story: "{name} bizdan {car} avtomobilini sotib oldi. Har bir mijozimiz kabi, mashinaga alohida shartnoma tuzildi, yiliga 14 kun ta’til va parkning 3% komissiyasi bor.",
    cta: "Men ham shunday — avtomobil sotib olmoqchiman",
    close: "Yopish",
    more: "Hikoyani ochish",
  },
};

export type LeadModalKind = "rent" | "buyout";
/** Всплывающая форма заявки (components/LeadModal) */
export const LEAD_MODAL: Record<Lang, Record<LeadModalKind, { title: string; text: string }> & { close: string; button: string }> = {
  ru: {
    rent: { title: "Заявка на аренду", text: "Оставьте телефон: менеджер перезвонит за минуту, подберёт машину и расскажет условия." },
    buyout: { title: "Заявка на выкуп", text: "Оставьте телефон: менеджер расскажет про выкуп, взнос и подберёт автомобиль." },
    close: "Закрыть",
    button: "Перезвоните мне",
  },
  en: {
    rent: { title: "Rental request", text: "Leave your phone: a manager will call back within a minute, pick a car and explain the terms." },
    buyout: { title: "Buyout request", text: "Leave your phone: a manager will explain the buyout, the first payment and help choose a car." },
    close: "Close",
    button: "Call me back",
  },
  ky: {
    rent: { title: "Ижарага өтүнмө", text: "Телефонуңузду калтырыңыз: менеджер бир мүнөттө чалып, унаа тандап, шарттарды түшүндүрөт." },
    buyout: { title: "Сатып алууга өтүнмө", text: "Телефонуңузду калтырыңыз: менеджер сатып алуу, баштапкы төлөм жөнүндө айтып, унаа тандайт." },
    close: "Жабуу",
    button: "Мага чалыңыз",
  },
  kk: {
    rent: { title: "Жалға алу өтінімі", text: "Телефоныңызды қалдырыңыз: менеджер бір минутта қоңырау шалып, көлік таңдап, шарттарды түсіндіреді." },
    buyout: { title: "Сатып алу өтінімі", text: "Телефоныңызды қалдырыңыз: менеджер сатып алу, алғашқы жарна туралы айтып, көлік таңдайды." },
    close: "Жабу",
    button: "Маған қоңырау шалыңыз",
  },
  uz: {
    rent: { title: "Ijara uchun ariza", text: "Telefon raqamingizni qoldiring: menejer bir daqiqada qo‘ng‘iroq qilib, mashina tanlaydi va shartlarni tushuntiradi." },
    buyout: { title: "Sotib olish uchun ariza", text: "Telefon raqamingizni qoldiring: menejer sotib olish, boshlang‘ich to‘lov haqida aytib, mashina tanlaydi." },
    close: "Yopish",
    button: "Menga qo‘ng‘iroq qiling",
  },
};
