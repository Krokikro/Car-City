import { company } from "@/lib/content";
import type { Lang } from "@/lib/i18n";

// Короткое описание и несколько фактов под заголовком в шапках «О нас», «Отзывы», «Новости», «Контакты».
// В светлой версии шапка — фото в рамке справа, и слева без текста было пусто. В тёмной блок скрыт стилями.
type Extra = { lead: string; facts: [string, string][] };
type Texts = Record<"about" | "reviews" | "news" | "contacts", Extra>;

const tel = company.phones[0];

const T: Record<string, Texts> = {
  ru: {
    about: { lead: "Таксопарк в Москве. Сдаём в аренду и продаём в выкуп машины для работы в такси, помогаем подключиться к агрегаторам и выйти на линию в день обращения.", facts: [["1000+", "авто в парке"], ["4000+", "водителей арендовали"], ["3", "офиса в Москве"]] },
    reviews: { lead: "Что пишут водители о работе с нами на Яндекс Картах, 2GIS, Flamp и Yell.", facts: [["5,0", "Яндекс Карты"], ["5,0", "2GIS"], ["5,0", "Flamp"]] },
    news: { lead: "Новости таксопарка, изменения в правилах для такси и советы водителям.", facts: [["#", "статей"]] },
    contacts: { lead: "Приезжайте в любой из трёх офисов или напишите нам — ответим и подберём машину.", facts: [["3", "офиса в Москве"], ["9:00–21:00", "ул. Удальцова, без выходных"], [tel, "телефон"]] },
  },
  en: {
    about: { lead: "A taxi fleet in Moscow. We rent out and sell on a rent-to-own basis cars for taxi work, help you join the ride-hailing apps and start driving the day you apply.", facts: [["1000+", "cars in the fleet"], ["4000+", "drivers have rented"], ["3", "offices in Moscow"]] },
    reviews: { lead: "What drivers say about working with us on Yandex Maps, 2GIS, Flamp and Yell.", facts: [["5.0", "Yandex Maps"], ["5.0", "2GIS"], ["5.0", "Flamp"]] },
    news: { lead: "Fleet news, changes to taxi rules and tips for drivers.", facts: [["#", "articles"]] },
    contacts: { lead: "Visit any of our three offices or message us — we will reply and help you choose a car.", facts: [["3", "offices in Moscow"], ["9:00–21:00", "Udaltsova St, daily"], [tel, "phone"]] },
  },
  kk: {
    about: { lead: "Мәскеудегі таксопарк. Такси жұмысына арналған көліктерді жалға береміз және сатып алу шартымен сатамыз, агрегаторларға қосылуға көмектесеміз — жұмысқа өтініш берген күні шығасыз.", facts: [["1000+", "паркте көлік"], ["4000+", "жүргізуші жалға алды"], ["3", "Мәскеудегі кеңсе"]] },
    reviews: { lead: "Жүргізушілер Яндекс Карталар, 2GIS, Flamp және Yell сайттарында біз туралы не жазады.", facts: [["5,0", "Яндекс Карталар"], ["5,0", "2GIS"], ["5,0", "Flamp"]] },
    news: { lead: "Таксопарк жаңалықтары, такси ережелеріндегі өзгерістер және жүргізушілерге кеңестер.", facts: [["#", "мақала"]] },
    contacts: { lead: "Үш кеңсенің біріне келіңіз немесе бізге жазыңыз — жауап беріп, көлік таңдап береміз.", facts: [["3", "Мәскеудегі кеңсе"], ["9:00–21:00", "Удальцова к., демалыссыз"], [tel, "телефон"]] },
  },
  ky: {
    about: { lead: "Москвадагы таксопарк. Такси иши үчүн унааларды ижарага беребиз жана сатып алуу шарты менен сатабыз, агрегаторлорго туташууга жардам беребиз — кайрылган күнү эле линияга чыгасыз.", facts: [["1000+", "парктагы унаа"], ["4000+", "айдоочу ижарага алган"], ["3", "Москвадагы кеңсе"]] },
    reviews: { lead: "Айдоочулар Яндекс Карталар, 2GIS, Flamp жана Yell сайттарында биз жөнүндө эмне жазышат.", facts: [["5,0", "Яндекс Карталар"], ["5,0", "2GIS"], ["5,0", "Flamp"]] },
    news: { lead: "Таксопарктын жаңылыктары, такси эрежелериндеги өзгөрүүлөр жана айдоочуларга кеңештер.", facts: [["#", "макала"]] },
    contacts: { lead: "Үч кеңсенин бирине келиңиз же бизге жазыңыз — жооп берип, унаа тандап беребиз.", facts: [["3", "Москвадагы кеңсе"], ["9:00–21:00", "Удальцова к., дем алышсыз"], [tel, "телефон"]] },
  },
  uz: {
    about: { lead: "Moskvadagi taksopark. Taksida ishlash uchun avtomobillarni ijaraga beramiz va bo‘lib-bo‘lib sotib olishga sotamiz, agregatorlarga ulanishga yordam beramiz — murojaat qilgan kuningiz liniyaga chiqasiz.", facts: [["1000+", "parkdagi avto"], ["4000+", "haydovchi ijaraga olgan"], ["3", "Moskvadagi ofis"]] },
    reviews: { lead: "Haydovchilar Yandex Kartalar, 2GIS, Flamp va Yell saytlarida biz haqimizda nima yozadi.", facts: [["5,0", "Yandex Kartalar"], ["5,0", "2GIS"], ["5,0", "Flamp"]] },
    news: { lead: "Taksopark yangiliklari, taksi qoidalaridagi o‘zgarishlar va haydovchilarga maslahatlar.", facts: [["#", "maqola"]] },
    contacts: { lead: "Uchta ofisimizdan biriga keling yoki bizga yozing — javob beramiz va avtomobil tanlab beramiz.", facts: [["3", "Moskvadagi ofis"], ["9:00–21:00", "Udalsova ko‘ch., dam olishsiz"], [tel, "telefon"]] },
  },
};

export function HeroExtra({ k, lang = "ru", count }: { k: string; lang?: Lang; count?: number }) {
  const x = (T[lang] ?? T.ru)[k as keyof Texts];
  if (!x) return null;
  const facts = x.facts.filter(([v]) => v !== "#" || (count ?? 0) > 0).map(([v, l]) => [v === "#" ? String(count) : v, l] as const);
  return (
    <div className="pg-hero-extra" data-reveal>
      <p className="lead">{x.lead}</p>
      <ul className="pg-hero-facts">
        {facts.map(([v, l]) => (
          <li key={l}><b>{v}{k === "reviews" && <i aria-hidden="true"> ★</i>}</b><span>{l}</span></li>
        ))}
      </ul>
    </div>
  );
}
