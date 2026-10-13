import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: { default: "Админка Car City", template: "%s · Админка Car City" },
  robots: { index: false, follow: false, nocache: true },
};

// Свой корневой layout: админка не наследует оформление, шрифты и скрипты сайта.
export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        {children}
        <noscript><p style={{ padding: 24, font: "16px system-ui" }}>Для работы админки включите JavaScript в браузере.</p></noscript>
      </body>
    </html>
  );
}
