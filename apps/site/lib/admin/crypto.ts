// Пароли (scrypt), секреты 2FA (AES-GCM) и одноразовые коды TOTP (RFC 6238) — только на встроенном node:crypto.
import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const token = (bytes = 32) => randomBytes(bytes).toString("base64url");

export function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const key = scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `s1$${salt.toString("base64")}$${key.toString("base64")}`;
}

export function verifyPassword(pw: string, stored: string | null | undefined) {
  // Один и тот же объём работы при любом ответе, чтобы по времени не угадать, есть ли такой пользователь
  const [v, s, k] = (stored ?? "s1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA").split("$");
  const salt = Buffer.from(s ?? "", "base64");
  const want = Buffer.from(k ?? "", "base64");
  const got = scryptSync(pw, salt, want.length || 64, { N: 16384, r: 8, p: 1 });
  return Boolean(stored) && v === "s1" && want.length === got.length && timingSafeEqual(want, got);
}

export function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return "Пароль короче 10 символов";
  if (!/[a-zа-яё]/i.test(pw) || !/\d/.test(pw)) return "В пароле нужны буквы и цифры";
  return null;
}

// Секреты 2FA лежат в базе зашифрованными. Ключ — ADMIN_SECRET_KEY; без него берём производный от адреса базы.
const key = () => createHash("sha256").update(process.env.ADMIN_SECRET_KEY || process.env.DATABASE_URL || "car-city-dev").digest();

export function seal(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `v1.${iv.toString("base64url")}.${c.getAuthTag().toString("base64url")}.${enc.toString("base64url")}`;
}

export function unseal(s: string) {
  const [, iv, tag, enc] = s.split(".");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(enc, "base64url")), d.final()]).toString("utf8");
}

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function newTotpSecret() {
  const b = randomBytes(20);
  let bits = "";
  for (const x of b) bits += x.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function b32decode(s: string) {
  let bits = "";
  for (const ch of s.replace(/=+$/, "").toUpperCase()) bits += B32.indexOf(ch).toString(2).padStart(5, "0");
  const out: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(out);
}

function hotp(secret: string, counter: number) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", b32decode(secret)).update(buf).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, "0");
}

/** Код из приложения-аутентификатора; допускаем соседние 30 секунд (часы телефона отстают) */
export function verifyTotp(secret: string, code: string) {
  const c = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return false;
  const now = Math.floor(Date.now() / 30000);
  return [-1, 0, 1].some((d) => {
    const a = Buffer.from(hotp(secret, now + d));
    return timingSafeEqual(a, Buffer.from(c));
  });
}

export const totpUri = (secret: string, email: string) =>
  `otpauth://totp/${encodeURIComponent("Car City:" + email)}?secret=${secret}&issuer=${encodeURIComponent("Car City")}&digits=6&period=30`;
