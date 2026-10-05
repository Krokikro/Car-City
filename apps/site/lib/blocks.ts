// Разбор текста страницы с car-city.pro на блоки нового дизайна.
// Текст не меняется: меняется только то, каким компонентом он показан.
import { marked } from "marked";
import { fleet } from "./fleet";
import { toPath } from "./docs";

export interface Btn { label: string; href: string }
export interface Card { name: string; slug?: string; specs: [string, string][]; price?: string; btn?: Btn; img?: string }
export interface Fig { src: string; caption: string }
export interface Qa { q: string; a: string }

export type Block =
  | { t: "section"; title: string; html: string; figs: Fig[]; btns: Btn[] }
  | { t: "faq"; title: string; items: Qa[] }
  | { t: "cards"; groups: { label?: string; cards: Card[] }[] }
  | { t: "calculator" }
  | { t: "trust" };

export interface Parsed {
  crumbs: string[];
  intro: { paras: string[]; specs: string[]; price?: string; btns: Btn[]; html: string; figs: Fig[] };
  blocks: Block[];
  final: boolean;
}

const DECOR = /\.svg|checkers|gift\.jpg|car_logo|calendar\.png|geely-e1\.png|\/conditions\/|tg1\.webp/i;
const MODEL_LINK = /^\/(vykup|klassyi-avtomobilej)\/[^/]+\/[^/]+$/i;

export function localHref(url: string) {
  if (!/^https?:\/\/(www\.)?car-city\.pro/.test(url)) return url;
  const p = toPath(url);
  return p === "/" ? "/" : p;
}

/** Кнопки без ссылки на старом сайте открывают форму заявки — у нас это блок #zayavka на той же странице */
function btnHref(label: string, url?: string, twin?: string) {
  if (url) return localHref(url);
  if (/выкуп/i.test(label) && twin) return twin;
  if (/аренд/i.test(label) && twin) return twin;
  return "#zayavka";
}

function prep(src: string) {
  let s = src.replace(/<!--[\s\S]*?-->/g, "").replace(/\r/g, "");
  let final = false;
  const fi = s.search(/^Дарим 1-ый день бесплатно!?/m);
  if (fi >= 0) {
    final = true;
    const head = s.slice(0, fi);
    const cut = Math.max(head.lastIndexOf("\n---"), head.lastIndexOf("![Gift]"));
    s = head.slice(0, cut >= 0 && fi - cut < 600 ? cut : fi);
  }
  let crumbs: string[] = [];
  s = s.replace(/^BREADCRUMBS:\s*(.+)$/m, (_, c: string) => { crumbs = c.split(">").map((x) => x.trim()); return ""; });
  s = s.replace(/^# .+$/m, "");
  s = s.replace(/^\[КАЛЬКУЛЯТОР[^\]]*\]\s*$/gm, "[[calc]]");
  s = s.replace(/\[Кнопка:\s*([^\]]+)\]/g, (_, l: string) => `[[btn:${l.trim()}]]`);
  s = s.replace(/^\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)[ \t]*$/gm, (_, l: string, u: string) => `[[btn:${l.trim()}|${u}]]`);
  s = s.replace(/^\[([^\]\n[]+)\][ \t]*$/gm, (_, l: string) => `[[btn:${l.trim()}]]`);
  // несколько картинок в строке (иллюстрации без подписей) и отдельные картинки
  s = s.replace(/^(?:!\[[^\]]*\]\([^)]+\)[ \t]*)+$/gm, (line) =>
    [...line.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)].filter((m) => !DECOR.test(m[2])).map((m) => `[[img:${m[2]}|${m[1]}]]`).join("\n"),
  );
  // иконка + подпись в одной строке → пункт списка, фото + подпись → карточка
  s = s.replace(/^!\[[^\]]*\]\(([^)]+)\)[ \t]+(.+)$/gm, (m, u: string, cap: string) => (DECOR.test(u) ? `- ${cap}` : `[[fig:${u}|${cap}]]`));
  // ссылки на старый домен → относительные
  s = s.replace(/\]\((https?:\/\/(?:www\.)?car-city\.pro[^)]*)\)/g, (_, u: string) => `](${localHref(u)})`);
  return { s, crumbs, final };
}

