import { company } from "@/lib/content";
import { CityScene } from "./CityScene";

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="mono">Аренда и выкуп · {company.city}</p>
        <h1 id="hero-title" className="display-xl">
          Машина под&nbsp;такси сегодня. Своя&nbsp;— через выкуп
        </h1>
        <p className="lead">
          Эконом, Комфорт, Комфорт+, Бизнес и Грузовой. Первый день бесплатно, новые машины без залога, комиссия парка 4%.
        </p>
        <div className="row">
          <a href="#zayavka" className="btn btn-primary">Оставить заявку</a>
          <a href="#kalkulyator" className="btn btn-ghost">Посчитать доход</a>
        </div>
        <p className="mono hero-fact">
          {company.fleet} машин в парке · {company.boughtOut} водителей уже выкупили свою
        </p>
      </div>
      <div className="hero-media media-window">
        <CityScene />
      </div>
    </section>
  );
}
