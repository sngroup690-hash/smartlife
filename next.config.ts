import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === "development" && {
    allowedDevOrigins: ["192.168.4.190"],
  }),
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    deviceSizes: [360, 480, 640, 828, 1080, 1200, 1920],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http",  hostname: "**" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "1300mb",
    },
  },
  async headers() {
    return [
      {
        // Pages d'authentification et espace personnel — jamais de bfcache Safari
        // Cache-Control: no-store empêche Safari de restaurer une version obsolète
        // via bfcache (cause principale de la boucle de connexion sur iPhone)
        source: "/(login|register|mon-espace|dashboard)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
      {
        // Images uploadées — cache long avec revalidation conditionnelle (ETag/Last-Modified)
        // Les URLs ont déjà un ?v=timestamp pour invalider le cache quand nécessaire
        source: "/(covers|banners|espace-covers|formation-covers|desc-images|pack-banners|about|uploads)/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        // Vidéos et PDF — pas de cache agressif car fichiers lourds
        source: "/(espace-videos|promo-videos|pdf-previews|how-to-buy|product-videos)/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
