// Автопарк с главной car-city.pro: порядок, цены «от … ₽/сутки», ссылки и фото — как на сайте (2026-10-05).
// rent/buy — исходные адреса страниц, сохраняем их один в один ради SEO.
import type { CarClass } from "./content";

export interface FleetCar {
  slug: string;
  name: string;
  cls: CarClass;
  price: number;
  engine?: string;
  gearbox?: string;
  rent?: string;
  buy?: string;
  /** файл в car-city.pro/assets/components/phpthumbof/cache/ */
  img: string;
  badge?: string;
}

// prettier-ignore
export const fleet: FleetCar[] = [
  {"slug": "moskvich-3", "name": "Москвич 3", "cls": "komfort", "price": 2000, "engine": "1,5 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/komfort/moskvich-3", "buy": "/vykup/komfort/moskvich-3", "img": "galery_1.4ed97933a441f71d34ec658ae61c46d2.webP", "badge": "Супер-скидка"},
  {"slug": "belgee-x50", "name": "Belgee X50", "cls": "komfort", "price": 2400, "engine": "1,5 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/komfort/Belgee-X50", "buy": "/vykup/komfort/Belgee-X50", "img": "1779871454282-019e689a-8084-712a-9a88-52e0a0f26c2a.2011a68be1cf41027f5dfe4808290820.webP"},
  {"slug": "geely-emgrand", "name": "Geely Emgrand", "cls": "komfort", "price": 2000, "engine": "1,5 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/komfort/geely-emgrand", "buy": "/vykup/komfort/geely-emgrand", "img": "galery_1.f283fd76e86f617377a25dac7d55d9e6.webP"},
  {"slug": "chery-tiggo-4-pro", "name": "Chery Tiggo 4 Pro", "cls": "komfort", "price": 2000, "engine": "1.5 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/komfort/chery-tiggo-4-pro", "buy": "/vykup/komfort/chery-tiggo-4-pro", "img": "galery_1.1f10554a7a159c40bc2095e910274595.webP"},
  {"slug": "omoda-s-5", "name": "Omoda S5", "cls": "komfort", "price": 2000, "engine": "1.5 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/komfort/omoda-s-5", "buy": "/vykup/komfort/omoda-s-5", "img": "galery_1.470d58934fe7dcc7c1ce0bec385f13c6.webP"},
  {"slug": "chery-tiggo-4", "name": "Chery Tiggo 4", "cls": "komfort", "price": 2000, "engine": "1.5 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/komfort/chery-tiggo-4", "buy": "/vykup/komfort/chery-tiggo-4", "img": "galery_1.0b7e9ad0e27884dfbfe2415a8cae4c43.webP"},
  {"slug": "exeed-lx-2023", "name": "Exeed LX 2023", "cls": "komfort-plus", "price": 2600, "engine": "1,5 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/komfort-plyus/exeed-lx-2023", "buy": "/vykup/komfort-plyus/exeed-lx-2023", "img": "exeed-lx1.d8b2e6a8fec082c2f3f75da8a3eeb859.webP", "badge": "Супер-скидка"},
  {"slug": "jac-j7", "name": "Jac J7", "cls": "komfort-plus", "price": 2600, "engine": "1.5 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/komfort-plyus/jac-j7", "buy": "/vykup/komfort-plyus/jac-j7", "img": "jac-j7-sajt.d8b2e6a8fec082c2f3f75da8a3eeb859.webP"},
  {"slug": "haval-f7", "name": "Haval F7", "cls": "komfort-plus", "price": 2600, "engine": "1,6 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/komfort-plyus/haval-f7", "buy": "/vykup/komfort-plyus/haval-f7", "img": "havalf7.d8b2e6a8fec082c2f3f75da8a3eeb859.webP"},
  {"slug": "chery-tiggo-7-pro-max", "name": "Chery Tiggo 7 PRO Max", "cls": "komfort-plus", "price": 2600, "engine": "1,5 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/komfort-plyus/chery-tiggo-7-pro-max", "buy": "/vykup/komfort-plyus/chery-tiggo-7-pro-max", "img": "7-pro-max.d8b2e6a8fec082c2f3f75da8a3eeb859.webP"},
  {"slug": "hyundai-sonata", "name": "Hyundai Sonata", "cls": "komfort-plus", "price": 2800, "engine": "1,6-3,3 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/komfort-plyus/hyundai-sonata", "buy": "/vykup/komfort-plyus/hyundai-sonata", "img": "sonata.d8b2e6a8fec082c2f3f75da8a3eeb859.webP"},
  {"slug": "kia-k5", "name": "Kia K5", "cls": "komfort-plus", "price": 2800, "engine": "2 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/komfort-plyus/kia-k5", "buy": "/vykup/komfort-plyus/kia-k5", "img": "kiak5-1.d8b2e6a8fec082c2f3f75da8a3eeb859.webP"},
  {"slug": "geely-atlas-pro", "name": "Geely Atlas PRO", "cls": "komfort-plus", "price": 2600, "engine": "1,5 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/komfort-plyus/geely-atlas-pro", "buy": "/vykup/komfort-plyus/geely-atlas-pro", "img": "atlas-sajt.d8b2e6a8fec082c2f3f75da8a3eeb859.webP"},
  {"slug": "chery-tiggo-7-pro", "name": "Chery Tiggo 7 PRO", "cls": "komfort-plus", "price": 2600, "engine": "1,5 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/komfort-plyus/chery-tiggo-7-pro", "buy": "/vykup/komfort-plyus/chery-tiggo-7-pro", "img": "chery-tiggo-7-pro-sajt-%281%29.d8b2e6a8fec082c2f3f75da8a3eeb859.webP"},
  {"slug": "volkswagen-polo-1.6", "name": "Volkswagen Polo", "cls": "ekonom", "price": 1900, "engine": "1,6 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/ekonom/volkswagen-polo-1.6", "buy": "/vykup/ekonom/volkswagen-polo-1.6", "img": "volkswagen-polo-1.6-min-1-.b595af2fc264eb695187af35ed92f08a.webP"},
  {"slug": "kia-rio-1.4", "name": "Kia Rio X-Line", "cls": "ekonom", "price": 1900, "engine": "1,4 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/ekonom/kia-rio-1.4", "buy": "/vykup/ekonom/kia-rio-1.4", "img": "kia-rio-x-line.35a929b65d3c68686e9bf508d3b31825.webP"},
  {"slug": "kia-rio-1.6", "name": "Kia Rio", "cls": "ekonom", "price": 1900, "engine": "1,6 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/ekonom/kia-rio-1.6", "buy": "/vykup/ekonom/kia-rio-1.6", "img": "kia-rio-1.6-new.35a929b65d3c68686e9bf508d3b31825.webP"},
  {"slug": "skoda-rapid-1.6", "name": "Skoda Rapid", "cls": "ekonom", "price": 1500, "engine": "1,6 л", "gearbox": "Автомат", "rent": "/klassyi-avtomobilej/ekonom/skoda-rapid-1.6", "buy": "/vykup/ekonom/skoda-rapid-1.6", "img": "skoda-rapid-1.b595af2fc264eb695187af35ed92f08a.webP"},
  {"slug": "hongqi-h5", "name": "Hongqi H5", "cls": "biznes", "price": 5260, "engine": "1,6-3,3 л", "gearbox": "Автомат", "rent": "/vykup/biznes/Hongqi-H5", "buy": "/vykup/biznes/Hongqi-H5", "img": "ChatGPT-Image-20-avg.-2026-g.%2C-12-20-40.98aa3db669bf25f45cb463d62fb8c53c.webP"},
  {"slug": "voyah-dream", "name": "Voyah Dream", "cls": "biznes", "price": 9041, "engine": "1,6-3,3 л", "gearbox": "Автомат", "rent": "/vykup/biznes/Voyah-Dream", "buy": "/vykup/biznes/Voyah-Dream", "img": "ChatGPT-Image-19-avg.-2026-g.%2C-16-41-33.98aa3db669bf25f45cb463d62fb8c53c.webP"},
  {"slug": "gac-m8", "name": "GAC M8", "cls": "biznes", "price": 7635, "engine": "1,6-3,3 л", "gearbox": "Автомат", "rent": "/vykup/biznes/Gac-M8", "buy": "/vykup/biznes/Gac-M8", "img": "ChatGPT-Image-19-avg.-2026-g.%2C-16-43-56.98aa3db669bf25f45cb463d62fb8c53c.webP"},
  {"slug": "sollers-atlant-19-td", "name": "Sollers Atlant 1.9 TD", "cls": "gruzovoy", "price": 2813, "rent": "/klassyi-avtomobilej/gruzovoy/sollers-atlant-19-td", "buy": "/vykup/gruzovoy/sollers-atlant-19-td", "img": "sollersatlant19td-%284%29.2011a68be1cf41027f5dfe4808290820.webP"},
  {"slug": "sollers-atlant-l3h2-2-7d", "name": "Sollers Atlant L3H2 2.7D", "cls": "gruzovoy", "price": 4420, "rent": "/klassyi-avtomobilej/gruzovoy/sollers-atlant-l3h2-2-7d", "buy": "/vykup/gruzovoy/sollers-atlant-l3h2-2-7d", "img": "ChatGPT-Image-2-sent.-2026-g.%2C-16-17-36.2011a68be1cf41027f5dfe4808290820.webP"},
  {"slug": "sollers-argo", "name": "Sollers Argo", "cls": "gruzovoy", "price": 4000, "rent": "/klassyi-avtomobilej/gruzovoy/sollers-argo", "buy": "/vykup/gruzovoy/sollers-argo", "img": "sollersargo1-%281%29.2011a68be1cf41027f5dfe4808290820.webP"},
  {"slug": "lada-largus", "name": "Lada Largus", "cls": "gruzovoy", "price": 2000, "buy": "/vykup/gruzovoy/lada-largus", "img": "Lad5a-Largus1.2011a68be1cf41027f5dfe4808290820.webP"},
  {"slug": "sollers-atlant-sf4-l4", "name": "Sollers SF4 L4", "cls": "gruzovoy", "price": 5500, "rent": "/klassyi-avtomobilej/gruzovoy/Sollers-Atlant-SF4-L4", "buy": "/vykup/gruzovoy/Sollers-Atlant-SF4-L4", "img": "ChatGPT-Image-12-avg.-2026-g.-12-35-04.2011a68be1cf41027f5dfe4808290820.webP"},
  {"slug": "lada-granta", "name": "Lada Granta", "cls": "dostavka", "price": 1808, "engine": "1,6-3,3 л", "gearbox": "Автомат", "rent": "/vykup/dostavka/lada-granta", "buy": "/vykup/dostavka/lada-granta", "img": "ChatGPT-Image-11-avg.-2026-g.%2C-16-33-51.98aa3db669bf25f45cb463d62fb8c53c.webP"},
];

export const fleetClasses: { id: CarClass; name: string }[] = [
  { id: "ekonom", name: "эконом" },
  { id: "komfort", name: "комфорт" },
  { id: "komfort-plus", name: "комфорт+" },
  { id: "biznes", name: "бизнес" },
  { id: "gruzovoy", name: "грузовой" },
  { id: "dostavka", name: "доставка" },
];
