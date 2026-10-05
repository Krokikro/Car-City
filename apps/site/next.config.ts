import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

// STATIC_EXPORT=1 — статическая копия для предпросмотра на GitHub Pages (scripts/build-pages.sh):
// без сервера, картинки без оптимизатора, сайт лежит в подпапке NEXT_PUBLIC_BASE_PATH.
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@car-city/i18n"],
  basePath,
  ...(staticExport
    ? { output: "export", trailingSlash: true, images: { unoptimized: true } }
    : {
        images: { formats: ["image/avif", "image/webp"] },
        async headers() {
          return [{ source: "/:path*", headers: securityHeaders }];
        },
      }),
};

export default config;
