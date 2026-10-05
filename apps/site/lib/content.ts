// Контент главной до подключения админки.
// По PRD (раздел 4) все цифры и условия берутся из одного справочника в админке.
// Пока админки нет, они живут здесь и взяты с действующего car-city.pro (снято 2026-10-05).
// Что помечено DEMO — допущение для вёрстки, а не данные парка.

export const company = {
  name: "Car City",
  legalName: "ООО «ЭЛИТ-КАР»",
  domain: "https://car-city.pro",
  city: "Москва",
  phones: ["+7 (499) 302-31-59", "+7 (499) 474-76-47"],
  email: "support@car-city.pro",
  fleet: "1000+",
  renters: "4000+",
  boughtOut: "1400+",
  group: "Входит в группу Элит Кар",
  privacyUrl: "https://car-city.pro/themes/document/politika-konfedenczialnosti-kar-siti.pdf",
};

export const offices = [
  { name: "Проспект Вернадского", address: "ул. Удальцова, д. 36", metro: "Проспект Вернадского", hours: "с 9:00 до 21:00" },
  { name: "Митино", address: "1-й Митинский пер., д. 15, стр. 3", metro: "Митино", hours: "с 10:00 до 19:00" },
  { name: "Кунцевская", address: "ул. Витебская, д. 11", metro: "Кунцевская", hours: "с 10:00 до 19:00" },
];

export type CarClass = "ekonom" | "komfort" | "komfort-plus" | "biznes" | "gruzovoy" | "dostavka";

export const classes: { id: CarClass; name: string; note: string }[] = [
  { id: "ekonom", name: "Эконом", note: "Самый доступный старт в такси" },
  { id: "komfort", name: "Комфорт", note: "Кроссоверы и седаны под тариф «Комфорт»" },
  { id: "komfort-plus", name: "Комфорт+", note: "Выше чек, больше заказов в центре" },
  { id: "biznes", name: "Бизнес", note: "Премиальные седаны и минивэны" },
  { id: "gruzovoy", name: "Грузовой", note: "Фургоны под тариф «Грузовой»" },
  { id: "dostavka", name: "Доставка", note: "Под тариф «Доставка»" },
];

export interface Model {
  slug: string;
  name: string;
  cls: CarClass;
  engine: string;
  /** Аренда, ₽ в сутки, «от». Главная car-city.pro */
  rentFrom: number;
  /** Выкуп, ₽ в сутки, «от». car-city.pro/vykup */
  buyoutFrom?: number;
  /** Имя файла на car-city.pro/assets/components/phpthumbof/cache/ — источник фото */
  src: string;
}

