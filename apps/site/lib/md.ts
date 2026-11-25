import { marked } from "marked";

// Правка SEO 25.11: теги визуального акцента (<b>, <strong>) на сайте не используем — жирное начертание задаёт CSS (классы .b и .s — бывший strong).
marked.use({
  renderer: {
    strong({ tokens }) {
      return `<span class="b s">${this.parser.parseInline(tokens)}</span>`;
    },
  },
});

export { marked };
