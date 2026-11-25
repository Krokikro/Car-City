import { marked } from "marked";

// Правка SEO 25.11: теги визуального акцента (<b>, <strong>) на сайте не используем — жирное начертание задаёт CSS (класс .b).
marked.use({
  renderer: {
    strong({ tokens }) {
      return `<span class="b">${this.parser.parseInline(tokens)}</span>`;
    },
  },
});

export { marked };
