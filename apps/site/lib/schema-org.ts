// Микроразметка Schema.org (JSON-LD), правки 12.11.2026: на старом car-city.pro были Organization, LocalBusiness,
// WPHeader, WPFooter, SiteNavigationElement, ImageObject и FAQPage — переносим тот же набор и добавляем
// разметку карточек машин (Car + Offer с ценой за сутки) и списков машин на страницах классов.
import { company, offices } from "./content";
import { href, type Lang } from "./i18n";
import type { FleetCar } from "./fleet";
import { rentRows, buyRows } from "./prices";
import { carImages } from "./car-images";
import { carInteriors } from "./car-interiors";
import { photoOpts } from "./car-photo-opts";

const ORIGIN = "https://car-city.pro";
export const ORG_ID = `${ORIGIN}/#org`;
export const SITE_ID = `${ORIGIN}/#website`;
export const BIZ_ID = `${ORIGIN}/#business`;

const abs = (p: string) => (p.startsWith("http") ? p : ORIGIN + p);
const pageUrl = (path: string, lang: Lang) => abs(href(path, lang) || "/");
const ld = (o: object) => JSON.stringify(o).replace(/</g, "\\u003c");

/** Соцсети и мессенджеры компании — sameAs у организации */
function sameAs(): string[] {
  const c = company as unknown as Record<string, string>;
  return ["youtube", "telegram", "whatsapp", "max", "vk"].map((k) => c[k]).filter((v): v is string => typeof v === "string" && v.startsWith("http"));
}

/** Организация и сайт — на каждой странице (в общем шаблоне) */
export function siteLd(): string {
  return ld({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: company.name,
        legalName: company.legalName,
        url: ORIGIN,
        logo: { "@type": "ImageObject", url: abs("/brand/emblem-192.png"), width: 192, height: 192 },
        email: company.email,
        telephone: company.phones[0],
        foundingDate: "2017",
        sameAs: sameAs(),
        contactPoint: company.phones.map((p) => ({ "@type": "ContactPoint", telephone: p, contactType: "customer service", areaServed: "RU", availableLanguage: ["ru", "en", "ky", "kk", "uz"] })),
        address: { "@type": "PostalAddress", addressLocality: "Москва", addressCountry: "RU", streetAddress: offices[0]?.address },
      },
      { "@type": "WebSite", "@id": SITE_ID, url: ORIGIN, name: company.name, inLanguage: ["ru", "en", "ky", "kk", "uz"], publisher: { "@id": ORG_ID } },
    ],
  });
}

/** Шапка: WPHeader + меню (SiteNavigationElement) */
export function headerLd(nav: { href: string; label: string }[], lang: Lang): string {
  return ld({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WPHeader", name: `${company.name} — шапка сайта`, url: pageUrl("/", lang) },
      { "@type": "SiteNavigationElement", name: nav.map((n) => n.label), url: nav.map((n) => pageUrl(n.href, lang)) },
    ],
  });
}

/** Подвал: WPFooter + ссылки подвала */
export function footerLd(links: [string, string][], lang: Lang): string {
  return ld({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WPFooter", copyrightHolder: { "@id": ORG_ID }, copyrightYear: new Date().getFullYear(), name: `${company.name} — подвал сайта` },
      { "@type": "SiteNavigationElement", name: links.map(([l]) => l), url: links.map(([, h]) => pageUrl(h, lang)) },
    ],
  });
}

/** Прокат (LocalBusiness → AutoRental) с офисами — на главной и в контактах */
export function businessLd(lang: Lang): string {
  const offs = offices;
  return ld({
    "@context": "https://schema.org",
    "@type": "AutoRental",
    "@id": BIZ_ID,
    name: company.name,
    legalName: company.legalName,
    url: pageUrl("/", lang),
    image: abs("/brand/emblem-192.png"),
    logo: abs("/brand/emblem-192.png"),
    email: company.email,
    telephone: company.phones,
    priceRange: "от 1500 ₽ в сутки",
    currenciesAccepted: "RUB",
    areaServed: { "@type": "City", name: "Москва" },
    parentOrganization: { "@id": ORG_ID },
    sameAs: sameAs(),
    aggregateRating: { "@type": "AggregateRating", ratingValue: "5.0", bestRating: "5", ratingCount: "4" },
    address: offs.map((o) => ({ "@type": "PostalAddress", addressLocality: "Москва", streetAddress: o.address, addressCountry: "RU" })),
    department: offs.map((o) => ({
      "@type": "AutoRental",
      name: `${company.name} — ${o.name}`,
      telephone: company.phones[0],
      address: { "@type": "PostalAddress", addressLocality: "Москва", streetAddress: o.address, addressCountry: "RU" },
      description: [o.metro && `м. ${o.metro}`, o.hours].filter(Boolean).join(", "),
    })),
  });
}