// prettier-ignore
export const models: Model[] = [
  { slug: "skoda-rapid", name: "Skoda Rapid", cls: "ekonom", engine: "1.6 АКПП", rentFrom: 1500, buyoutFrom: 2089, src: "skoda-rapid-1.b595af2fc264eb695187af35ed92f08a.webP" },
  { slug: "kia-rio", name: "Kia Rio", cls: "ekonom", engine: "1.6 АКПП", rentFrom: 1900, buyoutFrom: 2089, src: "kia-rio-1.6-new.35a929b65d3c68686e9bf508d3b31825.webP" },
  { slug: "kia-rio-x-line", name: "Kia Rio X-Line", cls: "ekonom", engine: "1.4 АКПП", rentFrom: 1900, buyoutFrom: 2089, src: "kia-rio-x-line.35a929b65d3c68686e9bf508d3b31825.webP" },
  { slug: "volkswagen-polo", name: "Volkswagen Polo", cls: "ekonom", engine: "1.6 АКПП", rentFrom: 1900, buyoutFrom: 2150, src: "volkswagen-polo-1.6-min-1-.b595af2fc264eb695187af35ed92f08a.webP" },
  { slug: "moskvich-3", name: "Москвич 3", cls: "komfort", engine: "1.5 АКПП", rentFrom: 2000, buyoutFrom: 2000, src: "galery_1.4ed97933a441f71d34ec658ae61c46d2.webP" },
  { slug: "chery-tiggo-4-pro", name: "Chery Tiggo 4 Pro", cls: "komfort", engine: "1.5 АКПП", rentFrom: 2000, buyoutFrom: 1848, src: "galery_1.1f10554a7a159c40bc2095e910274595.webP" },
  { slug: "chery-tiggo-4", name: "Chery Tiggo 4", cls: "komfort", engine: "1.5 АКПП", rentFrom: 2000, buyoutFrom: 2022, src: "galery_1.0b7e9ad0e27884dfbfe2415a8cae4c43.webP" },
  { slug: "geely-emgrand", name: "Geely Emgrand", cls: "komfort", engine: "1.5 АКПП", rentFrom: 2000, buyoutFrom: 2290, src: "galery_1.f283fd76e86f617377a25dac7d55d9e6.webP" },
  { slug: "omoda-s5", name: "Omoda S5", cls: "komfort", engine: "1.5 АКПП", rentFrom: 2000, buyoutFrom: 2342, src: "galery_1.470d58934fe7dcc7c1ce0bec385f13c6.webP" },
  { slug: "belgee-x50", name: "Belgee X50", cls: "komfort", engine: "1.5 АКПП", rentFrom: 2400, buyoutFrom: 2813, src: "1779871454282-019e689a-8084-712a-9a88-52e0a0f26c2a.2011a68be1cf41027f5dfe4808290820.webP" },
  { slug: "chery-tiggo-7-pro", name: "Chery Tiggo 7 Pro", cls: "komfort-plus", engine: "1.5 АКПП", rentFrom: 2600, buyoutFrom: 2511, src: "chery-tiggo-7-pro-sajt.d8b2e6a8fec082c2f3f75da8a3eeb859.webP" },
  { slug: "exeed-lx", name: "Exeed LX 2023", cls: "komfort-plus", engine: "1.5 АКПП", rentFrom: 2600, buyoutFrom: 2836, src: "exeed-lx1.d8b2e6a8fec082c2f3f75da8a3eeb859.webP" },
  { slug: "haval-f7", name: "Haval F7", cls: "komfort-plus", engine: "1.6 АКПП", rentFrom: 2600, buyoutFrom: 2836, src: "havalf7.d8b2e6a8fec082c2f3f75da8a3eeb859.webP" },
  { slug: "geely-atlas-pro", name: "Geely Atlas Pro", cls: "komfort-plus", engine: "1.5 АКПП", rentFrom: 2600, buyoutFrom: 2900, src: "atlas-sajt.d8b2e6a8fec082c2f3f75da8a3eeb859.webP" },
  { slug: "jac-j7", name: "JAC J7", cls: "komfort-plus", engine: "1.5 АКПП", rentFrom: 2600, buyoutFrom: 2022, src: "jac-j7-sajt.d8b2e6a8fec082c2f3f75da8a3eeb859.webP" },
  { slug: "chery-tiggo-7-pro-max", name: "Chery Tiggo 7 Pro Max", cls: "komfort-plus", engine: "1.5 АКПП", rentFrom: 2600, buyoutFrom: 3315, src: "7-pro-max.d8b2e6a8fec082c2f3f75da8a3eeb859.webP" },
  { slug: "hyundai-sonata", name: "Hyundai Sonata", cls: "komfort-plus", engine: "АКПП", rentFrom: 2800, buyoutFrom: 3200, src: "sonata.d8b2e6a8fec082c2f3f75da8a3eeb859.webP" },
  { slug: "kia-k5", name: "Kia K5", cls: "komfort-plus", engine: "2.0 АКПП", rentFrom: 2800, buyoutFrom: 3420, src: "kiak5-1.d8b2e6a8fec082c2f3f75da8a3eeb859.webP" },
  { slug: "hongqi-h5", name: "Hongqi H5", cls: "biznes", engine: "АКПП", rentFrom: 5260, buyoutFrom: 5260, src: "ChatGPT-Image-20-avg.-2026-g.-12-20-40.98aa3db669bf25f45cb463d62fb8c53c.webP" },
  { slug: "gac-m8", name: "GAC M8", cls: "biznes", engine: "АКПП", rentFrom: 7635, buyoutFrom: 7635, src: "ChatGPT-Image-19-avg.-2026-g.-16-43-56.98aa3db669bf25f45cb463d62fb8c53c.webP" },
  { slug: "voyah-dream", name: "Voyah Dream", cls: "biznes", engine: "АКПП", rentFrom: 9041, buyoutFrom: 9041, src: "ChatGPT-Image-19-avg.-2026-g.-16-41-33.98aa3db669bf25f45cb463d62fb8c53c.webP" },
  { slug: "lada-largus", name: "Lada Largus", cls: "gruzovoy", engine: "Фургон", rentFrom: 2000, buyoutFrom: 2000, src: "Lad5a-Largus1.2011a68be1cf41027f5dfe4808290820.webP" },
  { slug: "sollers-atlant-19", name: "Sollers Atlant 1.9 TD", cls: "gruzovoy", engine: "Фургон", rentFrom: 2813, buyoutFrom: 2813, src: "sollersatlant19td.2011a68be1cf41027f5dfe4808290820.webP" },
  { slug: "sollers-argo", name: "Sollers Argo", cls: "gruzovoy", engine: "Фургон", rentFrom: 4000, buyoutFrom: 4000, src: "sollersargo1.2011a68be1cf41027f5dfe4808290820.webP" },
  { slug: "sollers-atlant-l3h2", name: "Sollers Atlant L3H2 2.7D", cls: "gruzovoy", engine: "Фургон", rentFrom: 4420, buyoutFrom: 4420, src: "ChatGPT-Image-2-sent.-2026-g.-16-17-36.2011a68be1cf41027f5dfe4808290820.webP" },
  { slug: "sollers-sf4", name: "Sollers SF4 L4", cls: "gruzovoy", engine: "Фургон", rentFrom: 5500, buyoutFrom: 5500, src: "ChatGPT-Image-12-avg.-2026-g.-12-35-04.2011a68be1cf41027f5dfe4808290820.webP" },
  { slug: "lada-granta", name: "Lada Granta", cls: "dostavka", engine: "АКПП", rentFrom: 1808, buyoutFrom: 1808, src: "ChatGPT-Image-11-avg.-2026-g.-16-33-51.98aa3db669bf25f45cb463d62fb8c53c.webP" },
];

