import Link from "next/link";
import { draftMode } from "next/headers";
import { logoutAction } from "@/app/(admin)/admin/actions";
import { setThemeAction } from "@/app/(admin)/admin/actions-site";
import { can, SECTION_NAMES, type Section } from "@/lib/admin/roles";
import type { AdminUser } from "@/lib/admin/auth";
import { getSite } from "@/lib/admin/store";
import { themeForced } from "@/lib/theme";
import { AdminEnhance } from "./AdminEnhance";

type Nav = { s: Section; href: string; icon: string; label?: string; id?: string };
const NAV: { group: string; items: Nav[] }[] = [
  { group: "", items: [
    { s: "dashboard", href: "/admin", icon: "M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" },
    { s: "leads", href: "/admin/leads", icon: "M4 5h16v11H8l-4 4zM8 9h8M8 12h5" },
  ] },
  { group: "Контент", items: [
    { s: "pages", href: "/admin/content?kind=page", icon: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7" },
    { s: "pages", id: "texts-home", href: "/admin/texts?s=home", label: "Главная (тексты)", icon: "M4 4h16v6H4zM4 14h7v6H4zM15 14h5M15 17h5M15 20h3" },
    { s: "articles", href: "/admin/content?kind=article", icon: "M4 5h11v14H4zM15 8h5v9a2 2 0 01-2 2h-3M7 9h5M7 12h5M7 15h3" },
    { s: "catalog", href: "/admin/catalog", icon: "M3 14l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5v4h-3v-2H6v2H3zM7 14h.01M17 14h.01" },
    { s: "reviews", href: "/admin/reviews", icon: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" },
    { s: "media", href: "/admin/media", icon: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M9 9h.01" },
  ] },
  { group: "SEO", items: [
    { s: "seo", href: "/admin/seo", icon: "M10 4a6 6 0 104.5 10L20 19.5M10 7v6M7 10h6" },
    { s: "redirects", href: "/admin/redirects", icon: "M4 7h11l-3-3M20 17H9l3 3M15 7l5 0M4 17h5" },
    { s: "migration", href: "/admin/migration", icon: "M4 12h10M10 6l6 6-6 6M18 4v16" },
  ] },
  { group: "Управление", items: [
    { s: "settings", href: "/admin/settings", icon: "M12 9a3 3 0 100 6 3 3 0 000-6zM19 12l2-1-1-3-2 .3-1.3-1.3L17 5l-3-1-1 2h-2L10 4 7 5l.3 2L6 8.3 4 8l-1 3 2 1v2l-2 1 1 3 2-.3L7.3 17 7 19l3 1 1-2h2l1 2 3-1-.3-2 1.3-1.3 2 .3 1-3-2-1z" },
    { s: "settings", id: "texts", href: "/admin/texts?s=ui", label: "Тексты сайта", icon: "M5 5h14M12 5v14M8 19h8" },
    { s: "users", href: "/admin/users", icon: "M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-4 3-6 7-6s7 2 7 6M17 11a3 3 0 100-6M18 15c3 .5 4 2.5 4 6" },
    { s: "roles", href: "/admin/roles", icon: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4" },
    { s: "audit", href: "/admin/audit", icon: "M12 8v5l3 2M21 12a9 9 0 11-3-6.7M21 4v5h-5" },
  ] },
];

export async function Shell({ user, active, title, sub, actions, children, flash }: {
  user: AdminUser;
  active: Section | "security" | "content" | "texts-home" | "texts";
  title: string;
  sub?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  flash?: { e?: string; ok?: string };
}) {
  const preview = (await draftMode()).isEnabled;
  const site = await getSite().catch(() => ({ theme: "dark" as const, variant: "M" as const }));
  const canTheme = can(user, "settings", "write") && !themeForced();
  return (
    <div className="pnl">
      <aside className="pnl-side">
        <Link href="/admin" className="pnl-logo"><b>Car City</b><span>админка</span></Link>
        <nav>
          {NAV.map((g) => {
            const items = g.items.filter((n) => can(user, n.s, "read"));
            if (!items.length) return null;
            return (
              <div key={g.group} className="pnl-nav-group">
                {g.group && <p className="pnl-nav-h">{g.group}</p>}
                {items.map((n) => (
                  <Link key={n.href} href={n.href} className={active === (n.id ?? n.s) ? "on" : ""}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d={n.icon} /></svg>
                    {n.label ?? SECTION_NAMES[n.s]}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>
        {can(user, "settings", "read") && (
          <form action={setThemeAction} className="pnl-theme" title="Какая версия сайта видна посетителям">
            <input type="hidden" name="back" value="/admin" />
            <span className="pnl-theme-l">Сайт сейчас</span>
            <span className={`pnl-theme-sw ${site.theme}`} aria-hidden="true"><i /></span>
            <b>{site.theme === "light" ? "Светлый" : "Тёмный"}</b>
            {canTheme && <button className="pnl-btn pnl-btn-sm" type="submit" name="theme" value={site.theme === "light" ? "dark" : "light"}>Переключить на {site.theme === "light" ? "тёмный" : "светлый"}</button>}
          </form>
        )}
        <div className="pnl-me">
          <Link href="/admin/security" className={active === "security" ? "on" : ""}><b>{user.name || user.login}</b><span>{user.roleName}</span></Link>
          <form action={logoutAction}><button className="pnl-link" type="submit">Выйти</button></form>
          <a className="pnl-link" href="/" target="_blank" rel="noreferrer">Открыть сайт ↗</a>
        </div>
      </aside>
      <main className="pnl-main">
        {preview && (
          <div className="pnl-banner">
            В этом браузере включён предпросмотр черновиков: сайт показывает неопубликованные правки.
            <a href="/admin/preview/off">Выключить</a>
          </div>
        )}
        <header className="pnl-head">
          <div>
            <h1>{title}</h1>
            {sub && <p>{sub}</p>}
          </div>
          {actions && <div className="pnl-actions">{actions}</div>}
        </header>
        {flash?.e && <p className="pnl-msg pnl-err" role="alert">{flash.e}</p>}
        {flash?.ok && <p className="pnl-msg pnl-ok" role="status">{flash.ok}</p>}
        {children}
      </main>
      <AdminEnhance />
    </div>
  );
}
