# Car City — сайт и админка

Новый car-city.pro: аренда машин под такси и выкуп в Москве. Спецификация — PRD (Claude Doc в проекте).

## Структура

- `apps/site` — сайт на Next.js (App Router, SSG). Главная, заявка `/api/lead`.
- `packages/tokens` — дизайн-токены v0.2 (CSS и JSON). Жёлтый из логотипа `#FFB700`.
- `packages/i18n` — языки: ru в корне, ky, kk, uz, en в подпапках. Язык публикуется только после вычитки носителем.
- `apps/admin`, `apps/api` — следующий этап.

## Запуск

```bash
pnpm install
pnpm --filter @car-city/site dev     # http://localhost:3000
pnpm --filter @car-city/site build
```

`?gfx=full|light|basic` в адресе принудительно включает уровень графики.

## Фото машин

Источник — действующий car-city.pro (`/assets/components/phpthumbof/cache/`, имена файлов в `apps/site/lib/content.ts`, поле `src`).
Положите исходники в папку и выполните:

```bash
cd apps/site && pnpm add -D sharp && node scripts/optimize-cars.mjs ../../car-photos
```

Скрипт делает AVIF и WebP в ширинах 480 и 800 и записывает размеры в `lib/car-images.ts`. Пока фото нет, карточка рисует силуэт.
