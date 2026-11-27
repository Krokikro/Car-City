import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbEnabled } from "@/lib/db";
import { clientIp, originAllowed } from "@/lib/lead/server/guard";
import { deviceOf } from "@/lib/lead/server/parse";
import { normalizePhone } from "@/lib/lead/phone";
import { addIncoming, chatById, createChat, messages, setContact, type ChatRow } from "@/lib/chat/server";
import type { Touch } from "@/lib/lead/types";

export const dynamic = "force-dynamic";

// Чат на сайте. Диалог узнаём по cookie cc_chat = «id.token» (httpOnly, 90 дней).
// GET ?after=N — новые сообщения (виджет опрашивает, пока открыт). POST — сообщение клиента или его контакт.
const COOKIE = "cc_chat";
const g = globalThis as typeof globalThis & { __ccChatRate?: Map<string, number[]> };
const rate = (g.__ccChatRate ??= new Map());
function limited(key: string, max: number, ms: number) {
  const now = Date.now();
  const arr = (rate.get(key) ?? []).filter((t: number) => now - t < ms);
  if (arr.length >= max) return true;
  arr.push(now);
  rate.set(key, arr);
  if (rate.size > 5000) rate.clear();
  return false;
}

async function current(): Promise<ChatRow | null> {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v || !dbEnabled()) return null;
  const [id, token] = v.split(".");
  if (!id || !token) return null;
  const c = await chatById(id).catch(() => null);
  return c && c.token === token ? c : null;
}

const view = (rows: Awaited<ReturnType<typeof messages>>) => rows.filter((m) => m.dir !== "sys").map((m) => ({ id: Number(m.id), me: m.dir === "in", text: m.text, at: m.at }));

export async function GET(req: Request) {
  const chat = await current();
  if (!chat) return NextResponse.json({ messages: [] }, { headers: { "cache-control": "no-store" } });
  const after = Number(new URL(req.url).searchParams.get("after")) || 0;
  return NextResponse.json({ messages: view(await messages(chat.id, after)), contact: Boolean(chat.phone) }, { headers: { "cache-control": "no-store" } });
}

interface Body { text?: string; name?: string; phone?: string; consent?: boolean; marketing?: boolean; page?: string; lang?: string; first?: Touch; last?: Touch; ym_client_id?: string; company_site?: string }

export async function POST(req: Request) {
  if (!dbEnabled()) return NextResponse.json({ ok: false, error: "off" }, { status: 503 });
  if (!originAllowed(req)) return NextResponse.json({ ok: false, error: "origin" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as Body | null;
  if (!b || b.company_site) return NextResponse.json({ ok: true, messages: [] }); // ловушка для ботов
  const ip = clientIp(req);
  let chat = await current();
  const text = (b.text ?? "").trim().slice(0, 2000);
  if (b.phone !== undefined) {
    // контакт клиента
    if (!chat) return NextResponse.json({ ok: false, error: "nochat" }, { status: 400 });
    const phone = normalizePhone(b.phone);
    if (!phone) return NextResponse.json({ ok: false, error: "phone" }, { status: 400 });
    if (!b.consent) return NextResponse.json({ ok: false, error: "consent" }, { status: 400 });
    await setContact(chat, b.name, phone, Boolean(b.marketing));
    return NextResponse.json({ ok: true, messages: [] });
  }
  if (!text) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
  if (limited(`ip:${ip}`, 30, 60_000) || (chat && limited(`c:${chat.id}`, 15, 60_000))) return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
  let setCookie = false;
  if (!chat) {
    if (limited(`new:${ip}`, 5, 3_600_000)) return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
    const ua = req.headers.get("user-agent") || "";
    chat = await createChat({ channel: "site", page: (b.page || req.headers.get("referer") || "").slice(0, 300) || undefined, lang: b.lang, first: b.first, last: b.last, ip, ua, device: deviceOf(ua), ymClientId: b.ym_client_id }, text);
    setCookie = true;
  }
  const m = await addIncoming(chat, text);
  const res = NextResponse.json({ ok: true, id: m ? Number(m.id) : 0, contact: Boolean(chat.phone) });
  if (setCookie) res.cookies.set(COOKIE, `${chat.id}.${chat.token}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 90 * 86400 });
  return res;
}
