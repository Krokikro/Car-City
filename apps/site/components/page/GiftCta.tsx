import type { Lang } from "@/lib/i18n";
import type { Block } from "@/lib/blocks";

type Sec = Extract<Block, { t: "section" }>;

/** Признак блока «Дарим 1-ый день бесплатно!» на внутренних страницах */
export const isGift = (b: Sec) => /дарим|подар|gift|сыйла|sovg|тарту|free/i.test(b.title) && b.btns.length > 0;

const TICKET: Record<string, { top: string; day: string; free: string }> = {
  ru: { top: "Car City · купон", day: "день аренды", free: "бесплатно" },
  en: { top: "Car City · coupon", day: "day of rent", free: "free" },
  kk: { top: "Car City · купон", day: "жалдау күні", free: "тегін" },
  ky: { top: "Car City · купон", day: "ижара күнү", free: "бекер" },
  uz: { top: "Car City · kupon", day: "kun ijara", free: "bepul" },
};

const strip = (s: string) => s.replace(/<[^>]+>/g, "").trim();

// Подарок: слева заголовок и текст, справа плитка с подарочной коробкой и кнопка заявки. Тексты — те же, что на car-city.pro.
export function GiftCta({ b, lang = "ru" }: { b: Sec; lang?: Lang }) {
  const tk = TICKET[lang] ?? TICKET.ru;
  const paras = [...b.html.matchAll(/<p(?: [^>]*)?>([\s\S]*?)<\/p>/g)].map((m) => m[1]).filter((p) => !/class="btn/.test(p) && !/@@/.test(p));
  const text = paras.find((p) => !/согласи|consent|rozilik|келис/i.test(p) && strip(p).length > 8) ?? "";
  const consent = paras.find((p) => /<a /.test(p) && p !== text) ?? "";
  const label = b.btns[0]?.label ?? "";
  return (
    <section className="section gift-sec" aria-labelledby="gift-title">
      <div className="wrap">
        <div className="gift-card" data-reveal>
          <i className="gift-checker" aria-hidden="true" />
          <div className="gift-copy">
            <h2 id="gift-title" className="display" data-split>{b.title}</h2>
            {text && <p className="lead" dangerouslySetInnerHTML={{ __html: text }} />}
          </div>
          <div className="gift-side">
            <div className="gift-ticket" aria-hidden="true">
              <span className="gt-top mono">{tk.top}</span>
              <span className="gt-main"><b>1</b><span>{tk.day}</span></span>
              <span className="gt-cut" />
              <span className="gt-foot"><b>0 ₽</b><span>{tk.free}</span></span>
            </div>
            <a className="btn btn-primary btn-lg" href="#zayavka" data-lead="rent" data-magnetic>{label} <span className="arrow">→</span></a>
            {consent && <p className="gift-consent small" dangerouslySetInnerHTML={{ __html: consent }} />}
          </div>
        </div>
      </div>
    </section>
  );
}
