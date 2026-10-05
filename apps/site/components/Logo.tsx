import { asset } from "@/lib/i18n";

// Логотип Car City: эмблема в круге + надпись из исходного файла (PNG 500 px, вектора пока нет).
export function Logo({ size = 44, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <span className="logo">
      <img src={asset("/brand/emblem-96.webp")} srcSet={`${asset("/brand/emblem-96.webp")} 1x, ${asset("/brand/emblem-192.webp")} 2x`} width={size} height={size} alt="" className="logo-emblem" />
      {wordmark && <img src={asset("/brand/wordmark-320.webp")} width={Math.round(size * 2.9)} height={Math.round(size * 2.9 * 67 / 354)} alt="Car City" className="logo-word" />}
    </span>
  );
}
