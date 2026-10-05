import type { Metadata } from "next";
import { LANGS, type Lang } from "./i18n";

const HOME: Record<Lang, { title: string; description: string }> = {
  ru: { title: "Аренда авто для работы в такси в Москве без залога", description: "Дарим первый день аренды бесплатно, новые автомобили без залога, гибкий формат аренды, возможность выкупа." },
  en: { title: "Taxi car rental in Moscow with no deposit", description: "Your first rental day is free: new cars, no deposit, flexible rental and an option to own the car." },
  ky: { title: "Москвада таксиде иштөө үчүн күрөөсүз унаа ижарасы", description: "Ижаранын биринчи күнү бекер, жаңы унаалар күрөөсүз, ыңгайлуу ижара жана сатып алуу мүмкүнчүлүгү." },
  kk: { title: "Мәскеуде таксиде жұмыс істеуге кепілсіз көлік жалға алу", description: "Жалға алудың бірінші күні тегін, жаңа көліктер кепілсіз, икемді жалға алу және сатып алу мүмкіндігі." },
  uz: { title: "Moskvada taksida ishlash uchun garovsiz avtomobil ijarasi", description: "Ijaraning birinchi kuni bepul, yangi avtomobillar garovsiz, qulay ijara va sotib olish imkoniyati." },
};

/** hreflang для страницы path (путь русской версии) */
export function alternates(path: string, lang: Lang) {
  const at = (l: Lang) => (l === "ru" ? path : `/${l}${path === "/" ? "" : path}`);
  return {
    canonical: at(lang),
    languages: Object.fromEntries([...LANGS.map((l) => [l, at(l)]), ["x-default", path]]),
  };
}

export function homeMeta(lang: Lang): Metadata {
  return { title: { absolute: HOME[lang].title }, description: HOME[lang].description, alternates: alternates("/", lang) };
}
