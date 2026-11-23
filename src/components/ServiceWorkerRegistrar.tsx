"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // En local (développement), les fichiers gardent le même nom d'une modification à l'autre :
    // le cache du site servirait l'ancienne version et cacherait les changements.
    // On le désactive donc en local (et on retire celui déjà installé). En ligne, il reste actif.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      if ("caches" in window) {
        caches.keys().then((cles) => cles.filter((c) => c.startsWith("sl-")).forEach((c) => caches.delete(c))).catch(() => {});
      }
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {});
  }, []);

  return null;
}
