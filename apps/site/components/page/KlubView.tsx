import { GenImage } from "../GenImage";
import type { Lang } from "@/lib/i18n";

// «Закрытый клуб»: что есть в клубе (игровая с PS5, зал, теннисный стол) и какие бывают события
// (турниры, дни открытых дверей, праздники). Фото — Higgsfield, public/pages/club-*.
type Tile = { img: string; t: string; d: string };
type Texts = { placeTitle: string; placeLead: string; place: Tile[]; joinTile: [string, string, string]; eventsTitle: string; events: Tile[] };

const T: Record<string, Texts> = {
  ru: {
    placeTitle: "Что есть в клубе",
    placeLead: "Место, где можно отдохнуть между сменами, размяться и пообщаться с коллегами.",
    place: [
      { img: "club-ps5", t: "Игровая с PlayStation 5", d: "Большой экран, диван и турниры по футболу и гонкам между сменами" },
      { img: "club-gym", t: "Тренажёрный зал", d: "Беговые дорожки, гантели и турник — чтобы спина не уставала от долгих смен" },
      { img: "club-tt", t: "Теннисный стол", d: "Играем каждый день, а раз в сезон проводим турнир с призами" },
    ],
    joinTile: ["Вход — для водителей с выкупом", "Доступ в клуб входит в условия аренды с правом выкупа", "Оставить заявку"],
    eventsTitle: "События клуба",
    events: [
      { img: "club-pingpong", t: "Турниры", d: "Настольный теннис, футбол на PS5 и другие соревнования среди водителей — с призами" },
      { img: "club-openday", t: "Дни открытых дверей", d: "Показываем парк, новые модели и рассказываем, как устроены аренда и выкуп" },
      { img: "club-holiday", t: "Праздники", d: "Отмечаем вместе День таксиста и другие праздники: угощения, подарки и розыгрыши" },
    ],
  },
  en: {
    placeTitle: "What the club has",
    placeLead: "A place to rest between shifts, stretch your legs and talk to colleagues.",
    place: [
      { img: "club-ps5", t: "PlayStation 5 game room", d: "A big screen, a sofa and football and racing tournaments between shifts" },
      { img: "club-gym", t: "Gym", d: "Treadmills, dumbbells and a pull-up bar, so long shifts are easier on your back" },
      { img: "club-tt", t: "Table tennis", d: "We play every day and hold a tournament with prizes once a season" },
    ],
    joinTile: ["For drivers on rent-to-own", "Club access is part of the rent-to-own terms", "Leave a request"],
    eventsTitle: "Club events",
    events: [
      { img: "club-pingpong", t: "Tournaments", d: "Table tennis, PS5 football and other contests between drivers — with prizes" },
      { img: "club-openday", t: "Open days", d: "We show the fleet and new models and explain how rental and buyout work" },
      { img: "club-holiday", t: "Holidays", d: "We celebrate Taxi Driver's Day and other holidays together: food, gifts and prize draws" },
    ],
  },
  kk: {
    placeTitle: "Клубта не бар?",
    placeLead: "Ауысымдар арасында демалып, сергіп, әріптестермен сөйлесетін орын.",
    place: [
      { img: "club-ps5", t: "PlayStation 5 ойын бөлмесі", d: "Үлкен экран, диван және ауысымдар арасында футбол мен жарыс турнирлері" },
      { img: "club-gym", t: "Тренажер залы", d: "Жүгіру жолдары, гантельдер және турник — ұзақ ауысымнан арқа шаршамас үшін" },
      { img: "club-tt", t: "Теннис үстелі", d: "Күнде ойнаймыз, ал маусымына бір рет жүлделі турнир өткіземіз" },
    ],
    joinTile: ["Сатып алумен жалға алған жүргізушілерге", "Клубқа кіру сатып алу шарттарына кіреді", "Өтінім қалдыру"],
    eventsTitle: "Клуб іс-шаралары",
    events: [
      { img: "club-pingpong", t: "Турнирлер", d: "Үстел теннисі, PS5-те футбол және жүргізушілер арасындағы басқа жарыстар — жүлделермен" },
      { img: "club-openday", t: "Ашық есік күндері", d: "Паркті, жаңа модельдерді көрсетіп, жалға алу мен сатып алу қалай жүретінін айтамыз" },
      { img: "club-holiday", t: "Мерекелер", d: "Таксист күнін және басқа мерекелерді бірге атап өтеміз: дастархан, сыйлықтар, ұтыс ойындары" },
    ],
  },
  ky: {
    placeTitle: "Клубда эмнелер бар",
    placeLead: "Сменалардын ортосунда эс алып, сергип, кесиптештер менен баарлашчу жай.",
    place: [
      { img: "club-ps5", t: "PlayStation 5 оюн бөлмөсү", d: "Чоң экран, диван жана сменалардын ортосунда футбол менен жарыш турнирлери" },
      { img: "club-gym", t: "Машыгуу залы", d: "Чуркоо жолдору, гантелдер жана турник — узак сменадан бел чарчабашы үчүн" },
      { img: "club-tt", t: "Теннис үстөлү", d: "Күн сайын ойнойбуз, сезонуна бир жолу байгелүү турнир өткөрөбүз" },
    ],
    joinTile: ["Сатып алуу менен ижарага алган айдоочуларга", "Клубга кирүү сатып алуу шарттарына кирет", "Өтүнмө калтыруу"],
    eventsTitle: "Клубдун иш-чаралары",
    events: [
      { img: "club-pingpong", t: "Турнирлер", d: "Стол тенниси, PS5те футбол жана айдоочулар арасындагы башка мелдештер — байгелер менен" },
      { img: "club-openday", t: "Ачык эшиктер күнү", d: "Паркты, жаңы моделдерди көрсөтүп, ижара жана сатып алуу кантип иштээрин айтып беребиз" },
      { img: "club-holiday", t: "Майрамдар", d: "Таксисттер күнүн жана башка майрамдарды чогуу белгилейбиз: дасторкон, белектер, утуштар" },
    ],
  },
  uz: {
    placeTitle: "Klubda nimalar bor",
    placeLead: "Smenalar orasida dam olish, badanni chiniqtirish va hamkasblar bilan suhbatlashish uchun joy.",
    place: [
      { img: "club-ps5", t: "PlayStation 5 o‘yin xonasi", d: "Katta ekran, divan va smenalar orasida futbol hamda poyga turnirlari" },
      { img: "club-gym", t: "Trenajyor zali", d: "Yugurish yo‘lakchalari, gantellar va turnik — uzoq smenadan bel charchamasligi uchun" },
      { img: "club-tt", t: "Tennis stoli", d: "Har kuni o‘ynaymiz, mavsumda bir marta sovrinli turnir o‘tkazamiz" },
    ],
    joinTile: ["Sotib olish sharti bilan ijaraga olgan haydovchilar uchun", "Klubga kirish sotib olish shartlariga kiradi", "Ariza qoldirish"],
    eventsTitle: "Klub tadbirlari",
    events: [
      { img: "club-pingpong", t: "Turnirlar", d: "Stol tennisi, PS5da futbol va haydovchilar o‘rtasidagi boshqa musobaqalar — sovrinlar bilan" },
      { img: "club-openday", t: "Ochiq eshiklar kuni", d: "Parkni, yangi modellarni ko‘rsatamiz va ijara hamda sotib olish qanday ishlashini tushuntiramiz" },
      { img: "club-holiday", t: "Bayramlar", d: "Taksichilar kuni va boshqa bayramlarni birga nishonlaymiz: dasturxon, sovg‘alar va o‘yinlar" },
    ],
  },
};