function listClass(html: string) {
  return html.replace(/<ul>([\s\S]*?)<\/ul>/g, (m, inner: string) => {
    const items = inner.match(/<li>[\s\S]*?<\/li>/g) ?? [];
    const short = items.every((i) => i.replace(/<[^>]+>/g, "").length <= 150);
    const cls = items.length >= 3 && items.length <= 12 && short ? "tiles" : "ticks";
    return `<ul class="${cls}">${inner}</ul>`;
  })
    .replace(/<ol>/g, '<ol class="stepl">')
    // строка из одних ссылок (например, тарифы) → ряд «таблеток»
    .replace(/<p>((?:\s*<a href="[^"]*">[^<]+<\/a>\s*){2,})<\/p>/g, (_, g: string) => `<p class="pill-row">${g.replace(/<a /g, '<a class="pill" ')}</p>`)
    // три и больше пар «подзаголовок + короткий абзац» подряд → сетка карточек
    .replace(/(?:<h3[^>]*>[^<]*<\/h3>\s*<p>(?:(?!<\/p>)[\s\S]){0,400}<\/p>\s*){3,}/g, (g: string) =>
      `<div class="qgrid">${g.replace(/<h3([^>]*)>([^<]*)<\/h3>\s*(<p>[\s\S]*?<\/p>)/g, '<div class="qcard"><h3$1>$2</h3>$3</div>')}</div>`)
    .replace(/<table>/g, '<div class="tbl" data-reveal><table>')
    .replace(/<\/table>/g, "</table></div>");
}

function render(md: string, twin?: string) {
  const btns: Btn[] = [];
  const figs: Fig[] = [];
  let body = md
    .replace(/^\[\[btn:([^\]|]+)(?:\|([^\]]+))?\]\][ \t]*$/gm, (_, l: string, u?: string) => { btns.push({ label: l, href: btnHref(l, u, twin) }); return `@@BTN${btns.length - 1}@@`; })
    .replace(/\[\[btn:([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, l: string, u?: string) => { btns.push({ label: l, href: btnHref(l, u, twin) }); return `@@BTN${btns.length - 1}@@`; })
    .replace(/^\[\[fig:([^|\]]+)\|([^\]]*)\]\][ \t]*$/gm, (_, u: string, c: string) => { figs.push({ src: u, caption: c }); return ""; })
    .replace(/^\[\[img:([^|\]]+)\|([^\]]*)\]\][ \t]*$/gm, (_, u: string, c: string) => `@@IMG${encodeURIComponent(u)}|${encodeURIComponent(c)}@@`);
  let html = marked.parse(body, { async: false }) as string;
  html = listClass(html)
    .replace(/<p>((?:\s*@@BTN\d+@@\s*)+)<\/p>/g, (_, g: string) => `<p class="btn-row">${g}</p>`)
    .replace(/@@BTN(\d+)@@/g, (_, i: string) => {
      const b = btns[+i];
      const primary = b.href === "#zayavka" || /начать|забронир|получить/i.test(b.label);
      return `<a class="btn ${primary ? "btn-primary" : "btn-ghost"}" href="${b.href}">${b.label} <span class="arrow">→</span></a>`;
    })
    .replace(/<p>@@IMG([^|@]+)\|([^@]*)@@<\/p>/g, (_, u: string, c: string) => imgFig(decodeURIComponent(u), decodeURIComponent(c)))
    .replace(/@@IMG([^|@]+)\|([^@]*)@@/g, (_, u: string, c: string) => imgFig(decodeURIComponent(u), decodeURIComponent(c)));
  return { html, figs, btns };
}

function imgFig(src: string, alt: string) {
  return `<figure class="rimg" data-reveal><img src="${src}" alt="${alt.replace(/"/g, "&quot;")}" loading="lazy" decoding="async" onerror="this.parentNode.classList.add('noimg')"/></figure>`;
}

function card(title: string, body: string): Card | null {
  const btn = body.match(/\[\[btn:([^\]|]+)\|([^\]]+)\]\]/);
  const href = btn ? localHref(btn[2]) : undefined;
  if (!btn || !href || !MODEL_LINK.test(href)) return null;
  const price = body.match(/^(от\s[\d\s]+\s?₽[^\n]*)$/m)?.[1];
  const specs = [...body.matchAll(/^([А-ЯЁA-Z][^:\n]{2,30}):\s*(.+)$/gm)].map((m) => [m[1], m[2]] as [string, string]);
  const img = body.match(/\[\[img:([^|\]]+)/)?.[1];
  const f = fleet.find((x) => [x.rent, x.buy].some((p) => p?.toLowerCase() === href.toLowerCase()));
  return { name: title, slug: f?.slug, specs, price, btn: { label: btn[1], href }, img };
}