export const minRent = (cls: CarClass) => Math.min(...models.filter((m) => m.cls === cls).map((m) => m.rentFrom));

/** car-city.pro/vykup */
export const buyout = {
  term: "от 1 года до 3 лет",
  perks: [
    "Можно закрыть договор досрочно",
    "Нет планов по заказам и накатам",
    "Работа с любым агрегатором",
    "Лицензия и путевые листы на весь срок",
    "Полис ОСАГО в подарок",
    "14 дней отпуска в год",
  ],
};

export const buyoutSteps = [
  { title: "Заявка", text: "Оставляете телефон, менеджер перезванивает и подбирает модель и срок выкупа." },
  { title: "Собеседование и договор", text: "Приезжаете в офис с документами, подписываете договор на срок от 1 года до 3 лет." },
  { title: "Платёж каждый день", text: "Платите из заработка. Долг допускается не больше трёх дней." },
  { title: "Машина ваша", text: "Вносите выкупной платёж в конце срока, и машина переоформляется на вас." },
];

/** Плюсы аренды, главная car-city.pro */
export const perks = [
  { k: "1-й день", v: "аренды бесплатно" },
  { k: "0 ₽", v: "залога на новые машины" },
  { k: "4%", v: "комиссия парка" },
  { k: "24/7", v: "поддержка водителей" },
];

/**
 * Калькулятор дохода. Аренда и комиссия — с сайта; выручка в час и топливо — DEMO-допущения,
 * в админке задаются ставки (PRD 4, калькулятор дохода).
 */
export const incomeAssumptions = {
  revenuePerHour: { ekonom: 900, komfort: 1100, "komfort-plus": 1300, biznes: 1900, gruzovoy: 1400, dostavka: 950 } as Record<CarClass, number>,
  parkCommission: 0.04,
  fuelPerHour: 220,
};

export const requirements = [
  "Возраст от 21 года",
  "Стаж вождения от 3 лет",
  "Паспорт и водительское удостоверение",
  "КИС «АРТ» и справка об отсутствии судимости",
  "Гражданство РФ, Беларуси, Кыргызстана, Казахстана, Южной Осетии или Абхазии",
];

export const terms = [
  { label: "Минимальный срок аренды", value: "30 дней" },
  { label: "Залог на новые машины", value: "нет" },
  { label: "Комиссия парка", value: "4%" },
  { label: "Первый день аренды", value: "бесплатно" },
  { label: "Приведи друга, аренда", value: "5 000 ₽" },
  { label: "Приведи друга, выкуп", value: "15 000 ₽" },
];

/** FAQ с главной car-city.pro, ответы сокращены без изменения смысла */
export const faq = [
  { q: "Какие требования к водителю?", a: "Возраст от 21 года, стаж от 3 лет. Документы: паспорт, водительское удостоверение, КИС «АРТ» и справка об отсутствии судимости. Гражданство РФ, Беларуси, Кыргызстана, Казахстана, Южной Осетии или Абхазии." },
  { q: "Дадут ли машину при негативных отзывах от других парков?", a: "Мы смотрим отзывы парков при проверке, но окончательное решение принимает менеджер по результатам личного собеседования." },
  { q: "Какая комиссия парка?", a: "4%. Это одно из самых лояльных предложений среди таксопарков." },
  { q: "Какой минимальный срок аренды?", a: "30 дней для любой машины." },
  { q: "Можно ли работать в другом парке?", a: "При обычной аренде нет. При выкупе ограничений по выбору агрегатора нет." },
  { q: "Есть ли бонусы для действующих водителей?", a: "Программа «Приведи друга»: 5 000 ₽ за друга в аренду и 15 000 ₽ за друга в выкуп." },
];
