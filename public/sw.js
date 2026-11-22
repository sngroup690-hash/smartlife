/* Service Worker – SMART LIFE */

const SHELL_CACHE = "sl-shell-v4";
const DATA_CACHE = "sl-data-v4";

/* Routes qui NE doivent jamais être interceptées (paiement, téléchargement, auth) */
const NETWORK_ONLY = [
  "/api/payment",
  "/api/webhook",
  "/api/download",
  "/api/download-token",
  "/api/formation-token",
  "/api/formation/",
  "/api/admin",
  "/api/user/",
  "/api/demandes/",
  "/api/candidatures/",
  "/api/reviews",
  "/checkout",
];

/* API de contenu : network-first, cache en repli offline seulement */
const DATA_APIS = [
  "/api/ebooks",
  "/api/formations",
  "/api/espaces",
  "/api/consultants",
  "/api/about-config",
  "/api/announcement",
  "/api/temoignages",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(["/mon-espace"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* Message depuis l'admin pour invalider le cache catalogue */
self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_DATA_CACHE") {
    caches.delete(DATA_CACHE).then(() => {
      caches.open(DATA_CACHE); // recrée le cache vide
    });
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Ignorer les requêtes cross-origin */
  if (url.origin !== self.location.origin) return;
  /* Ignorer les méthodes non-GET */
  if (request.method !== "GET") return;

  /* Jamais intercepter les routes sensibles */
  if (NETWORK_ONLY.some((p) => url.pathname.startsWith(p))) return;

  /* Cache-first pour les assets statiques immutables de Next.js */
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  /* Network-first pour les API de contenu — cache uniquement si autorisé */
  if (DATA_APIS.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && !res.headers.get("cache-control")?.includes("no-store")) {
            const clone = res.clone();
            caches.open(DATA_CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  /* Network-first pour les navigations HTML */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/mon-espace"))
        )
    );
    return;
  }

  /* Repli réseau → cache pour tout le reste */
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && url.pathname.startsWith("/_next/")) {
          const clone = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});
