import type { Metadata } from "next";
import { allDocs, articles } from "@/lib/docs";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = { title: "Карта сайта", alternates: { canonical: "/sitemap" } };

const GROUPS: [string, (p: string) => boolean][] = [
  ["Разделы", (p) => !/^\/(vykup|klassyi-avtomobilej|novosti)\//.test(p)],
  ["Аренда", (p) => p.startsWith("/klassyi-avtomobilej/")],
  ["Выкуп", (p) => p.startsWith("/vykup/")],
];

export default function Sitemap() {
  const docs = [...allDocs().values()].filter((d) => d.kind !== "article").sort((a, b) => a.path.localeCompare(b.path));
  return (
    <>
      <Header />
      <main id="main" className="pg">
        <section className="art-hero">
          <div className="art-hero-bg" aria-hidden="true" />
          <div className="wrap"><p className="mono eyebrow">Car City</p><h1 className="display-xl" data-split>Карта сайта</h1></div>
        </section>
        <section className="section pg-sec">
          <div className="wrap smap">
            {GROUPS.map(([name, test]) => (
              <div key={name}>
                <h2 className="mono eyebrow">{name}</h2>
                <ul>
                  {name === "Разделы" && <li><a href="/">Главная</a></li>}
                  {docs.filter((d) => test(d.path)).map((d) => <li key={d.path}><a href={d.path}>{d.h1}</a></li>)}
                </ul>
              </div>
            ))}
            <div>
              <h2 className="mono eyebrow">Новости</h2>
              <ul>{articles().map((a) => <li key={a.path}><a href={a.path}>{a.h1}</a></li>)}</ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
