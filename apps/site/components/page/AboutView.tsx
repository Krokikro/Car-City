import type { Parsed } from "@/lib/blocks";
import { Figs } from "./PageParts";

// «О нас»: текст и фото ёлочкой (слева-справа по очереди), фото раскрываются шторкой при прокрутке.
// Тексты — как на car-city.pro, меняется только раскладка.
const FIG = /<figure class="rimg"[^>]*>[\s\S]*?<\/figure>/;

function splitMedia(html: string) {
  const m = html.match(FIG);
  const img = m?.[0].match(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/);
  return { text: html.replace(FIG, "").trim(), src: img?.[1], alt: img?.[2] ?? "" };
}

export function AboutView({ p }: { p: Parsed }) {
  const intro = splitMedia(p.intro.html);
  const rows = [
    { title: "", ...intro, figs: [] as Parsed["intro"]["figs"] },
    ...p.blocks.filter((b) => b.t === "section").map((b) => ({ title: b.title, ...splitMedia(b.html), figs: b.figs })),
  ];
  let side = 0;
  return (
    <div className="about">
      {rows.map((r, i) => {
        if (!r.src) {
          return (
            <section key={i} className="section about-row about-full">
              <div className="wrap">
                {r.title && <h2 className="display" data-split>{r.title}</h2>}
                {r.text && <div className="prose about-text" data-reveal dangerouslySetInnerHTML={{ __html: r.text }} />}
                <Figs figs={r.figs} />
              </div>
            </section>
          );
        }
        const flip = side++ % 2 === 1;
        return (
          <section key={i} className={`section about-row${flip ? " is-flip" : ""}`}>
            <div className="wrap about-grid">
              <div className="about-copy">
                <span className="about-n mono" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                {r.title ? <h2 className="display" data-split>{r.title}</h2> : null}
                <div className={`prose about-text${r.title ? "" : " about-lead"}`} data-reveal dangerouslySetInnerHTML={{ __html: r.text }} />
              </div>
              <figure className="about-media" data-clip={flip ? "left" : "right"}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.src} alt={r.alt} loading={i === 0 ? "eager" : "lazy"} decoding="async" />
              </figure>
            </div>
          </section>
        );
      })}
    </div>
  );
}
