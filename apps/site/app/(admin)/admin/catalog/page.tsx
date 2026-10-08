import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { BASE_FLEET, patches } from "@/lib/admin/fleet";
import { fleetClasses } from "@/lib/fleet";
import { carImages } from "@/lib/car-images";
import { saveCarAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Автопарк" };

export default async function Catalog({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "catalog" });
  const write = can(user.role, "catalog", "write");
  const p = await patches();
  return (
    <Shell user={user} active="catalog" title="Автопарк" sub={`${BASE_FLEET.length} моделей. Цена, класс, подпись и показ на сайте. Изменения сразу попадают на главную, в калькулятор и в тарифы.`} flash={sp}>
      <p className="ad-muted">Тексты и таблицы цен на самих страницах моделей правятся в разделе «Контент и SEO». Фотографии машин пока подставляются из кода сайта.</p>
      <div className="ad-cars">
        {BASE_FLEET.map((c) => {
          const o = p.get(c.slug);
          const v = { ...c, ...(o ?? {}) };
          return (
            <form key={c.slug} id={c.slug} action={saveCarAction} className={`ad-car${o?.hidden ? " is-hidden" : ""}`}>
              <input type="hidden" name="slug" value={c.slug} />
              <fieldset disabled={!write}>
                <div className="ad-car-head">
                  <div className="ad-car-img">{carImages[c.slug] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/cars/${c.slug}-640.webp`} alt="" loading="lazy" /> : null}</div>
                  <div><b>{c.name}</b><span className="ad-muted"><code>{c.slug}</code>{o && Object.keys(o).length ? " · изменено" : ""}</span></div>
                </div>
                <div className="ad-car-grid">
                  <label>Название<input name="name" defaultValue={v.name} required /></label>
                  <label>Цена в сутки, ₽<input name="price" type="number" min={500} max={50000} step={1} defaultValue={v.price} required /></label>
                  <label>Класс<select name="cls" defaultValue={v.cls}>{fleetClasses.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select></label>
                  <label>Двигатель<input name="engine" defaultValue={v.engine ?? ""} /></label>
                  <label>Коробка<input name="gearbox" defaultValue={v.gearbox ?? ""} /></label>
                  <label>Плашка<input name="badge" defaultValue={v.badge ?? ""} placeholder="Например, Супер-скидка" /></label>
                </div>
                <div className="ad-car-foot">
                  <label className="ad-check"><input type="checkbox" name="hidden" defaultChecked={Boolean(o?.hidden)} /> Скрыть с сайта (из каталога, калькулятора и тарифов)</label>
                  {write && <button className="ad-btn ad-btn-main" type="submit">Сохранить</button>}
                </div>
              </fieldset>
            </form>
          );
        })}
      </div>
    </Shell>
  );
}
