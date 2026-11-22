import { NextResponse } from "next/server";

// Cache en mémoire serveur — 4 heures
let cachedRates: Record<string, number> | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 4 * 60 * 60 * 1000;

const NEEDED = ["XAF", "XOF", "USD", "EUR", "CDF", "GNF"];

const FALLBACK = { XAF: 1, XOF: 1, EUR: 0.001524, USD: 0.001667, CDF: 4.70, GNF: 14.3 };

export async function GET() {
  if (cachedRates && Date.now() < cacheExpiry) {
    return NextResponse.json({ rates: cachedRates, source: "cache" });
  }

  // Fournisseur 1 : open.er-api.com (gratuit, sans clé)
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/XAF", {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (data.result === "success" && data.rates) {
      const rates: Record<string, number> = { XAF: 1, XOF: 1 };
      for (const key of NEEDED) {
        if (data.rates[key]) rates[key] = data.rates[key];
      }
      cachedRates = rates;
      cacheExpiry = Date.now() + CACHE_TTL;
      return NextResponse.json({ rates, source: "live" });
    }
  } catch { /* essayer suivant */ }

  // Fournisseur 2 : frankfurter.app (base EUR)
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=EUR&to=XAF,USD,CDF,GNF`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    if (data.rates?.XAF) {
      const xafPerEur: number = data.rates.XAF;
      const rates: Record<string, number> = {
        XAF: 1,
        XOF: 1,
        EUR: 1 / xafPerEur,
        USD: data.rates.USD ? data.rates.USD / xafPerEur : FALLBACK.USD,
        CDF: data.rates.CDF ? data.rates.CDF / xafPerEur : FALLBACK.CDF,
        GNF: data.rates.GNF ? data.rates.GNF / xafPerEur : FALLBACK.GNF,
      };
      cachedRates = rates;
      cacheExpiry = Date.now() + CACHE_TTL;
      return NextResponse.json({ rates, source: "live-eur" });
    }
  } catch { /* fallback */ }

  return NextResponse.json({ rates: FALLBACK, source: "fallback" });
}
