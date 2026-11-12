// Генератор светлой темы: читает тёмные стили сайта и пишет app/styles/light.gen.css —
// те же правила под [data-theme="light"], где цвета пересчитаны для светлого фона.
// Ручные правки поверх — в app/styles/light.css. Запуск: node scripts/gen-light-css.mjs
// (автоматически перед сборкой, см. package.json «prebuild»), поэтому новые тёмные стили сразу получают светлую пару.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "app", "styles");
const FILES = ["base.css", "header.css", "hero.css", "sections.css", "pages.css", "lead.css", "v2.css", "v3.css", "vykup.css"];
const SCOPE = '[data-theme="light"]';

// — разбор CSS: правила, @media/@supports с вложенными правилами; @keyframes и @font-face пропускаем —
function stripComments(s) { return s.replace(/\/\*[\s\S]*?\*\//g, ""); }
function parse(s) {
  const out = []; let i = 0;
  while (i < s.length) {
    const open = s.indexOf("{", i);
    if (open < 0) break;
    const head = s.slice(i, open).trim();
    // найти парную скобку
    let depth = 1, j = open + 1;
    while (j < s.length && depth) { if (s[j] === "{") depth++; else if (s[j] === "}") depth--; j++; }
    const body = s.slice(open + 1, j - 1);
    if (head.startsWith("@media") || head.startsWith("@supports")) out.push({ at: head, rules: parse(body) });
    else if (head.startsWith("@")) { /* keyframes, font-face, property — без изменений */ }
    else out.push({ sel: head, decls: body });
    i = j;
  }
  return out;
}
function splitTop(str, sep) {
  const parts = []; let depth = 0, cur = "", q = null;
  for (const ch of str) {
    if (q) { cur += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === "(" || ch === "[") depth++;
    if (ch === ")" || ch === "]") depth--;
    if (ch === sep && depth === 0) { parts.push(cur); cur = ""; } else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

// — цвета —
const HEX = /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const RGB = /rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*(?:[,/]\s*([\d.]+%?))?\s*\)/g;
const NAMED = { white: [255, 255, 255, 1], black: [0, 0, 0, 1] };
function parseHex(h) {
  h = h.slice(1);
  if (h.length <= 4) h = [...h].map((c) => c + c).join("");
  const n = [0, 2, 4].map((k) => parseInt(h.slice(k, k + 2), 16));
  return [...n, h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
}
function hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function rgbOfHsl(h, s, l) {
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
}
const fmt = ([r, g, b, a]) => a >= 0.999 ? "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("") : `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${+a.toFixed(3)})`;

// Палитра светлой темы
const FOG = [245, 245, 242], PAPER = [255, 255, 255], WASH = [236, 236, 232], INK = [26, 25, 25], LINE = [216, 216, 212], SHADE = [24, 28, 36];

function mapColor(c, kind) {
  const [r, g, b, a] = c; const [h, s, l] = hsl(c);
  const neutral = s < 0.2 || l < 0.09 || (l < 0.14 && s < 0.6);
  if (kind === "text") {
    if (neutral) {
      if (l < 0.35) return c;                            // тёмный текст (на жёлтых кнопках) не трогаем
      const nl = 0.1 + (1 - l) * 0.75;                    // светлый текст → тёмный
      return [...rgbOfHsl(h, Math.min(s, 0.06), nl), a];
    }
    if (h >= 30 && h <= 55) return [176, 122, 0, a];      // жёлтый текст → тёмное золото, читается на белом
    if (h >= 170 && h <= 205) return [14, 116, 144, a];   // циан → глубокий бирюзовый
    return [...rgbOfHsl(h, s, Math.min(l, 0.4)), a];
  }
  if (kind === "shadow") {
    if (neutral && l < 0.3) return [...SHADE, Math.min(a * 0.32, 0.2)];
    if (neutral && l > 0.85) return c;                    // светлые внутренние блики оставляем
    return [r, g, b, a * 0.7];                            // цветные свечения чуть мягче
  }
  // фон и линии
  if (neutral) {
    if (l > 0.85) return a > 0.9 ? c : [15, 17, 20, Math.min(a * 0.9, 0.9)]; // белые полупрозрачные заливки и линии → тёмные
    if (l < 0.065) return kind === "line" ? [...LINE, a] : [...FOG, a];
    if (l < 0.12) return kind === "line" ? [...LINE, a] : [...PAPER, a];
    if (l < 0.3) return kind === "line" ? [...LINE, a] : [...WASH, a];
    const nl = 1 - l; return [...rgbOfHsl(h, s, nl), a];
  }
  if (l < 0.2) return [...rgbOfHsl(h, Math.min(s, 0.5), 0.93), a];   // тёмные цветные подложки → светлые тинты
  return c;
}

function mapValue(v, kind) {
  let out = v.replace(HEX, (m) => fmt(mapColor(parseHex(m), kind)));
  out = out.replace(RGB, (m, r, g, b, a) => fmt(mapColor([+r, +g, +b, a == null ? 1 : a.endsWith("%") ? parseFloat(a) / 100 : +a], kind)));
  out = out.replace(/(^|[\s,(])(white|black)(?=[\s,)]|$)/g, (m, p, n) => p + fmt(mapColor(NAMED[n], kind)));
  if (kind === "text") out = out.replace(/var\(--cc-signal\)/g, "var(--cc-signal-text)").replace(/var\(--cc-cyan\)/g, "var(--cc-cyan-text)");
  return out;
}

const TEXT = /^(color|fill|stroke|caret-color|-webkit-text-stroke(-color)?|text-decoration(-color)?|outline(-color)?|-webkit-text-fill-color|column-rule(-color)?|accent-color)$/;
const SHADOW = /^(box-shadow|text-shadow|filter|-webkit-filter|backdrop-filter)$/;
const LINEP = /^border(-(top|right|bottom|left|block|inline)(-start|-end)?)?(-color)?$/;
const BG = /^(background(-color|-image)?|border-image|--[\w-]+|scrollbar-color)$/;
const HAS_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(|\b(white|black)\b|var\(--(cc-signal|cc-cyan)\)/;
// цветовые var() тоже переносим (без изменений), чтобы сохранить порядок каскада
const COLOR_VAR = /var\(--(bg|surface|surface-2|line|text|text-muted|text-faint|glass|glass-line|cc-[\w-]+|accent-text)\)/;

function scopeSel(sel) {
  return splitTop(sel, ",").map((x) => {
    x = x.trim();
    if (/^:root\b/.test(x)) return x.replace(/^:root/, `:root${SCOPE}`);
    if (/^html\b/.test(x)) return x.replace(/^html/, `html${SCOPE}`);
    return `${SCOPE} ${x}`;
  }).join(",\n");
}

// Если переносим шорткат (background, text-decoration), он сбрасывает свои подсвойства —
// поэтому переносим и их (background-clip: text у градиентных надписей и т. п.).
const LONGHANDS = { background: /^(-webkit-)?background-(clip|size|position|repeat|origin|attachment|blend-mode)$/, "text-decoration": /^text-(decoration-(thickness|style|line)|underline-offset)$/ };
// «Тёмные острова»: элементы, нарисованные как физические предметы (асфальт дороги, таксометр),
// остаются в исходных цветах и на светлой странице. Подписи на крышах такси — вручную в light.css.
const KEEP = /\.road-|\.mt\b|\.mt-|\.stp-(n|t|sign)\b/;
function convertRule(rule) {
  if (KEEP.test(rule.sel)) return "";
  const decls = []; const short = new Set();
  for (const d of splitTop(rule.decls, ";")) {
    const k = d.indexOf(":"); if (k < 0) continue;
    const prop = d.slice(0, k).trim(), val = d.slice(k + 1).trim();
    if ([...short].some((sh) => LONGHANDS[sh].test(prop))) { decls.push(`  ${prop}: ${val};`); continue; }
    if (/^-?-?(mask|webkit-mask)/.test(prop.replace(/^-webkit-/, "")) || prop.startsWith("-webkit-mask") || prop === "mask" || prop.startsWith("mask-")) continue;
    if (!HAS_COLOR.test(val) && !COLOR_VAR.test(val)) continue;
    const kind = TEXT.test(prop) ? "text" : SHADOW.test(prop) ? "shadow" : LINEP.test(prop) ? "line" : BG.test(prop) ? "bg" : null;
    if (!kind) continue;
    decls.push(`  ${prop}: ${mapValue(val, kind)};`);
    if (LONGHANDS[prop]) short.add(prop);
  }
  if (!decls.length) return "";
  return `${scopeSel(rule.sel)} {\n${decls.join("\n")}\n}\n`;
}
function convert(list) {
  return list.map((r) => {
    if (r.at) { const inner = convert(r.rules); return inner ? `${r.at} {\n${inner}}\n` : ""; }
    return convertRule(r);
  }).join("");
}

let out = "/* Сгенерировано scripts/gen-light-css.mjs из тёмных стилей. Не править руками — правки в light.css. */\n";
for (const f of FILES) out += `\n/* ── ${f} ── */\n` + convert(parse(stripComments(readFileSync(join(DIR, f), "utf8"))));
writeFileSync(join(DIR, "light.gen.css"), out);
console.log("light.gen.css:", out.length, "bytes");
