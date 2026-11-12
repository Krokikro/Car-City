// Замены графики из админки, доступные и серверу, и браузеру (как цены и тексты):
// a — «исходный путь файла → /media/{id}», g — галереи машин (скрытые кадры и добавленные фото).
// Сервер берёт из базы (overlay → setMediaLive), браузер — из <script id="cc-media"> в <head>.

export interface GalleryExtra { id: string; big: string; thumb: string; alt?: string }
export interface CarGallery { hide?: string[]; extra?: GalleryExtra[] }
export interface MediaLive { a: Record<string, string>; g: Record<string, CarGallery> }

const g = globalThis as typeof globalThis & { __ccMedia?: MediaLive };
let client: MediaLive | null = null;
const EMPTY: MediaLive = { a: {}, g: {} };

export function mediaLive(): MediaLive {
  if (typeof document !== "undefined") {
    if (!client) {
      try { client = { ...EMPTY, ...JSON.parse(document.getElementById("cc-media")?.textContent || "{}") }; } catch { client = EMPTY; }
    }
    return client!;
  }
  return g.__ccMedia ?? EMPTY;
}
export function setMediaLive(v: Partial<MediaLive>) { g.__ccMedia = { a: v.a ?? {}, g: v.g ?? {} }; }
export const mediaJson = () => JSON.stringify(mediaLive()).replace(/</g, "\\u003c");
/** Замена для файла из public/, если её загрузили в админке */
export const replaced = (path: string): string | undefined => mediaLive().a[path];
