// Короткие подписи и значения, которые приходят из данных (автопарк, цены, характеристики) по-русски:
// «Детали», «Коробка: Автомат», «1,5 года», «1–2 дней», «1,5 л». На языковых версиях их переводим здесь,
// чтобы на /en, /ky, /kk, /uz не оставалось русских слов (замечание SEO-подрядчика 12.11.2026).
import type { Lang } from "./i18n";

type Dict = Record<string, string>;

const WORDS: Record<Exclude<Lang, "ru">, Dict> = {
  en: {
    "Яндекс Карты": "Yandex Maps", "Яндекс.Карты": "Yandex Maps",
    "Детали": "Details", "Класс": "Class", "Объем двигателя": "Engine size", "Объём двигателя": "Engine size", "Коробка": "Gearbox", "КПП": "Gearbox",
    "Привод": "Drive", "Год выпуска": "Model year", "Средний расход": "Average consumption", "Расход": "Consumption", "Мощность": "Power",
    "Грузоподъемность": "Payload", "Объем кузова": "Cargo volume", "Двигатель": "Engine",
    "Автомат": "Automatic", "Робот": "Robotic", "Механика": "Manual", "Вариатор": "CVT", "АКПП": "Automatic", "МКПП": "Manual",
    "Передний": "Front-wheel", "Задний": "Rear-wheel", "Полный": "All-wheel",
    "Цена аренды": "Rental price", "Условия выкупа": "Rent-to-own terms", "Цена": "Price", "Супер-скидка": "Super discount",
    "Эконом": "Economy", "Комфорт": "Comfort", "Комфорт+": "Comfort+", "Бизнес": "Business", "Грузовой": "Cargo", "Доставка": "Delivery",
    "Москвич 3": "Moskvich 3", "Москвич": "Moskvich",
  },
  ky: {
    "Яндекс Карты": "Яндекс Карталар", "Яндекс.Карты": "Яндекс Карталар",
    "Детали": "Маалыматтар", "Класс": "Класс", "Объем двигателя": "Кыймылдаткычтын көлөмү", "Объём двигателя": "Кыймылдаткычтын көлөмү", "Коробка": "Берүү кутусу", "КПП": "Берүү кутусу",
    "Привод": "Айдоо", "Год выпуска": "Чыгарылган жылы", "Средний расход": "Орточо чыгым", "Расход": "Чыгым", "Мощность": "Кубаттуулугу",
    "Грузоподъемность": "Жүк көтөрүмдүүлүгү", "Объем кузова": "Кузовдун көлөмү", "Двигатель": "Кыймылдаткыч",
    "Автомат": "Автомат", "Робот": "Робот", "Механика": "Механика", "Вариатор": "Вариатор", "АКПП": "Автомат", "МКПП": "Механика",
    "Передний": "Алдыңкы", "Задний": "Арткы", "Полный": "Толук",
    "Цена аренды": "Ижара баасы", "Условия выкупа": "Сатып алуу шарттары", "Цена": "Баасы", "Супер-скидка": "Супер арзандатуу",
    "Эконом": "Эконом", "Комфорт": "Комфорт", "Комфорт+": "Комфорт+", "Бизнес": "Бизнес", "Грузовой": "Жүк ташуучу", "Доставка": "Жеткирүү",
  },
  kk: {
    "Яндекс Карты": "Яндекс Карталар", "Яндекс.Карты": "Яндекс Карталар",
    "Детали": "Мәліметтер", "Класс": "Сынып", "Объем двигателя": "Қозғалтқыш көлемі", "Объём двигателя": "Қозғалтқыш көлемі", "Коробка": "Беріліс қорабы", "КПП": "Беріліс қорабы",
    "Привод": "Жетек", "Год выпуска": "Шығарылған жылы", "Средний расход": "Орташа шығын", "Расход": "Шығын", "Мощность": "Қуаты",
    "Грузоподъемность": "Жүк көтергіштігі", "Объем кузова": "Шанақ көлемі", "Двигатель": "Қозғалтқыш",
    "Автомат": "Автомат", "Робот": "Робот", "Механика": "Механика", "Вариатор": "Вариатор", "АКПП": "Автомат", "МКПП": "Механика",
    "Передний": "Алдыңғы", "Задний": "Артқы", "Полный": "Толық",
    "Цена аренды": "Жалға алу бағасы", "Условия выкупа": "Сатып алу шарттары", "Цена": "Бағасы", "Супер-скидка": "Супер жеңілдік",
    "Эконом": "Эконом", "Комфорт": "Комфорт", "Комфорт+": "Комфорт+", "Бизнес": "Бизнес", "Грузовой": "Жүк", "Доставка": "Жеткізу",
  },
  uz: {
    "Яндекс Карты": "Yandex Xaritalar", "Яндекс.Карты": "Yandex Xaritalar",
    "Детали": "Tafsilotlar", "Класс": "Sinf", "Объем двигателя": "Dvigatel hajmi", "Объём двигателя": "Dvigatel hajmi", "Коробка": "Uzatmalar qutisi", "КПП": "Uzatmalar qutisi",
    "Привод": "Yuritma", "Год выпуска": "Ishlab chiqarilgan yili", "Средний расход": "O‘rtacha sarf", "Расход": "Sarf", "Мощность": "Quvvati",
    "Грузоподъемность": "Yuk ko‘tarish qobiliyati", "Объем кузова": "Kuzov hajmi", "Двигатель": "Dvigatel",
    "Автомат": "Avtomat", "Робот": "Robot", "Механика": "Mexanika", "Вариатор": "Variator", "АКПП": "Avtomat", "МКПП": "Mexanika",
    "Передний": "Old", "Задний": "Orqa", "Полный": "To‘liq",
    "Цена аренды": "Ijara narxi", "Условия выкупа": "Sotib olish shartlari", "Цена": "Narxi", "Супер-скидка": "Super chegirma",
    "Эконом": "Ekonom", "Комфорт": "Komfort", "Комфорт+": "Komfort+", "Бизнес": "Biznes", "Грузовой": "Yuk tashish", "Доставка": "Yetkazib berish",
    "Москвич 3": "Moskvich 3", "Москвич": "Moskvich",
  },
};

