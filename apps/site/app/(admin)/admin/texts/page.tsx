import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { fieldsOf, SCREENS, screenOf } from "@/lib/admin/text-bundles";
import { q } from "@/lib/db";
import { fmt } from "@/lib/admin/format";
import type { Lang } from "@/lib/i18n";
import { rollbackTextsAction, saveTextsAction } from "../actions-site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Тексты сайта" };

const LANG_NAMES: Record<string, string> = { ru: "Русский", en: "English", ky: "Кыргызча", kk: "Қазақша", uz: "O‘zbekcha" };

export default async function Texts({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; s?: string; lang?: string; only?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const visible = SCREENS.filter((s) => can(user, s.section, "read"));
  if (!visible.length) redirect("/admin?denied=1");
  const sc = screenOf(sp.s ?? "") && visible.some((v) => v.id === sp.s) ? screenOf(sp.s!)! : visible[0];
  const write = can(user, sc.section, "write");
  const lang = (sc.langs as readonly string[]).includes(sp.lang ?? "") ? (sp.lang as Lang) : sc.langs[0];
  const ids = sc.bundles.map((b) => b.id);
  const rows = await q<{ bundle: string; published: Record<string, string> | null; draft: Record<string, string> | null; updated_at: string; updated_by: string | null }>(
    "SELECT bundle, published, draft, updated_at, updated_by FROM texts WHERE lang=$1 AND bundle = ANY($2)", [lang, ids],
  );
  const byB = new Map(rows.map((r) => [r.bundle, r]));
  const hasDraft = rows.some((r) => r.draft);
  const vers = await q<{ id: string; bundle: string; at: string; by: string | null; n: number }>(
    "SELECT id::text, bundle, at, by, (SELECT count(*) FROM jsonb_object_keys(data))::int AS n FROM text_versions WHERE lang=$1 AND bundle = ANY($2) ORDER BY id DESC LIMIT 15", [lang, ids],
  );
  const last = rows.map((r) => r.updated_at).sort().pop();

  // поля по группам
  const groups = new Map<string, { bundle: string; path: string; label: string; max: number; multiline: boolean; def: string; value: string; changed: boolean; draft: boolean }[]>();
  let changedN = 0;
  for (const b of sc.bundles) {
    const row = byB.get(b.id);
    for (const fl of fieldsOf(b)) {
      const def = fl.def[lang] ?? fl.def.ru ?? "";
      const pub = row?.published?.[fl.path];
      const dr = row?.draft ? row.draft[fl.path] : undefined;
      const value = row?.draft ? (dr ?? def) : (pub ?? def);
      const changed = value !== def;
      if (changed) changedN++;
      if (sp.only === "changed" && !changed) continue;
      (groups.get(fl.group) ?? groups.set(fl.group, []).get(fl.group)!).push({ bundle: b.id, path: fl.path, label: fl.label, max: fl.max, multiline: fl.multiline, def, value, changed, draft: Boolean(row?.draft) && dr !== pub });
    }
  }

  return (
    <Shell user={user} active={sc.section === "pages" ? "texts-home" : "texts"} title={`Тексты: ${sc.title}`} sub={sc.sub} flash={sp}>
      <div className="pnl-tools">
        <div className="pnl-tabs">{visible.map((s) => <Link key={s.id} href={`/admin/texts?s=${s.id}`} className={s.id === sc.id ? "on" : ""}>{s.title}</Link>)}</div>
        {sc.langs.length > 1 && <div className="pnl-tabs">{sc.langs.map((l) => <Link key={l} href={`/admin/texts?s=${sc.id}&lang=${l}`} className={l === lang ? "on" : ""}>{LANG_NAMES[l]}</Link>)}</div>}
      </div>
      <p className="pnl-muted">
        У каждого поля указан предел символов: больше ввести нельзя, чтобы текст не ломал вёрстку. Пустое поле — вернётся исходный текст.
        Изменено полей: <b>{changedN}</b>{last ? ` · последнее сохранение ${fmt(last, true)}` : ""}. <Link href={`/admin/texts?s=${sc.id}&lang=${lang}${sp.only ? "" : "&only=changed"}`}>{sp.only ? "Показать все поля" : "Показать только изменённые"}</Link>
        {lang !== "ru" && " Переводы публикуйте после вычитки носителем языка."}
      </p>
      {hasDraft && <p className="pnl-msg pnl-warn">Есть неопубликованный черновик: в полях показан он. На сайте пока опубликованная версия.</p>}
      <form action={saveTextsAction} className="pnl-form pnl-texts">
        <input type="hidden" name="screen" value={sc.id} />
        <input type="hidden" name="lang" value={lang} />
        <fieldset disabled={!write} className="pnl-plain">
          {[...groups].map(([g, fields]) => (
            <details key={g} className="pnl-card pnl-tgroup" open={groups.size <= 3 || fields.some((x) => x.changed)}>
              <summary><b>{g}</b> <span className="pnl-muted">{fields.length} полей{fields.some((x) => x.changed) ? ` · изменено ${fields.filter((x) => x.changed).length}` : ""}</span></summary>
              <div className="pnl-tfields">
                {fields.map((x) => {
                  const name = `f:${x.bundle}:${x.path}`;
                  return (
                    <label key={name} className={`pnl-tfield${x.changed ? " is-changed" : ""}${x.multiline ? " wide" : ""}`}>
                      <span className="pnl-tlabel">{x.label}{x.changed && <em className="st st-qual">изменено</em>}{x.draft && <em className="st st-call">черновик</em>}</span>
                      {x.multiline
                        ? <textarea name={name} defaultValue={x.value} maxLength={x.max} rows={Math.min(8, Math.max(2, Math.ceil(x.max / 110)))} placeholder={x.def} data-default={x.def} />
                        : <input name={name} defaultValue={x.value} maxLength={x.max} placeholder={x.def} data-default={x.def} />}
                      {x.changed && <small className="pnl-tdef">Исходный: {x.def} <button type="button" className="pnl-link-btn" data-reset={name}>вернуть</button></small>}
                    </label>
                  );
                })}
              </div>
            </details>
          ))}
          {write && (
            <div className="pnl-publish-bar">
              <button className="pnl-btn" type="submit" name="intent" value="draft">Сохранить черновик</button>
              <button className="pnl-btn pnl-btn-main" type="submit" name="intent" value="publish">Опубликовать</button>
              {hasDraft && <button className="pnl-btn pnl-btn-warn" type="submit" name="intent" value="discard" formNoValidate>Отбросить черновик</button>}
              <a className="pnl-btn" href={lang === "ru" ? "/" : `/${lang}`} target="_blank" rel="noreferrer">Открыть сайт ↗</a>
            </div>
          )}
        </fieldset>
      </form>
      {vers.length > 0 && (
        <details className="pnl-card">
          <summary>История публикаций</summary>
          <ul className="pnl-list">
            {vers.map((v) => (
              <li key={v.id}>
                <span><b>{fmt(v.at, true)}</b> · {v.by ?? "—"} · {v.bundle} · изменённых полей: {v.n}</span>
                {write && <form action={rollbackTextsAction}><input type="hidden" name="screen" value={sc.id} /><input type="hidden" name="id" value={v.id} /><button className="pnl-btn pnl-btn-sm" type="submit">В черновик</button></form>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Shell>
  );
}
