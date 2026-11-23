"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { demanderPays } from "@/lib/pays-visiteur";

const GEO_KEY = "_sl_geo";
const GEO_TTL = 7 * 24 * 60 * 60 * 1000; // 7 jours

type GeoData = { country: string; countryCode: string; city: string; ts: number };

function getSid() {
  if (typeof window === "undefined") return "";
  let s = sessionStorage.getItem("_sl_sid");
  if (!s) {
    s = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("_sl_sid", s);
  }
  return s;
}

function getProductInfo(pathname: string) {
  if (pathname.startsWith("/ebooks/")) {
    const slug = pathname.slice(8).split("/")[0];
    return { productId: slug, productType: "ebook" };
  }
  if (pathname.match(/^\/formation\/([^/]+)/)) {
    const id = pathname.split("/")[2];
    return { productId: id, productType: "formation" };
  }
  if (pathname.startsWith("/services/")) return { productId: pathname.split("/")[2], productType: "service" };
  if (pathname.startsWith("/accompagnement/")) return { productId: pathname.split("/")[2], productType: "accompagnement" };
  return {};
}

function getCachedGeo(): GeoData | null {
  try {
    const raw = localStorage.getItem(GEO_KEY);
    if (!raw) return null;
    const data: GeoData = JSON.parse(raw);
    if (Date.now() - data.ts > GEO_TTL) { localStorage.removeItem(GEO_KEY); return null; }
    return data;
  } catch { return null; }
}

function setCachedGeo(geo: GeoData) {
  try { localStorage.setItem(GEO_KEY, JSON.stringify(geo)); } catch { /* ignore */ }
}

// Singleton : plusieurs appels simultanés partagent le même fetch (évite les requêtes en double)
let _geoPending: Promise<GeoData> | null = null;

async function fetchClientGeo(): Promise<GeoData> {
  const cached = getCachedGeo();
  if (cached) return cached;

  if (!_geoPending) {
    _geoPending = demanderPays()
      .then((countryCode) => {
        const d = { countryCode };
        if (d.countryCode) {
          const geo: GeoData = { country: d.countryCode, countryCode: d.countryCode, city: d.countryCode, ts: Date.now() };
          setCachedGeo(geo);
          return geo;
        }
        return { country: "??", countryCode: "??", city: "??", ts: Date.now() } as GeoData;
      })
      .catch(() => ({ country: "??", countryCode: "??", city: "??", ts: Date.now() } as GeoData))
      .finally(() => { _geoPending = null; });
  }

  return _geoPending;
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const geoRef = useRef<GeoData | null>(null);

  // Charger la géo une seule fois par session (non bloquant)
  useEffect(() => {
    if (geoRef.current) return;
    fetchClientGeo().then(geo => { geoRef.current = geo; }).catch(() => {});
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const { productId, productType } = getProductInfo(pathname);

    // Si la géo n'est pas encore chargée, attendre 1s max puis envoyer quand même
    const send = (geo: GeoData | null) => {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          productId,
          productType,
          referrer: document.referrer || "",
          sessionId: getSid(),
          utm_source: p.get("utm_source") || undefined,
          utm_medium: p.get("utm_medium") || undefined,
          // Géo fournie par le navigateur — contourne le problème IP serveur
          clientCountry: geo?.country,
          clientCountryCode: geo?.countryCode,
          clientCity: geo?.city,
        }),
      }).catch(() => {});
    };

    if (geoRef.current) {
      send(geoRef.current);
    } else {
      // Attendre que la géo soit disponible (max 3s)
      fetchClientGeo().then(geo => {
        geoRef.current = geo;
        send(geo);
      }).catch(() => send(null));
    }
  }, [pathname]);

  return null;
}