// Сроки: «1 год», «1,5 года», «2 года», «3 года», «1–2 дней», «от 30 дней», «16–29 дней»
const TERM: Record<Exclude<Lang, "ru">, { y1: string; y: (n: string) => string; d: (n: string) => string; from: (n: string) => string; l: string }> = {
  en: { y1: "1 year", y: (n) => `${n.replace(",", ".")} years`, d: (n) => `${n} days`, from: (n) => `from ${n} days`, l: "L" },
  ky: { y1: "1 жыл", y: (n) => `${n} жыл`, d: (n) => `${n} күн`, from: (n) => `${n} күндөн`, l: "л" },
  kk: { y1: "1 жыл", y: (n) => `${n} жыл`, d: (n) => `${n} күн`, from: (n) => `${n} күннен бастап`, l: "л" },
  uz: { y1: "1 yil", y: (n) => `${n} yil`, d: (n) => `${n} kun`, from: (n) => `${n} kundan`, l: "l" },
};

/** Перевести короткую подпись/значение. Русский и незнакомые строки возвращаются как есть. */
export function loc(lang: Lang | string | undefined, s: string): string {
  if (!s || !lang || lang === "ru") return s;
  const L = lang as Exclude<Lang, "ru">;
  const dict = WORDS[L];
  const tm = TERM[L];
  if (!dict || !tm) return s;
  const t = s.trim();
  if (dict[t]) return dict[t];
  let out = s
    .replace(/(^|[^\d,])1 год(?![а-яё])/g, (_, a: string) => a + tm.y1)
    .replace(/(\d+(?:,\d+)?)\s*(?:года|лет)(?![а-яё])/g, (_, n: string) => tm.y(n))
    .replace(/от\s+(\d+)\s*(?:дней|дня|день)/g, (_, n: string) => tm.from(n))
    .replace(/(\d+(?:\s*[–-]\s*\d+)?)\s*(?:дней|дня|день)/g, (_, n: string) => tm.d(n))
    .replace(/(\d)\s*л(?=\s|$|\b|[^а-яё])/g, (_, d: string) => `${d} ${tm.l}`)
    .replace(/\s{2,}/g, " ");
  // отдельные слова из словаря внутри строки («1,5 л Turbo», «Автомат / Робот»)
  for (const [ru, tr] of Object.entries(dict)) if (ru.length > 3 && out.includes(ru)) out = out.split(ru).join(tr);
  return out;
}

// ── Адреса, метро и режим работы офисов ──────────────────────────────────────
const TR: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
/** Русские названия улиц и станций латиницей (для en и uz) */
export function translit(s: string): string {
  return s.replace(/[А-Яа-яЁё]/g, (ch) => {
    const lo = ch.toLowerCase();
    const t = TR[lo] ?? ch;
    return ch === lo ? t : t.charAt(0).toUpperCase() + t.slice(1);
  });
}

