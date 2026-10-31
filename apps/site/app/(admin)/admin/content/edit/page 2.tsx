import { notFound } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { PageEditor } from "@/components/admin/PageEditor";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { cleanPath, fileData, isLangId, rowOf, versions } from "@/lib/admin/pages";
import { fmt, localInput } from "@/lib/admin/format";
import { pageToolAction } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Редактор страницы" };

export default async function Edit({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; lang?: string; path?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "content" });
  const lang = sp.lang ?? "ru";
  const path = cleanPath(sp.path ?? "");
  if (!isLangId(lang) || !path) notFound();
  const write = can(user.role, "content", "write");
  const row = await rowOf(lang, path);
  const file = fileData(lang, path);
  // перевода ещё нет: за основу берём русский текст
  const base = file ?? (lang !== "ru" ? fileData("ru", path) : null);
  const cur = row?.draft ?? row?.published ?? base;
  if (!cur) notFound();
  const kind = (file ?? base)?.kind ?? ("kind" in cur && cur.kind ? cur.kind : "page");
  const vers = await versions(lang, path);
  const state = row?.publish_at ? `Запланировано на ${fmt(row.publish_at, true)} (МСК)` : row?.draft ? "Есть неопубликованный черновик" : row?.published?.hidden ? "Снята с публикации" : row?.published ? "Опубликована с правками" : file ? "Как в исходном тексте сайта" : "Перевода нет, показан русский текст";
  const siteHref = lang === "ru" ? path : `/${lang}${path}`;

  return (
    <Shell user={user} active="content" title={cur.h1 || path} sub={`${path} · ${state}`} flash={sp}
      actions={<><Link className="ad-btn" href={`/admin/content?lang=${lang}`}>← К списку</Link><a className="ad-btn" href={siteHref} target="_blank" rel="noreferrer">Открыть на сайте ↗</a></>}>
      <PageEditor
        lang={lang} path={path} kind={kind} readOnly={!write}
        initial={{ title: cur.title, h1: cur.h1, description: cur.description ?? "", body: cur.body }}
        hasDraft={Boolean(row?.draft)} publishAt={localInput(row?.publish_at)} hidden={Boolean(row?.published?.hidden && !row?.draft)}
        previewTo={siteHref}
      />
      {write && (
        <details className="ad-card">
          <summary>Версии и сброс</summary>
          <div className="ad-tools-row">
            {row?.draft && <form action={pageToolAction}><input type="hidden" name="lang" value={lang} /><input type="hidden" name="path" value={path} /><input type="hidden" name="act" value="discard" /><button className="ad-btn" type="submit">Отбросить черновик</button></form>}
            {row && file && <form action={pageToolAction}><input type="hidden" name="lang" value={lang} /><input type="hidden" name="path" value={path} /><input type="hidden" name="act" value="reset" /><button className="ad-btn ad-btn-warn" type="submit">Вернуть исходный текст сайта</button></form>}
          </div>
          <h3>История публикаций</h3>
          {vers.length === 0 ? <p className="ad-muted">Публикаций из админки пока не было.</p> : (
            <ul className="ad-list">
              {vers.map((v) => (
                <li key={v.id}>
                  <span><b>{fmt(v.at, true)}</b> · {v.by ?? "—"} · {v.note ?? ""}<br /><span className="ad-muted">{v.data.h1}</span></span>
                  <form action={pageToolAction}><input type="hidden" name="lang" value={lang} /><input type="hidden" name="path" value={path} /><input type="hidden" name="act" value="rollback" /><input type="hidden" name="version" value={v.id} /><button className="ad-btn" type="submit">В черновик</button></form>
                </li>
              ))}
            </ul>
          )}
        </details>
      )}
    </Shell>
  );
}
