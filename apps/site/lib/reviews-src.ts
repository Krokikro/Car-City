/** Страницы отзывов в каждом источнике. Без серверных импортов, чтобы подключать из клиентских компонентов. */
export const SOURCE_URL: Record<string, string> = {
  "Яндекс.Карты": "https://yandex.ru/maps/org/kar_siti/23072345480/reviews/",
  "2GIS": "https://2gis.ru/moscow/firm/70000001075332260/tab/reviews",
  Flamp: "https://moscow.flamp.ru/firm/car_city_kompaniya_po_vykupu_i_arende_avto_dlya_raboty_v_taksi-70000001075332260#reviews",
  Yell: "https://www.yell.ru/moscow/com/car-city_14476670/reviews/",
};
export const SOURCES = Object.keys(SOURCE_URL);
