// Три уровня графики (PRD 3.4 и 7.1). Уровень выбирается до первой отрисовки
// и пишется в <html data-gfx>, чтобы CSS и ленивые модули знали, что можно грузить.
//   full  — 3D, скролл-сцены, переходы (мощное устройство, быстрая сеть)
//   light — CSS-анимации и секвенция кадров в герое
//   basic — статика: слабый Android, экономия трафика, prefers-reduced-motion

export type GfxLevel = "full" | "light" | "basic";

/** Инлайн-скрипт для <head>. Без зависимостей, выполняется до гидрации. */
export const gfxDetectScript = `(function(){try{
var n=navigator,d=document.documentElement,c=n.connection||{};
var mem=n.deviceMemory||4,cpu=n.hardwareConcurrency||4;
var slowNet=c.saveData||/(^|-)2g|3g/.test(c.effectiveType||"");
var rm=matchMedia("(prefers-reduced-motion: reduce)").matches;
var lvl=(rm||slowNet||mem<=2||cpu<=2)?"basic":(mem>=4&&cpu>=6)?"full":"light";
var o=/[?&]gfx=(full|light|basic)/.exec(location.search);if(o)lvl=o[1];
d.dataset.gfx=lvl;}catch(e){document.documentElement.dataset.gfx="basic";}})();`;
