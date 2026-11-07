import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata = { title: "Страница не найдена", robots: { index: false, follow: true } };

// 404: понятная страница с переходами в основные разделы. В журнал 404 пишет сама страница перед notFound()
// (этот компонент React отрисовывает заранее для каждой страницы, поэтому логировать здесь нельзя).
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="section nf">
        <div className="wrap nf-in">
          <p className="nf-code" aria-hidden="true">404</p>
          <h1 className="display">Такой страницы нет</h1>
          <p className="lead">Возможно, адрес изменился. Загляните в основные разделы или позвоните нам.</p>
          <nav className="nf-links" aria-label="Основные разделы">
            <a className="btn btn-primary" href="/">На главную</a>
            <a className="btn btn-ghost" href="/#avtopark">Автопарк</a>
            <a className="btn btn-ghost" href="/vykup">Выкуп</a>
            <a className="btn btn-ghost" href="/novosti">Статьи</a>
            <a className="btn btn-ghost" href="/contact">Контакты</a>
          </nav>
        </div>
      </main>
      <Footer />
    </>
  );
}
