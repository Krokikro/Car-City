#!/usr/bin/env bash
# Облёт машины: исходники Higgsfield (8 с, 4:3) → public/orbit/<slug>.mp4 (960×720, ключевой кадр каждые 4 кадра —
# чтобы ролик можно было крутить пальцем без рывков) + постер <slug>.webp. Потом пишет lib/orbits.ts.
#   scripts/encode-orbits.sh <папка с cc-orbit-<slug>.mp4>
set -euo pipefail
SRC=${1:?папка с исходниками}
cd "$(dirname "$0")/.."
mkdir -p public/orbit
for f in "$SRC"/cc-orbit-*.mp4; do
  slug=$(basename "$f" .mp4); slug=${slug#cc-orbit-}
  [ "$slug" = polo ] && slug=volkswagen-polo-1.6
  out=public/orbit/$slug.mp4
  [ -f "$out" ] && [ "$out" -nt "$f" ] && continue
  ffmpeg -v error -y -i "$f" -vf "scale=960:720:flags=lanczos,eq=contrast=1.04:saturation=1.06" -an -c:v libx264 -preset slow -crf 25 -g 4 -keyint_min 4 -pix_fmt yuv420p -movflags +faststart "$out"
  ffmpeg -v error -y -i "$out" -frames:v 1 -vf scale=960:720 -c:v libwebp -quality 78 "public/orbit/$slug.webp"
  echo "ok $slug $(du -h "$out" | cut -f1)"
done
{
  echo "// Генерируется scripts/encode-orbits.sh — не править руками. Машины, у которых есть ролик облёта камерой."
  printf 'export const orbits = new Set<string>(['
  ls public/orbit/*.mp4 | xargs -n1 basename | sed 's/\.mp4$//' | sed 's/.*/"&"/' | paste -sd, -
  echo ']);'
} > lib/orbits.ts
cat lib/orbits.ts
