import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { getSite } from "@/lib/admin/store";
import { themeForced } from "@/lib/theme";
import { q1 } from "@/lib/db";
import { fmt } from "@/lib/admin/format";
import { setThemeAction } from "../actions-site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Настройки сайта" };

const VARIANTS = [
  { id: "M", name: "Классы в цвете", text: "Машины на цветных фонах своих классов, графитовые кнопки и подвал" },
  { id: "A", name: "Тёплый бетон", text: "Все машины на сером бетоне, спокойная подача" },
  { id: "B", name: "Светлый подвал", text: "Цвета классов, белые кнопки, светлый подвал с контурной надписью" },
] as const;

export default async function Settings({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "settings" });
  const write = can(user, "settings", "write");
  const site = await getSite();
  const forced = themeForced();
  const meta = await q1<{ updated_at: string; updated_by: string | null }>("SELECT updated_at, updated_by FROM settings WHERE key='site'");
  return (
    <Shell user={user} active="settings" title="Настройки сайта" sub="Какую версию сайта видят посетители" flash={sp}>
      {forced && <p className="ad-msg ad-err">На этой копии тема закреплена при сборке (переменная NEXT_PUBLIC_THEME) — это копия для опроса. Переключайте тему на основном сайте.</p>}
      <section className="ad-card">
        <h2>Тема сайта</h2>
        <p className="ad-muted">Сайт один, у него две цветовые версии. Переключение действует для всех посетителей сразу, без пересборки: страницы обновятся в течение минуты. Тексты, адреса, SEO и заявки от темы не зависят.</p>
        <form action={setThemeAction} className="ad-theme-pick">
          <input type="hidden" name="back" value="/admin/settings" />
          <button type="submit" name="theme" value="dark" className={`ad-theme-card dark${site.theme === "dark" ? " on" : ""}`} disabled={!write || forced}>
            <span className="ad-theme-prev" aria-hidden="true"><i /><i /><i /></span>
            <b>Тёмная</b>
            <span>Чёрный фон, жёлтые акценты, неоновые фоны машин</span>
            {site.theme === "dark" && <em className="st st-issued">Сейчас на сайте</em>}
          </button>
          <button type="submit" name="theme" value="light" className={`ad-theme-card light${site.theme === "light" ? " on" : ""}`} disabled={!write || forced}>
            <span className="ad-theme-prev" aria-hidden="true"><i /><i /><i /></span>
            <b>Светлая</b>
            <span>Светлый фон, белые карточки, графит и жёлтый</span>
            {site.theme === "light" && <em className="st st-issued">Сейчас на сайте</em>}
          </button>
        </form>
        {meta && <p className="ad-muted">Последнее переключение: {fmt(meta.updated_at, true)}{meta.updated_by ? ` · ${meta.updated_by}` : ""}</p>}
      </section>
      <section className="ad-card">
        <h2>Подача светлой версии</h2>
        <p className="ad-muted">Действует, когда включена светлая тема.</p>
        <form action={setThemeAction} className="ad-form">
          <input type="hidden" name="back" value="/admin/settings" />
          <input type="hidden" name="theme" value={site.theme} />
          <fieldset disabled={!write || forced} className="ad-plain">
            {VARIANTS.map((v) => (
              <label key={v.id} className="ad-radio"><input type="radio" name="variant" value={v.id} defaultChecked={site.variant === v.id} /><span><b>{v.name}</b> <span className="ad-muted">— {v.text}</span></span></label>
            ))}
            {write && <button className="ad-btn" type="submit">Сохранить подачу</button>}
          </fieldset>
        </form>
      </section>
      <section className="ad-card">
        <h2>Как проверить перед переключением</h2>
        <p className="ad-muted">Светлую версию можно посмотреть заранее на копии сайта, не трогая основной: car-city-light-production.up.railway.app.</p>
      </section>
    </Shell>
  );
}
