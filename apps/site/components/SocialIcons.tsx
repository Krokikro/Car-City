import { useId } from "react";
import { company } from "@/lib/content";

// Значки мессенджеров и YouTube. Telegram, WhatsApp и MAX — оригинальные знаки (контуры из Simple Icons, CC0), в фирменных цветах.
type Kind = "telegram" | "whatsapp" | "max" | "youtube";

const TG = "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z";
const YT = "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z";
// Логотип мессенджера MAX (VK), векторный оригинал из Wikimedia Commons
const MAX_BODY = "M508.211 878.328c-75.007 0-109.864-10.95-170.453-54.75-38.325 49.275-159.686 87.783-164.979 21.9 0-49.456-10.95-91.248-23.36-136.873-14.782-56.21-31.572-118.807-31.572-209.508 0-216.626 177.754-379.597 388.357-379.597 210.785 0 375.947 171.001 375.947 381.604.707 207.346-166.595 376.118-373.94 377.224m3.103-571.585c-102.564-5.292-182.499 65.7-200.201 177.024-14.6 92.162 11.315 204.398 33.397 210.238 10.585 2.555 37.23-18.98 53.837-35.587a189.8 189.8 0 0 0 92.71 33.032c106.273 5.112 197.08-75.794 204.215-181.95 4.154-106.382-77.67-196.486-183.958-202.574Z";
const WA = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";

/** Полные значки: сами рисуют и фон. Размер задаёт обёртка. */
function Brand({ kind }: { kind: Kind }) {
  const gid = useId().replace(/:/g, "");
  switch (kind) {
    case "telegram":
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%">
          <circle cx="12" cy="12" r="10.8" fill="#fff" />
          <path d={TG} fill="#27A7E7" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%">
          <rect width="24" height="24" rx="6.2" fill="#25D366" />
          <path d={WA} fill="#fff" transform="translate(3.6 3.6) scale(.7)" />
        </svg>
      );
    case "max":
      return (
        <svg viewBox="0 0 1000 1000" width="100%" height="100%">
          <defs>
            <linearGradient id={`${gid}a`} x1="117.847" y1="760.536" x2="1000" y2="500" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#4cf" />
              <stop offset=".662" stopColor="#53e" />
              <stop offset="1" stopColor="#93d" />
            </linearGradient>
            <radialGradient id={`${gid}b`} cx="-87.392" cy="1166.116" r="500" fx="-87.392" fy="1166.116" gradientTransform="rotate(51.356 1551.478 559.3) scale(2.42703433 1)" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#00f" />
              <stop offset="1" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1000" height="1000" ry="249.681" fill={`url(#${gid}a)`} />
          <rect width="1000" height="1000" ry="249.681" fill={`url(#${gid}b)`} />
          <path fill="#fff" fillRule="evenodd" d={MAX_BODY} />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 3 24 18" width="100%" height="100%">
          <path d={YT} fill="#F00" />
          <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#fff" />
        </svg>
      );
    default:
      return null;
  }
}

export const SOCIALS: { kind: Kind; label: string; href: string; bg: string }[] = [
  { kind: "telegram", label: "Telegram", href: company.telegram, bg: "#2AABEE" },
  { kind: "whatsapp", label: "WhatsApp", href: company.whatsapp, bg: "#25D366" },
  { kind: "max", label: "MAX", href: company.max, bg: "linear-gradient(135deg,#4cf,#93d)" },
  { kind: "youtube", label: "YouTube", href: company.youtube, bg: "#FF0033" },
];

export function SocialIcon({ kind, size = 44 }: { kind: Kind; size?: number }) {
  const h = kind === "youtube" ? size * 0.75 : size;
  return (
    <span className={`soc-ico soc-brand soc-${kind}`} style={{ width: size, height: h }} aria-hidden="true">
      <Brand kind={kind} />
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
