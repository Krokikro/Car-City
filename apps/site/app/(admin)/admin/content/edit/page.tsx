import { notFound } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { PageEditor } from "@/components/admin/PageEditor";
import { requireUser } from "@/lib/admin/auth";
import { can, sectionOfKind } from "@/lib/admin/roles";
import { redirect } from "next/navigation";
import { cleanPath, fileData, isLangId, rowOf, versions } from "@/lib/admin/pages";
import { fmt, localInput } from "@/lib/admin/format";
import { pageToolAction } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Редактор страницы" };

export default async function Edit({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; lang?: string; path?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const lang = sp.lang ?? "ru";
  const path = cleanPath(sp.path ?? "");
  if (!isLangId(lang) || !path) notFound();
  const row = await rowOf(lang, path);
  const file = fileData(lang, path);
  // перевода ещё нет: за основу берём русский текст
  const base = file ?? (lang !== "ru" ? fileData("ru", path) : null);
  const cur = row?.draft ?? row?.published ?? base;
  if (!cur) notFound();
  const kind = (file ?? base)?.kind ?? ("kind" in cur && cur.kind ? cur.kind : "page");
  const sec = sectionOfKind(kind);
  if (!can(user, sec, "read")) redirect("/admin?denied=1");
  const write = can(user, sec, "write");
  const seoWrite = can(user, "seo", "write") || kind === "article";
  const vers = await versions(lang, path);
  const state = row?.publish_at ? `Запланировано на ${fmt(row.publish_at, true)} (МСК)` : row?.draft ? "Есть неопубликованный черновик" : row?.published?.hidden ? "Снята с публикации" : row?.published ? "Опубликована с правками" : file ? "Как в исходном тексте сайта" : "Перевода нет, показан русский текст";
  const siteHref = lang === "ru" ? path : `/${lang}${path}`;

  return (
    <Shell user={user} active={sec} title={cur.h1 || path} sub={`${path} · ${state}`} flash={sp}
      actions={<><Link className="pnl-btn" href={`/admin/content?lang=${lang}&kind=${kind}`}>← К списку</Link>{can(user, "seo", "read") && <Link className="pnl-btn" href={`/admin/seo/page?lang=${lang}&path=${encodeURIComponent(path)}`}>SEO страницы</Link>}<a className="pnl-btn" href={siteHref} target="_blank" rel="noreferrer">Открыть на сайте ↗</a></>}>
      <PageEditor
        lang={lang} path={path} kind={kind} readOnly={!write} seoReadOnly={!seoWrite}
        initial={{ title: cur.title, h1: cur.h1, description: cur.description ?? "", body: cur.body }}
        hasDraft={Boolean(row?.draft)} publishAt={localInput(row?.publish_at)} hidden={Boolean(row?.published?.hidden && !row?.draft)}
        previewTo={siteHref}
      />
      {write && (
        <details className="pnl-card">
          <summary>Версии и сброс</summary>
          <div className="pnl-tools-row">
            {row?.draft && <form action={pageToolAction}><input type="hidden" name="lang" value={lang} /><input type="hidden" name="path" value={path} /><input type="hidden" name="act" value="discard" /><input type="hidden" name="kind" value={kind} /><button className="pnl-btn" type="submit">Отбросить черновик</button></form>}
            {row && file && <form action={pageToolAction}><input type="hidden" name="lang" value={lang} /><input type="hidden" name="path" value={path} /><input type="hidden" name="act" value="reset" /><input type="hidden" name="kind" value={kind} /><button className="pnl-btn pnl-btn-warn" type="submit">Вернуть исходный текст сайта</button></form>}
          </div>
          <h3>История публикаций</h3>
          {vers.length === 0 ? <p className="pnl-muted">Публикаций из админки пока не было.</p> : (
            <ul className="pnl-list">
              {vers.map((v) => (
                <li key={v.id}>
                  <span><b>{fmt(v.at, true)}</b> · {v.by ?? "—"} · {v.note ?? ""}<br /><span className="pnl-muted">{v.data.h1}</span></span>
                  <form action={pageToolAction}><input type="hidden" name="lang" value={lang} /><input type="hidden" name="path" value={path} /><input type="hidden" name="act" value="rollback" /><input type="hidden" name="kind" value={kind} /><input type="hidden" name="version" value={v.id} /><button className="pnl-btn" type="submit">В черновик</button></form>
                </li>
              ))}
            </ul>
          )}
        </details>
      )}
    </Shell>
  );
}
