import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { BASE_FLEET, patches } from "@/lib/admin/fleet";
import { fleetClasses } from "@/lib/fleet";
import { carImages } from "@/lib/car-images";
import { saveCarAction, saveHomeFleetAction } from "../actions";
import { HomeFleetOrder } from "@/components/admin/HomeFleetOrder";
import { LIM } from "@/lib/admin/limits";
import Link from "next/link";
import { getSetting } from "@/lib/admin/store";
import { fileRowsFor, type PriceTables } from "@/lib/prices";
import type { FleetCar } from "@/lib/fleet";
import { PriceEditor, type Model } from "@/components/admin/PriceEditor";
import { savePricesAction } from "../actions-prices";
import { CarPhotos } from "@/components/admin/CarPhotos";
import { familyById, recommend } from "@/lib/media/families";
import type { CarGallery } from "@/lib/media/live";

export const dynamic = "force-dynamic";
export const metadata = { title: "Автопарк" };

export default async function Catalog({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; tab?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "catalog" });
  const write = can(user, "catalog", "write");
  const p = await patches();
  const tab = sp.tab === "rent" || sp.tab === "buy" ? sp.tab : "cards";
  const tables = ((await getSetting<PriceTables>("prices")) ?? {}) as PriceTables;
  const clsName = Object.fromEntries(fleetClasses.map((k) => [k.id, k.name]));
  const models = (kind: "rent" | "buy"): Model[] => BASE_FLEET
    .map((c) => ({ ...c, ...(p.get(c.slug) ?? {}) }) as FleetCar)
    .filter((c) => !p.get(c.slug)?.hidden && (kind === "rent" ? Boolean(c.rent && c.rent !== c.buy) : Boolean(c.buy)))
    .map((c) => {
      const t = tables[c.slug];
      const own = kind === "rent" ? t?.rent : t?.buy;
      const file = fileRowsFor(c, kind).map((r) => ({ k: r.k, p: r.p, ...(r.o ? { o: r.o } : {}), ...(kind === "buy" ? { dep: r.dep ?? 0 } : {}) }));
      return { slug: c.slug, name: c.name, cls: c.cls, clsName: clsName[c.cls] ?? c.cls, rows: own ?? file, file, custom: Boolean(own), disp: (kind === "rent" ? t?.rentDisp : t?.buyDisp) ?? "auto" };
    });
  const SCHED = { rent: ["7/0", "6/1", "5/2", "1–2 дней", "3–7 дней", "8–15 дней", "16–29 дней", "от 30 дней"], buy: ["1 год", "1,5 года", "2 года", "3 года"] };
  const assets = ((await getSetting<Record<string, string>>("assets")) ?? {}) as Record<string, string>;
  const gallery = ((await getSetting<Record<string, CarGallery>>("carGallery")) ?? {}) as Record<string, CarGallery>;
  const slot = (key: string, label?: string) => {
    const f = familyById(key, "image");
    if (!f) return null;
    const pv = f.variants.find((v) => v.fmt === "webp" && (v.w ?? 0) <= 700) ?? f.variants[0];
    return { k: f.key, kind: "image" as const, label: label ?? f.label.replace(/^.+? — /, ""), rec: recommend(f), preview: assets[pv.path] ?? pv.path, replaced: f.variants.some((v) => assets[v.path]), accept: "image/jpeg,image/png,image/webp,image/avif" };
  };
  const SHOT_NAMES: Record<string, string> = { front: "Спереди", rear: "Сзади", side: "Сбоку", interior: "Салон" };
  const photos = (slug: string) => ({
    main: [slot(`/cars/${slug}`, "В каталоге — тёмная версия"), slot(`/cars-light/${slug}`, "В каталоге — светлая версия"), slot(`/cars/${slug}-lit`, "Свет фар при наведении")].filter((x) => x !== null),
    shots: (["front", "rear", "side", "interior"] as const).map((k) => { const sl = slot(`/cars/${slug}-${k}`, `Галерея: ${SHOT_NAMES[k].toLowerCase()}`); return sl ? { ...sl, shot: k, hidden: Boolean(gallery[slug]?.hide?.includes(k)) } : null; }).filter((x) => x !== null),
    extras: (gallery[slug]?.extra ?? []).map((x) => ({ id: x.id, thumb: x.thumb, alt: x.alt })),
  });
  const TABS: [string, string][] = [["cards", "Карточки машин"], ["rent", "Цены: аренда"], ["buy", "Цены: выкуп"]];
  return (
    <Shell user={user} active="catalog" title="Автопарк и цены" sub={tab === "cards" ? `${BASE_FLEET.length} моделей: название, класс, характеристики, плашка, фото и показ на сайте. Цены — на вкладках «Цены».` : tab === "rent" ? "Цена аренды в сутки по графикам работы (у грузовых — по сроку аренды). Самая низкая строка — цена «от» в каталоге и калькуляторе." : "Платёж в сутки по сроку выкупа и первоначальный взнос. Самая низкая строка — цена «от» на страницах выкупа."} flash={sp}
      actions={<>
        <a className="pnl-btn" href={tab === "buy" ? "/vykup" : "/#avtopark"} target="_blank" rel="noreferrer">Посмотреть на сайте ↗</a>
        {write && tab !== "cards" && <><span className="pnl-sep" aria-hidden="true" /><button className="pnl-btn pnl-btn-main" type="submit" form="prices-form">Сохранить цены</button></>}
      </>}>
      <div className="pnl-tabs pnl-tabs-line">{TABS.map(([k, n]) => <Link key={k} href={`/admin/catalog?tab=${k}`} className={tab === k ? "on" : ""}>{n}</Link>)}</div>
      {tab !== "cards" && (
        <>
          <form id="prices-form" action={savePricesAction} />
          <PriceEditor key={tab} kind={tab} models={models(tab)} suggest={SCHED[tab]} formId="prices-form" canWrite={write} />
        </>
      )}
      {tab === "cards" && <>
      <HomeFleetOrder
        all={BASE_FLEET.filter((c) => !p.get(c.slug)?.hidden).map((c) => ({ slug: c.slug, name: { ...c, ...(p.get(c.slug) ?? {}) }.name, cls: { ...c, ...(p.get(c.slug) ?? {}) }.cls }))}
        initial={[...BASE_FLEET].filter((c) => !p.get(c.slug)?.hidden).map((c) => ({ slug: c.slug, pos: p.get(c.slug)?.featured ?? c.featured ?? 0 })).filter((x) => x.pos > 0).sort((a, b) => a.pos - b.pos).map((x) => x.slug)}
        action={saveHomeFleetAction}
        canWrite={write}
      />

      <div className="pnl-cars">
        {BASE_FLEET.map((c) => {
          const o = p.get(c.slug);
          const v = { ...c, ...(o ?? {}) };
          return (
            <form key={c.slug} id={c.slug} action={saveCarAction} className={`pnl-car${o?.hidden ? " is-hidden" : ""}`}>
              <input type="hidden" name="slug" value={c.slug} />
              <fieldset disabled={!write}>
                <div className="pnl-car-head">
                  <div className="pnl-car-img">{carImages[c.slug] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={assets[`/cars/${c.slug}-640.webp`] ?? `/cars/${c.slug}-640.webp`} alt="" loading="lazy" /> : null}</div>
                  <div><b>{c.name}</b><span className="pnl-muted"><code>{c.slug}</code>{o && Object.keys(o).length ? " · изменено" : ""}</span></div>
                </div>
                <div className="pnl-car-grid">
                  <label>Название<input name="name" defaultValue={v.name} required maxLength={LIM.carName} /></label>
                  <label>Класс<select name="cls" defaultValue={v.cls}>{fleetClasses.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select></label>
                  <label>Двигатель<input name="engine" defaultValue={v.engine ?? ""} maxLength={LIM.engine} placeholder="1,6 л" /></label>
                  <label>Коробка<input name="gearbox" defaultValue={v.gearbox ?? ""} maxLength={LIM.gearbox} placeholder="Автомат" /></label>
                  <label>Плашка<input name="badge" defaultValue={v.badge ?? ""} placeholder="Например, Супер-скидка" maxLength={LIM.badge} /></label>
                  <input type="hidden" name="featured" value={String(v.featured ?? 0)} />
                </div>
                {carImages[c.slug] && <CarPhotos slug={c.slug} canWrite={write} {...photos(c.slug)} />}
                <div className="pnl-car-foot">
                  <label className="pnl-check"><input type="checkbox" name="hidden" defaultChecked={Boolean(o?.hidden)} /> Скрыть с сайта (из каталога, калькулятора и тарифов)</label>
                  {write && <button className="pnl-btn pnl-btn-main" type="submit">Сохранить</button>}
                </div>
              </fieldset>
            </form>
          );
        })}
      </div>
      </>}
    </Shell>
  );
}
