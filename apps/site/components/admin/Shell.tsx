import Link from "next/link";
import { draftMode } from "next/headers";
import { logoutAction } from "@/app/(admin)/admin/actions";
import { can, ROLE_NAMES, SECTION_NAMES, type Section } from "@/lib/admin/roles";
import type { AdminUser } from "@/lib/admin/auth";

const NAV: { s: Section; href: string; icon: string }[] = [
  { s: "dashboard", href: "/admin", icon: "M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" },
  { s: "leads", href: "/admin/leads", icon: "M4 5h16v11H8l-4 4zM8 9h8M8 12h5" },
  { s: "content", href: "/admin/content", icon: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7" },
  { s: "catalog", href: "/admin/catalog", icon: "M3 14l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5v4h-3v-2H6v2H3zM7 14h.01M17 14h.01" },
  { s: "reviews", href: "/admin/reviews", icon: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" },
  { s: "media", href: "/admin/media", icon: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M9 9h.01" },
  { s: "users", href: "/admin/users", icon: "M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-4 3-6 7-6s7 2 7 6M17 11a3 3 0 100-6M18 15c3 .5 4 2.5 4 6" },
  { s: "audit", href: "/admin/audit", icon: "M12 8v5l3 2M21 12a9 9 0 11-3-6.7M21 4v5h-5" },
];

export async function Shell({ user, active, title, sub, actions, children, flash }: {
  user: AdminUser;
  active: Section | "security";
  title: string;
  sub?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  flash?: { e?: string; ok?: string };
}) {
  const preview = (await draftMode()).isEnabled;
  return (
    <div className="ad">
      <aside className="ad-side">
        <Link href="/admin" className="ad-logo"><b>Car City</b><span>админка</span></Link>
        <nav>
          {NAV.filter((n) => can(user.role, n.s, "read")).map((n) => (
            <Link key={n.s} href={n.href} className={active === n.s ? "on" : ""}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={n.icon} /></svg>
              {SECTION_NAMES[n.s]}
            </Link>
          ))}
        </nav>
        <div className="ad-me">
          <Link href="/admin/security" className={active === "security" ? "on" : ""}><b>{user.name || user.email}</b><span>{ROLE_NAMES[user.role]}</span></Link>
          <form action={logoutAction}><button className="ad-link" type="submit">Выйти</button></form>
          <a className="ad-link" href="/" target="_blank" rel="noreferrer">Открыть сайт ↗</a>
        </div>
      </aside>
      <main className="ad-main">
        {preview && (
          <div className="ad-banner">
            В этом браузере включён предпросмотр черновиков: сайт показывает неопубликованные правки.
            <a href="/admin/preview/off">Выключить</a>
          </div>
        )}
        <header className="ad-head">
          <div>
            <h1>{title}</h1>
            {sub && <p>{sub}</p>}
          </div>
          {actions && <div className="ad-actions">{actions}</div>}
        </header>
        {flash?.e && <p className="ad-msg ad-err" role="alert">{flash.e}</p>}
        {flash?.ok && <p className="ad-msg ad-ok" role="status">{flash.ok}</p>}
        {children}
      </main>
    </div>
  );
}
