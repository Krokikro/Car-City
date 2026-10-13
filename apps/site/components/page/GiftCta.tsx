import type { Block } from "@/lib/blocks";

type Sec = Extract<Block, { t: "section" }>;

/** Признак блока «Дарим 1-ый день бесплатно!» на внутренних страницах */
export const isGift = (b: Sec) => /дарим|подар|gift|сыйла|sovg|тарту|free/i.test(b.title) && b.btns.length > 0;

const strip = (s: string) => s.replace(/<[^>]+>/g, "").trim();

// Подарок: слева заголовок и текст, справа плитка с подарочной коробкой и кнопка заявки. Тексты — те же, что на car-city.pro.
export function GiftCta({ b }: { b: Sec }) {
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
            <svg className="gift-box" viewBox="0 0 220 200" aria-hidden="true">
              <defs>
                <linearGradient id="gb1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFD24D" /><stop offset="1" stopColor="#E89A00" /></linearGradient>
                <linearGradient id="gb2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1b1b1e" /><stop offset="1" stopColor="#2a2a2f" /></linearGradient>
              </defs>
              <ellipse cx="110" cy="188" rx="84" ry="9" fill="#000" opacity=".35" />
              <rect x="30" y="84" width="160" height="96" rx="14" fill="url(#gb1)" />
              <rect x="22" y="62" width="176" height="36" rx="12" fill="url(#gb1)" />
              <rect x="22" y="62" width="176" height="36" rx="12" fill="#fff" opacity=".18" />
              <rect x="94" y="62" width="32" height="118" fill="url(#gb2)" />
              <path d="M110 62c-8-30-44-40-52-22-6 14 14 24 52 22zM110 62c8-30 44-40 52-22 6 14-14 24-52 22z" fill="none" stroke="url(#gb2)" strokeWidth="9" strokeLinejoin="round" />
              <circle cx="110" cy="62" r="9" fill="#1b1b1e" />
            </svg>
            <p className="gift-big" aria-hidden="true"><b>0</b><span>₽</span></p>
            <a className="btn btn-primary btn-lg" href="#zayavka" data-lead="rent" data-magnetic>{label} <span className="arrow">→</span></a>
            {consent && <p className="gift-consent small" dangerouslySetInnerHTML={{ __html: consent }} />}
          </div>
        </div>
      </div>
    </section>
  );
}