const DAYS: Record<Exclude<Lang, "ru">, Record<string, string>> = {
  en: { "пн-вс": "Mon–Sun", "пн-пт": "Mon–Fri", "пн-сб": "Mon–Sat" },
  ky: { "пн-вс": "Дш–Жк", "пн-пт": "Дш–Жм", "пн-сб": "Дш–Иш" },
  kk: { "пн-вс": "Дс–Жс", "пн-пт": "Дс–Жм", "пн-сб": "Дс–Сб" },
  uz: { "пн-вс": "Du–Ya", "пн-пт": "Du–Ju", "пн-сб": "Du–Sh" },
};
const HOURS: Record<Exclude<Lang, "ru">, (a: string, b: string) => string> = {
  en: (a, b) => `${a} to ${b}`,
  ky: (a, b) => `${a}дөн ${b}гө чейин`,
  kk: (a, b) => `${a}-ден ${b}-ге дейін`,
  uz: (a, b) => `${a} dan ${b} gacha`,
};
const ASK: Record<Exclude<Lang, "ru">, string> = {
  en: "please check opening hours by phone",
  ky: "иш убактысын телефон аркылуу тактаңыз",
  kk: "жұмыс уақытын телефон арқылы нақтылаңыз",
  uz: "ish vaqtini telefon orqali aniqlang",
};
const CITY: Record<Exclude<Lang, "ru">, string> = { en: "Moscow", ky: "Москва ш.", kk: "Мәскеу қ.", uz: "Moskva" };

/** Адрес, станция метро, режим работы или дни офиса — на язык страницы */
export function place(lang: Lang | string | undefined, s: string): string {
  if (!s || !lang || lang === "ru") return s;
  const L = lang as Exclude<Lang, "ru">;
  if (!HOURS[L]) return s;
  const t = s.trim();
  if (DAYS[L][t]) return DAYS[L][t];
  if (/уточняйте по телефону/i.test(t)) return ASK[L];
  let out = s
    .replace(/с\s+(\d{1,2}:\d{2})\s+до\s+(\d{1,2}:\d{2})/g, (_, a: string, b: string) => HOURS[L](a, b))
    .replace(/г\.\s*Москва/g, CITY[L])
    .replace(/МЦД-D3/g, L === "en" ? "MCD-D3" : L === "uz" ? "MCD-D3" : "МЦД-D3");
  // улицы и переулки: «ул. Удальцова, д. 36» → «Udaltsova St., 36», «1-й Митинский пер., д. 15, стр. 3» → «1st Mitinsky Lane, 15, bldg. 3»
  const W = {
    en: { st: (x: string) => `${x} St.`, lane: (n: string, x: string) => `${n}st ${x} Lane`, bldg: "bldg." },
    uz: { st: (x: string) => `${x} ko‘chasi`, lane: (n: string, x: string) => `${n}-${x} tor ko‘chasi`, bldg: "bino" },
    ky: { st: (x: string) => `${x} көчөсү`, lane: (n: string, x: string) => `${n}-${x} тар көчөсү`, bldg: "имарат" },
    kk: { st: (x: string) => `${x} көшесі`, lane: (n: string, x: string) => `${n}-${x} тұйық көшесі`, bldg: "ғимарат" },
  }[L];
  out = out
    .replace(/ул\.\s*([^,]+)/g, (_, x: string) => W.st(x.trim()))
    .replace(/(\d+)[-‑]й\s+([^,]+?)\s+(?:пер\.|переулок)/g, (_, n: string, x: string) => W.lane(n, x.trim()))
    .replace(/\bд\.\s*|(^|[\s,])д\.\s*/g, (m: string, a?: string) => a ?? "")
    .replace(/стр\.\s*(\d+)/g, (_, n: string) => `${W.bldg} ${n}`)
    .replace(/(\d+)с(\d+)/g, (_, a: string, b: string) => `${a}, ${W.bldg} ${b}`);
  if (L === "en" || L === "uz") out = translit(out);
  return out.replace(/\s{2,}/g, " ");
}

/** Юрлицо на языке страницы: «ООО «ЭЛИТ-КАР»» → LLC «ELIT-KAR» / «ЭЛИТ-КАР» ЖЧК / ЖШС */
export function legal(lang: Lang | string | undefined, s: string): string {
  const m = s.match(/^ООО\s*«(.+)»$/);
  if (!m || !lang || lang === "ru") return s;
  if (lang === "en") return `LLC «${translit(m[1])}»`;
  if (lang === "uz") return `«${translit(m[1])}» MChJ`;
  if (lang === "ky") return `«${m[1]}» ЖЧК`;
  if (lang === "kk") return `«${m[1]}» ЖШС`;
  return s;
}
