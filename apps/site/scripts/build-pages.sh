#!/usr/bin/env bash
# Статическая копия сайта для предпросмотра на GitHub Pages: https://krokikro.github.io/Car-City/
# Сервера там нет, поэтому API заявок и лаборатория на время сборки убираются,
# а форма работает в демо-режиме (NEXT_PUBLIC_STATIC_DEMO=1).
#   bash scripts/build-pages.sh            → собрать в out/
#   bash scripts/build-pages.sh --push     → собрать и выложить в ветку gh-pages
set -euo pipefail
cd "$(dirname "$0")/.."
SITE="$PWD"
BASE="${PAGES_BASE:-/Car-City}"
STASH="$(mktemp -d)"
restore() { for d in api lab; do if [ -d "$STASH/$d" ]; then mv "$STASH/$d" "$SITE/app/$d"; fi; done; rmdir "$STASH"; }
trap restore EXIT
for d in api lab; do [ -d "app/$d" ] && mv "app/$d" "$STASH/$d"; done
rm -rf .next out
STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH="$BASE" NEXT_PUBLIC_STATIC_DEMO=1 npx next build
touch out/.nojekyll
cp out/404/index.html out/404.html 2>/dev/null || true
echo "Готово: $(find out -name '*.html' | wc -l) страниц в out/"

if [ "${1:-}" = "--push" ]; then
  REPO="$(git rev-parse --show-toplevel)"
  SHA="$(git rev-parse --short HEAD)"
  TMP="$(mktemp -d)"
  cp -r out/. "$TMP/"
  pushd "$TMP" >/dev/null
  git init -q -b gh-pages
  git add -A
  git -c user.name="Car City preview" -c user.email="noreply@car-city.pro" commit -qm "Предпросмотр сайта ($SHA)"
  git push -f "$(git -C "$REPO" remote get-url origin)" gh-pages:gh-pages
  popd >/dev/null
  rm -rf "$TMP"
fi
