import { asset } from "@/lib/i18n";

// Логотип Car City: эмблема в круге + надпись из исходного файла (PNG 500 px, вектора пока нет).
// emblem — во сколько раз круглая эмблема больше высоты строки (в шапке она крупнее надписи и стоит по её центру)
export function Logo({ size = 44, wordmark = true, emblem = 1 }: { size?: number; wordmark?: boolean; emblem?: number }) {
  return (
    <span className="logo">
      <img src={asset("/brand/emblem-96.webp")} srcSet={`${asset("/brand/emblem-96.webp")} 1x, ${asset("/brand/emblem-192.webp")} 2x`} width={Math.round(size * emblem)} height={Math.round(size * emblem)} alt="" className="logo-emblem" />
      {wordmark && <img src={asset("/brand/wordmark-320.webp")} width={Math.round(size * 2.9)} height={Math.round(size * 2.9 * 67 / 354)} alt="Car City" className="logo-word" />}
    </span>
  );
}
