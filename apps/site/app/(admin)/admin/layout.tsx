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
      <body>{children}</body>
    </html>
  );
}