const SHOT_NAMES: Record<string, string> = { front: "вид спереди", rear: "вид сзади", side: "вид сбоку", interior: "салон" };
/** Фото машины на этом сайте: кадр каталога и ракурсы галереи (адреса старого сайта после переезда не работают — их не берём) */
function carPhotos(car: FleetCar, name: string): object[] {
  if (!carImages[car.slug]) return [];
  const m = carImages[car.slug];
  const opt = photoOpts(car.slug);
  const shots = opt.shots ?? (["front", "rear", "side", ...(carInteriors.has(car.slug) ? ["interior"] : [])] as string[]);
  return [
    { "@type": "ImageObject", contentUrl: abs(`/cars/${car.slug}-1200.webp`), url: abs(`/cars/${car.slug}-1200.webp`), width: m.w, height: m.h, name, caption: name, representativeOfPage: true },
    ...shots.map((k) => ({ "@type": "ImageObject", contentUrl: abs(`/cars/${car.slug}-${k}-1000.webp`), url: abs(`/cars/${car.slug}-${k}-1000.webp`), name: `${name} — ${SHOT_NAMES[k]}`, caption: `${name} — ${SHOT_NAMES[k]}` })),
  ];
}

const brandOf = (name: string) => name.split(/\s+/)[0];

/** Предложения машины: аренда и выкуп по графикам, цена за сутки */
function offers(car: FleetCar, mode: "rent" | "buy" | "both", lang: Lang, url: string): object[] {
  const out: object[] = [];
  const add = (rows: { k: string; p: number }[], what: string) => {
    for (const r of rows) {
      out.push({
        "@type": "Offer",
        name: `${what} ${car.name}: ${r.k}`,
        url,
        priceCurrency: "RUB",
        price: r.p,
        availability: "https://schema.org/InStock",
        businessFunction: what === "Аренда" ? "http://purl.org/goodrelations/v1#LeaseOut" : "http://purl.org/goodrelations/v1#Sell",
        priceSpecification: { "@type": "UnitPriceSpecification", price: r.p, priceCurrency: "RUB", unitCode: "DAY", unitText: "сутки", referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "DAY" } },
        seller: { "@id": ORG_ID },
      });
    }
  };
  if (mode !== "buy") add(rentRows(car), "Аренда");
  if (mode !== "rent") add(buyRows(car), "Выкуп");
  void lang;
  return out;
}

/** Карточка машины: Car (вид Product) с фото, характеристиками и ценами */
export function carLd(car: FleetCar, opts: { name: string; description?: string; path: string; lang: Lang; mode?: string }): string {
  const url = pageUrl(opts.path, opts.lang);
  const mode = opts.mode === "vykup" ? "buy" : "rent";
  const offs = offers(car, mode, opts.lang, url);
  const prices = offs.map((o) => (o as { price: number }).price);
  const images = carPhotos(car, opts.name);
  return ld({
    "@context": "https://schema.org",
    "@type": ["Product", "Car"],
    "@id": `${url}#car`,
    name: opts.name,
    description: opts.description,
    url,
    brand: { "@type": "Brand", name: brandOf(car.name) },
    model: car.name,
    category: { ekonom: "Эконом", komfort: "Комфорт", "komfort-plus": "Комфорт+", biznes: "Бизнес", gruzovoy: "Грузовой", dostavka: "Доставка" }[car.cls],
    ...(images.length ? { image: images } : {}),
    ...(car.engine ? { vehicleEngine: { "@type": "EngineSpecification", name: car.engine } } : {}),
    ...(car.gearbox ? { vehicleTransmission: car.gearbox } : {}),
    ...(offs.length
      ? { offers: { "@type": "AggregateOffer", priceCurrency: "RUB", lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: offs.length, offers: offs } }
      : {}),
  });
}

/** Список машин на странице класса / выкупа */
export function carListLd(cars: { car: FleetCar; name: string; href: string }[], lang: Lang, title: string): string {
  return ld({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    numberOfItems: cars.length,
    itemListElement: cars.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: abs(href(c.href, lang)),
      name: c.name,
      ...(carImages[c.car.slug] ? { image: abs(`/cars/${c.car.slug}-1200.webp`) } : {}),
    })),
  });
}