export function parseDoc(src: string, opts: { twin?: string; model?: boolean } = {}): Parsed {
  const { s, crumbs, final } = prep(src);
  const chunks = s.split(/^## /m);
  const introMd = chunks.shift() ?? "";
  const blocks: Block[] = [];
  let label: string | undefined;

  // вступление: у страниц моделей это характеристики, цена и кнопки
  const intro = (() => {
    const lines = introMd.split("\n").map((l) => l.trim()).filter(Boolean);
    const tail = lines.length && /^### /.test(lines[lines.length - 1]) ? lines.pop()!.slice(4) : undefined;
    if (tail) label = tail;
    const btns: Btn[] = [];
    const specs: string[] = [];
    const paras: string[] = [];
    let price: string | undefined;
    const rest: string[] = [];
    for (const l of lines) {
      const b = l.match(/^\[\[btn:([^\]|]+)(?:\|([^\]]+))?\]\]$/);
      if (b) { btns.push({ label: b[1], href: btnHref(b[1], b[2], opts.twin) }); continue; }
      if (opts.model && /^от\s.*₽/.test(l)) { price = l; continue; }
      if (opts.model && l.length < 48 && !/^[#\-[|]/.test(l)) { specs.push(l); continue; }
      rest.push(l);
    }
    const r = render(rest.join("\n\n").replace(/\n\n(?=\|)/g, "\n").replace(/\n\n(?=- )/g, "\n"), opts.twin);
    for (const l of rest) if (!/^[#\-[|@]/.test(l) && !l.startsWith("[[")) paras.push(l);
    return { paras, specs, price, btns, html: r.html, figs: r.figs };
  })();

  const pushSection = (title: string, md: string) => {
    if (/\[\[calc\]\]/.test(md)) { blocks.push({ t: "calculator" }); return; }
    if (/^Нам доверяют/i.test(title)) { blocks.push({ t: "trust" }); return; }
    const qs = md.split(/^### /m);
    if (/вопрос/i.test(title) && qs.length > 2) {
      const lead = qs.shift()!;
      const items = qs.map((q) => { const [h, ...a] = q.split("\n"); return { q: h.trim(), a: render(a.join("\n"), opts.twin).html }; });
      if (lead.trim()) blocks.push({ t: "section", title, ...render(lead, opts.twin) });
      blocks.push({ t: "faq", title: lead.trim() ? "" : title, items });
      return;
    }
    const r = render(md, opts.twin);
    blocks.push({ t: "section", title, ...r });
  };

  for (const ch of chunks) {
    const nl = ch.indexOf("\n");
    const title = (nl < 0 ? ch : ch.slice(0, nl)).trim();
    let body = nl < 0 ? "" : ch.slice(nl + 1);
    // карточка каталога заканчивается на «---» или на следующем подзаголовке
    const end = body.search(/^(---|### )/m);
    const head = end >= 0 ? body.slice(0, end) : body;
    const c = card(title, head);
    if (c) {
      const last = blocks[blocks.length - 1];
      const grp = { label, cards: [c] };
      if (last?.t === "cards") {
        if (label) last.groups.push(grp); else last.groups[last.groups.length - 1].cards.push(c);
      } else blocks.push({ t: "cards", groups: [grp] });
      label = undefined;
      body = end >= 0 ? body.slice(end) : "";
      // хвост после карточек: «### Комфорт+» перед следующей карточкой — ярлык группы, остальное — обычные разделы
      const m = body.replace(/^---\s*$/m, "").trim();
      if (!m) continue;
      const subs = m.split(/^### /m).filter((x) => x.trim());
      const lastSub = subs[subs.length - 1];
      if (lastSub && !lastSub.trim().includes("\n")) { label = lastSub.trim(); subs.pop(); }
      for (const sub of subs) {
        const i = sub.indexOf("\n");
        pushSection(sub.slice(0, i < 0 ? undefined : i).trim(), i < 0 ? "" : sub.slice(i + 1));
      }
      continue;
    }
    pushSection(title, body);
  }
  return { crumbs, intro, blocks, final };
}
