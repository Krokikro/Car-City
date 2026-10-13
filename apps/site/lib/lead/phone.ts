// Маска и проверка телефона (PRD 8.1): +7, +996, +998, +375, +992.
// Общий код для формы и сервера.

interface Country {
  code: string;
  /** Длина номера без кода страны */
  len: number;
  /** Группы цифр после кода: [3, 3, 2, 2] → «(999) 123-45-67» */
  groups: number[];
}

// prettier-ignore
const COUNTRIES: Country[] = [
  { code: "996", len: 9, groups: [3, 3, 3] }, // Кыргызстан
  { code: "998", len: 9, groups: [2, 3, 2, 2] }, // Узбекистан
  { code: "375", len: 9, groups: [2, 3, 2, 2] }, // Беларусь
  { code: "992", len: 9, groups: [2, 3, 2, 2] }, // Таджикистан
  { code: "7", len: 10, groups: [3, 3, 2, 2] }, // Россия и Казахстан
];

/** Цифры номера с кодом страны. Ведущую 8 и номер без кода («9…») считаем российскими. */
export function phoneDigits(raw: string): string {
  const plus = raw.trim().startsWith("+");
  let d = raw.replace(/\D/g, "");
  if (!d) return "";
  if (!plus && d[0] === "8") d = "7" + d.slice(1);
  else if (!plus && d[0] === "9") d = "7" + d;
  return d;
}

function countryOf(d: string): Country | null | undefined {
  const c = COUNTRIES.find((c) => d.startsWith(c.code));
  if (c) return c;
  // Код ещё набирается («+9», «+37») — ждём следующих цифр
  if (COUNTRIES.some((c) => c.code.startsWith(d))) return undefined;
  return null;
}

/** Форматирует ввод на лету: «89991234567» → «+7 (999) 123-45-67». */
export function formatPhone(raw: string): string {
  let d = phoneDigits(raw);
  if (!d) return raw.trim() === "+" ? "+" : "";
  let c = countryOf(d);
  if (c === undefined) return "+" + d;
  if (c === null) {
    d = "7" + d;
    c = COUNTRIES[COUNTRIES.length - 1];
  }
  const rest = d.slice(c.code.length, c.code.length + c.len);
  const parts: string[] = [];
  let i = 0;
  for (const g of c.groups) {
    if (i >= rest.length) break;
    parts.push(rest.slice(i, i + g));
    i += g;
  }
  if (c.code === "7") {
    const [a, ...tail] = parts;
    if (!a) return "+7";
    return `+7 (${a}${a.length === 3 ? ")" : ""}${tail.length ? " " + tail[0] : ""}${tail.slice(1).map((p) => "-" + p).join("")}`;
  }
  if (c.code === "996") return `+996${parts.length ? " " + parts.join(" ") : ""}`;
  const [a, b, ...tail] = parts;
  return `+${c.code}${a ? " " + a : ""}${b ? " " + b : ""}${tail.map((p) => "-" + p).join("")}`;
}

/** Нормализованный номер «+79991234567» или null, если длина не сходится со страной. */
export function normalizePhone(raw: string): string | null {
  const d = phoneDigits(raw);
  const c = countryOf(d);
  if (!c || d.length !== c.code.length + c.len) return null;
  // Российский мобильный или городской: после +7 не бывает 0, 1, 2
  if (c.code === "7" && /^7[012]/.test(d)) return null;
  return "+" + d;
}

/** Для логов: «+7999***67». Полный номер в логи не пишем. */
export function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.length < 6 ? "***" : `+${d.slice(0, 4)}***${d.slice(-2)}`;
}
