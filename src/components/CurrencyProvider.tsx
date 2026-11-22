"use client";

import { useEffect, useRef } from "react";
import { useCurrencyStore, GEO_CACHE_KEY, COUNTRY_CURRENCY, type CurrencyCode } from "@/lib/currency-store";

const GEO_TTL_MS = 30_000; // 30s — re-détecte si l'IP change (VPN)

interface GeoCache {
  ts: number;
  countryCode: string | null;
}

export default function CurrencyProvider() {
  const { setCurrency, setRates, ratesUpdatedAt } = useCurrencyStore();
  const isFetching = useRef(false);

  // Taux de change — 4h de cache côté client
  useEffect(() => {
    const FOUR_HOURS = 4 * 60 * 60 * 1000;
    if (ratesUpdatedAt && Date.now() - ratesUpdatedAt < FOUR_HOURS) return;
    fetch("/api/currency/rates")
      .then((r) => r.json())
      .then((d) => { if (d.rates) setRates(d.rates); })
      .catch(() => {});
  }, []); // eslint-disable-line

  // Détection GeoIP strictement par IP serveur.
  // TTL 30s : re-détecte si l'IP a changé (VPN activé) sans spammer l'API.
  // Re-lance aussi à chaque regain de focus fenêtre (retour après activation VPN).
  useEffect(() => {
    const detect = async () => {
      // Lit l'état Zustand le plus récent (évite la stale closure)
      const { manuallySet, setCurrency } = useCurrencyStore.getState();
      if (manuallySet) return;
      if (isFetching.current) return;

      // Cache court 30s
      try {
        const raw = sessionStorage.getItem(GEO_CACHE_KEY);
        if (raw) {
          const cached: GeoCache = JSON.parse(raw);
          if (Date.now() - cached.ts < GEO_TTL_MS) {
            if (cached.countryCode) {
              const detected = COUNTRY_CURRENCY[cached.countryCode.toUpperCase()] as CurrencyCode | undefined;
              if (detected) setCurrency(detected, false);
            }
            return;
          }
        }
      } catch { /* sessionStorage indisponible */ }

      isFetching.current = true;
      try {
        const res = await fetch("/api/geo");
        const d = await res.json() as { countryCode?: string | null };
        const cache: GeoCache = { ts: Date.now(), countryCode: d.countryCode ?? null };
        try { sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache)); } catch { /* ignore */ }
        if (!d.countryCode) return;
        const detected = COUNTRY_CURRENCY[d.countryCode.toUpperCase()] as CurrencyCode | undefined;
        if (detected) setCurrency(detected, false);
      } catch { /* réseau */ } finally {
        isFetching.current = false;
      }
    };

    detect(); // détection initiale au montage

    // Re-détection quand l'utilisateur revient sur l'onglet (ex: activation VPN)
    window.addEventListener("focus", detect);
    return () => window.removeEventListener("focus", detect);
  }, []); // eslint-disable-line

  return null;
}
