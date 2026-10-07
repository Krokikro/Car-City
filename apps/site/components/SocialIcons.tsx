import { company } from "@/lib/content";

// Значки мессенджеров и YouTube. Цвет фона кружка — фирменный цвет сервиса, сам знак белый.
type Kind = "telegram" | "whatsapp" | "max" | "youtube";

const PATHS: Record<Kind, React.ReactNode> = {
  telegram: <path d="M5.3 11.6 17.6 6.9c.6-.2 1.1.1.9 1l-2.1 9.9c-.1.7-.6.9-1.2.5l-3.2-2.4-1.5 1.5c-.2.2-.3.3-.7.3l.2-3.3 6-5.4c.3-.2-.1-.4-.4-.2L8.2 13.5 5 12.5c-.7-.2-.7-.7.3-.9z" fill="#fff" />,
  whatsapp: (
    <>
      <path d="M12 4.2a7.7 7.7 0 0 0-6.6 11.7L4.3 19.8l4-1.1A7.7 7.7 0 1 0 12 4.2z" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9.4 8.6c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .5.4l.7 1.6c.1.2 0 .4-.1.5l-.4.5c-.1.1-.2.3 0 .5.3.5.8 1.1 1.3 1.5.6.5 1.1.7 1.4.8.2.1.3 0 .4-.1l.6-.7c.1-.2.3-.2.5-.1l1.5.7c.2.1.4.2.4.3 0 .2 0 .9-.4 1.3-.3.4-1 .8-1.6.8-.6 0-1.3-.1-2.6-.7-1.5-.7-2.8-2.1-3.4-3.1-.5-.9-.6-1.6-.6-2 .1-.6.4-1.3.8-1.8z" fill="#fff" />
    </>
  ),
  max: <path d="M7 16.5V8.2c0-.5.6-.8 1-.4l4 4.1 4-4.1c.4-.4 1-.1 1 .4v8.3" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  youtube: <path d="M10 8.8v6.4l5.6-3.2z" fill="#fff" />,
};

export const SOCIALS: { kind: Kind; label: string; href: string; bg: string }[] = [
  { kind: "telegram", label: "Telegram", href: company.telegram, bg: "#2AABEE" },
  { kind: "whatsapp", label: "WhatsApp", href: company.whatsapp, bg: "#25D366" },
  { kind: "max", label: "MAX", href: company.max, bg: "linear-gradient(135deg,#4C6FFF,#9B4DFF)" },
  { kind: "youtube", label: "YouTube", href: company.youtube, bg: "#FF0033" },
];

export function SocialIcon({ kind, size = 44 }: { kind: Kind; size?: number }) {
  const s = SOCIALS.find((x) => x.kind === kind)!;
  return (
    <span className="soc-ico" style={{ width: size, height: size, background: s.bg }} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62}>{PATHS[kind]}</svg>
    </span>
  );
}

/** Ряд круглых значков-ссылок. only — какие показать (по умолчанию все). */
export function SocialRow({ only, size = 48, className = "" }: { only?: Kind[]; size?: number; className?: string }) {
  const list = only ? SOCIALS.filter((s) => only.includes(s.kind)) : SOCIALS;
  return (
    <ul className={`soc-row ${className}`}>
      {list.map((s) => (
        <li key={s.kind}>
          <a href={s.href} target="_blank" rel="noopener" aria-label={s.label} title={s.label} className="soc-link">
            <SocialIcon kind={s.kind} size={size} />
          </a>
        </li>
      ))}
    </ul>
  );
}