export function KlubView({ lang = "ru" }: { lang?: Lang }) {
  const t = T[lang] ?? T.ru;
  return (
    <>
      <section className="section kl-sec">
        <div className="wrap">
          <div className="kl-head">
            <h2 className="display" data-split>{t.placeTitle}</h2>
            <p className="lead">{t.placeLead}</p>
          </div>
          <div className="kl-bento" data-reveal-stagger>
            {t.place.map((x, i) => (
              <figure key={x.img} className={`kl-tile${i === 0 ? " kl-big" : ""}`}>
                <GenImage kind="pages" id={x.img} className="kl-img" sizes={i === 0 ? "(max-width: 900px) 100vw, 60vw" : "(max-width: 900px) 100vw, 30vw"} alt={x.t} />
                <figcaption><b>{x.t}</b><span>{x.d}</span></figcaption>
              </figure>
            ))}
            <div className="kl-tile kl-note">
              <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 11V8a5 5 0 0110 0v3M5 11h14v10H5zM12 15v2" /></svg>
              <b>{t.joinTile[0]}</b>
              <span>{t.joinTile[1]}</span>
              <a className="btn btn-dark btn-sm" href="#zayavka">{t.joinTile[2]} <span className="arrow">→</span></a>
            </div>
          </div>
        </div>
      </section>
      <section className="section kl-sec">
        <div className="wrap">
          <h2 className="display" data-split>{t.eventsTitle}</h2>
          <div className="kl-events" data-reveal-stagger>
            {t.events.map((x, i) => (
              <article key={x.t} className="kl-ev">
                <GenImage kind="pages" id={x.img} className="kl-img" sizes="(max-width: 900px) 100vw, 33vw" alt={x.t} />
                <div className="kl-ev-txt">
                  <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{x.t}</h3>
                  <p>{x.d}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
