import { href, type Lang } from "@/lib/i18n";
import { ratings, reviews } from "@/lib/home";

export function Reviews({ lang = "ru" }: { lang?: Lang }) {
  return (
    <section className="section reviews" aria-labelledby="reviews-title">
      <div className="wrap">
        <div className="reviews-head">
          <h2 id="reviews-title" className="display" data-split>Отзывы</h2>
          <ul className="ratings" data-reveal-stagger>
            {ratings.map((r) => (
              <li key={r.name}>
                <a href={r.url} target="_blank" rel="noopener">
                  <span className="rating-score">{r.score}</span>
                  <span className="stars" aria-label="5 из 5">★★★★★</span>
                  <span className="mono">{r.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="review-track" tabIndex={0} aria-label="Отзывы водителей">
        {reviews.map((r) => (
          <figure key={r.name} className="review">
            <blockquote>{r.text}</blockquote>
            <figcaption>
              <span className="review-av" aria-hidden="true">{r.name[0]}</span>
              <span><strong>{r.name}</strong><span className="muted small">{r.date} на {r.source}</span></span>
            </figcaption>
          </figure>
        ))}
        <a href={href("/reviews", lang)} className="review review-more">
          <span className="h1">Показать еще</span>
          <span className="arrow">→</span>
        </a>
      </div>
    </section>
  );
}
