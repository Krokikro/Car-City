import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { ChatThread } from "@/components/admin/ChatThread";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { fmt } from "@/lib/admin/format";
import { chatForUser, listChats } from "@/lib/chat/admin";
import { CHANNEL_NAMES, messages } from "@/lib/chat/server";
import { chatToolAction } from "../actions-chat";

type SP = { status?: string; channel?: string; mine?: string; q?: string; e?: string; ok?: string };

export async function ChatsView({ id, sp }: { id?: string; sp: SP }) {
  const user = await requireUser({ section: "chats" });
  const write = can(user, "chats", "write");
  const status = sp.status ?? "open";
  const list = await listChats(user, { ...sp, status });
  const chat = id ? await chatForUser(user, id) : null;
  const msgs = chat ? await messages(chat.id) : [];
  const keep = { ...sp, status, e: undefined, ok: undefined };
  const qs = (o: Record<string, string | undefined>) => "?" + new URLSearchParams(Object.entries({ ...keep, ...o }).filter(([, v]) => v) as [string, string][]).toString();
  const base = (cid: string) => `/admin/chats/${cid}${qs({})}`;

  return (
    <Shell user={user} active="chats" title="Чаты" sub="Переписка с клиентами: чат на сайте, Telegram, MAX, WhatsApp. Каждый новый диалог — это и заявка." flash={sp}
      actions={can(user, "integrations", "read") ? <Link className="pnl-btn" href="/admin/integrations">Подключить мессенджеры</Link> : undefined}>
      <AutoRefresh seconds={15} />
      <div className="pnl-chats">
        <aside className="pnl-chat-list">
          <div className="pnl-tabs pnl-tabs-sm">
            {[["open", "Открытые"], ["unread", "Новые"], ["closed", "Закрытые"], ["all", "Все"]].map(([k, n]) => <Link key={k} href={`/admin/chats${qs({ status: k })}`} className={status === k ? "on" : ""}>{n}</Link>)}
          </div>
          <form className="pnl-chat-search" action="/admin/chats">
            <input type="hidden" name="status" value={status} />
            <select name="channel" defaultValue={sp.channel ?? ""} aria-label="Канал"><option value="">Все каналы</option>{Object.entries(CHANNEL_NAMES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
            <input name="q" placeholder="Имя, телефон, текст" defaultValue={sp.q} maxLength={100} />
            <button className="pnl-btn pnl-btn-sm" type="submit">Найти</button>
          </form>
          <ul>
            {list.map((c) => (
              <li key={c.id}>
                <Link href={base(c.id)} className={`${c.id === id ? "on" : ""}${c.unread ? " unread" : ""}`}>
                  <span className={`pnl-ch pnl-ch-${c.channel}`}>{CHANNEL_NAMES[c.channel]}</span>
                  <b>{c.name || c.phone || "Без имени"}</b>
                  {c.unread > 0 && <i className="pnl-badge">{c.unread}</i>}
                  <time>{fmt(c.updated_at)}</time>
                  <span className="pnl-chat-last">{c.last_dir === "out" ? "Вы: " : ""}{c.last_text}</span>
                </Link>
              </li>
            ))}
            {list.length === 0 && <li className="pnl-muted pnl-chat-empty">Диалогов нет. Здесь появляются сообщения из чата на сайте и из подключённых мессенджеров.</li>}
          </ul>
        </aside>
        <section className="pnl-chat-main">
          {!chat ? (
            <div className="pnl-chat-placeholder"><p>Выберите диалог слева.</p></div>
          ) : (
            <>
              <header className="pnl-chat-head">
                <div>
                  <b>{chat.name || "Без имени"}</b> <span className={`pnl-ch pnl-ch-${chat.channel}`}>{CHANNEL_NAMES[chat.channel]}</span>
                  <p className="pnl-muted">
                    {chat.phone ? <a href={`tel:${chat.phone.replace(/[^\d+]/g, "")}`}>{chat.phone}</a> : "телефон не оставил"}
                    {chat.city ? ` · ${chat.city}` : ""}{(chat.meta?.username as string) ? ` · @${chat.meta.username as string}` : ""}
                    {` · ${chat.assignee_name ? `ведёт ${chat.assignee_name}` : "ничей"}`}
                  </p>
                </div>
                <div className="pnl-actions">
                  {chat.lead_id && <Link className="pnl-btn pnl-btn-sm" href={`/admin/leads/${chat.lead_id}`}>Заявка</Link>}
                  {write && chat.assignee !== user.id && <form action={chatToolAction}><input type="hidden" name="id" value={chat.id} /><button className="pnl-btn pnl-btn-sm" name="op" value="take">Взять себе</button></form>}
                  {write && <form action={chatToolAction}><input type="hidden" name="id" value={chat.id} /><button className="pnl-btn pnl-btn-sm" name="op" value={chat.status === "open" ? "close" : "open"}>{chat.status === "open" ? "Закрыть диалог" : "Открыть снова"}</button></form>}
                </div>
              </header>
              <ChatThread key={chat.id} id={chat.id} initial={msgs} canWrite={write} channel={chat.channel} />
            </>
          )}
        </section>
      </div>
    </Shell>
  );
}
