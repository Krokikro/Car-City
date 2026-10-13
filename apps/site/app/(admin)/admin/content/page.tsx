import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { fileDocs } from "@/lib/docs";
import { LANGS } from "@/lib/i18n";
import { isLangId, rows } from "@/lib/admin/pages";
import { fmt } from "@/lib/admin/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Контент и SEO" };

const KINDS: Record<string, string> = { page: "Страница", model: "Модель", article: "Статья" };
const LANG_NAMES: Record<string, string> = { ru: "Русский", en: "English", ky: "Кыргызча", kk: "Қазақша", uz: "O‘zbekcha" };

export default async function Content({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; lang?: string; q?: string; kind?: string; st?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "content" });
  const lang = sp.lang && isLangId(sp.lang) ? sp.lang : "ru";
  const write = can(user.role, "content", "write");
  const db = new Map((await rows()).filter((r) => r.lang === lang).map((r) => [r.path, r]));
  const files = fileDocs(lang);
  const paths = [...new Set([...files.keys(), ...db.keys()])];
  const query = (sp.q ?? "").toLowerCase();
  const list = paths
    .map((path) => {
      const f = files.get(path);
      const r = db.get(path);
      const shown = r?.draft ?? r?.published ?? undefined;
      const status = r?.publish_at ? "sched" : r?.draft ? "draft" : r?.published?.hidden ? "hidden" : r?.published ? (f ? "edited" : "new") : "file";
      return { path, kind: f ? f.kind : (shown?.kind ?? "page"), h1: shown?.h1 ?? f?.h1 ?? path, title: shown?.title ?? f?.title ?? "", status, at: r?.updated_at, by: r?.updated_by, sched: r?.publish_at };
    })
    .filter((x) => path0(x.path) && (!sp.kind || x.kind === sp.kind) && (!sp.st || x.status === sp.st) && (!query || `${x.h1} ${x.path} ${x.title}`.toLowerCase().includes(query)))
    .sort((a, b) => (a.status === "file" ? 1 : 0) - (b.status === "file" ? 1 : 0) || a.path.localeCompare(b.path));
  const label: Record<string, string> = { file: "", edited: "Изменена", draft: "Черновик", sched: "По расписанию", hidden: "Скрыта", new: "Новая" };

  return (
    <Shell user={user} active="content" title="Контент и SEO" sub="Тексты страниц, заголовки и описания для поисковиков" flash={sp}
      actions={write ? <Link className="ad-btn ad-btn-main" href="/admin/content/new">Новая страница</Link> : undefined}>
      <div className="ad-tools">
        <div className="ad-tabs">
          {LANGS.map((l) => <Link key={l} href={`/admin/content?lang=${l}`} className={l === lang ? "on" : ""}>{LANG_NAMES[l] ?? l}</Link>)}
        </div>
        <form className="ad-filter" action="/admin/content">
          <input type="hidden" name="lang" value={lang} />
          <input name="q" placeholder="Поиск по названию или адресу" defaultValue={sp.q} />
          <select name="kind" defaultValue={sp.kind ?? ""}><option value="">Все типы</option>{Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select name="st" defaultValue={sp.st ?? ""}><option value="">Любой статус</option><option value="draft">Черновики</option><option value="sched">По расписанию</option><option value="edited">Изменённые</option><option value="hidden">Скрытые</option></select>
          <button className="ad-btn" type="submit">Найти</button>
        </form>
      </div>
      {lang !== "ru" && <p className="ad-muted">Здесь только страницы, переведённые на этот язык. Чтобы перевести ещё одну, откройте русскую страницу и выберите язык в редакторе или создайте её по тому же адресу.</p>}
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead><tr><th>Страница</th><th>Адрес</th><th>Тип</th><th>Статус</th><th>Изменена</th></tr></thead>
          <tbody>
            {list.map((x) => (
              <tr key={x.path}>
                <td><Link href={`/admin/content/edit?lang=${lang}&path=${encodeURIComponent(x.path)}`}><b>{x.h1}</b></Link></td>
                <td><code>{x.path}</code></td>
                <td>{KINDS[x.kind] ?? x.kind}</td>
                <td>{label[x.status] && <em className={`st st-${x.status}`}>{label[x.status]}{x.sched ? ` · ${fmt(x.sched)}` : ""}</em>}</td>
                <td className="ad-muted">{x.at ? `${fmt(x.at)} · ${x.by ?? ""}` : ""}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="ad-muted">Ничего не найдено</td></tr>}
          </tbody>
        </table>
      </div>
      {lang === "ru" && (
        <p className="ad-muted">Тексты главной страницы (первый экран, преимущества, отзывы и т.д.) пока лежат в коде сайта и в этом списке не показываются; их мы вынесем следующим шагом.</p>
      )}
    </Shell>
  );
}
const path0 = (p: string) => p !== "/";
