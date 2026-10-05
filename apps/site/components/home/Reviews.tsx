import { href, type Lang } from "@/lib/i18n";
import { ratings, reviews } from "@/lib/home";
import type { HomeText } from "@/lib/home-text";

export function Reviews({ lang = "ru", t }: { lang?: Lang; t: HomeText["reviews"] }) {
  return (
    <section className="section reviews" aria-labelledby="reviews-title">
      <div className="wrap">
        <div className="reviews-head">
          <h2 id="reviews-title" className="display" data-split>{t.title}</h2>
          <ul className="ratings" data-reveal-stagger>
            {ratings.map((r) => (
              <li key={r.name}>
                <a href={r.url} target="_blank" rel="noopener">
                  <span className="rating-score">{r.score}</span>
                  <span className="stars" aria-label={t.stars}>★★★★★</span>
                  <span className="mono">{r.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="review-track" tabIndex={0} aria-label={t.label}>
        {reviews.map((r) => (
          <figure key={r.name} className="review">
            <blockquote>{r.text}</blockquote>
            <figcaption>
              <span className="review-av" aria-hidden="true">{r.name[0]}</span>
              <span><strong>{r.name}</strong><span className="muted small">{r.date} {t.on} {r.source}</span></span>
            </figcaption>
          </figure>
        ))}
        <a href={href("/reviews", lang)} className="review review-more">
          <span className="h1">{t.more}</span>
          <span className="arrow">→</span>
        </a>
      </div>
    </section>
  );
}
