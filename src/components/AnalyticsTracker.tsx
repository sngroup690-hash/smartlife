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
          // La ville est retrouvée par le serveur : le navigateur ne connaît que le pays
          const geo: GeoData = { country: d.countryCode, countryCode: d.countryCode, city: "", ts: Date.now() };
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
    // Les visites de Frank et de l'équipe ne comptent pas : un appareil passé par l'administration
    // (ou ouvert une fois avec ?moi=1) est retenu et ses visites ne sont plus enregistrées.
    try {
      const p0 = new URLSearchParams(window.location.search);
      if (pathname.startsWith("/admin") || p0.get("moi") === "1") localStorage.setItem("_sl_moi", "1");
      if (p0.get("moi") === "0") localStorage.removeItem("_sl_moi");
      if (localStorage.getItem("_sl_moi") === "1") return;
    } catch { /* stockage indisponible : on compte normalement */ }
    if (["localhost", "127.0.0.1"].includes(window.location.hostname)) return;

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
