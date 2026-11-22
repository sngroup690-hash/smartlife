import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CurrencyCode = "XAF" | "XOF" | "USD" | "EUR" | "CDF" | "GNF";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  decimals: number;
  position: "before" | "after";
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  XAF: { code: "XAF", symbol: "FCFA", name: "Franc CFA (CEMAC)",  flag: "🇨🇲", decimals: 0, position: "after"  },
  XOF: { code: "XOF", symbol: "FCFA", name: "Franc CFA (UEMOA)",  flag: "🇸🇳", decimals: 0, position: "after"  },
  USD: { code: "USD", symbol: "$",    name: "Dollar américain",    flag: "🇺🇸", decimals: 2, position: "before" },
  EUR: { code: "EUR", symbol: "€",    name: "Euro",                flag: "🇪🇺", decimals: 2, position: "after"  },
  CDF: { code: "CDF", symbol: "FC",   name: "Franc Congolais",     flag: "🇨🇩", decimals: 0, position: "after"  },
  GNF: { code: "GNF", symbol: "GNF",  name: "Franc Guinéen",       flag: "🇬🇳", decimals: 0, position: "after"  },
};

// Country code → currency auto-detection
export const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  // ── CEMAC (Franc CFA BEAC – XAF) ─────────────────────────────────────────
  CM: "XAF", // Cameroun
  CF: "XAF", // République Centrafricaine
  CG: "XAF", // Congo-Brazzaville
  TD: "XAF", // Tchad
  GQ: "XAF", // Guinée Équatoriale
  GA: "XAF", // Gabon

  // ── UEMOA (Franc CFA BCEAO – XOF) ────────────────────────────────────────
  BJ: "XOF", // Bénin
  BF: "XOF", // Burkina Faso
  CI: "XOF", // Côte d'Ivoire
  GW: "XOF", // Guinée-Bissau
  ML: "XOF", // Mali
  NE: "XOF", // Niger
  SN: "XOF", // Sénégal
  TG: "XOF", // Togo

  // ── Autres ────────────────────────────────────────────────────────────────
  US: "USD",
  GB: "USD",
  CA: "USD",
  AU: "USD",
  FR: "EUR",
  DE: "EUR",
  BE: "EUR",
  CH: "EUR",
  IT: "EUR",
  ES: "EUR",
  PT: "EUR",
  NL: "EUR",
  CD: "CDF", // RD Congo
  GN: "GNF", // Guinée Conakry
};

// Taux de secours (mis à jour manuellement, utilisés si l'API échoue)
// Base: 1 XAF = ?
export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  XAF: 1,
  XOF: 1,           // parité exacte avec XAF
  EUR: 0.001524,    // 1 EUR ≈ 655.957 XAF (taux fixe)
  USD: 0.001667,    // 1 USD ≈ 600 XAF (approx)
  CDF: 4.70,        // 1 CDF ≈ 0.21 XAF → 1 XAF ≈ 4.70 CDF
  GNF: 14.3,        // 1 GNF ≈ 0.07 XAF → 1 XAF ≈ 14.3 GNF
};

export function formatConverted(amount: number, currency: CurrencyCode, rates: Partial<Record<CurrencyCode, number>>): string {
  const rate = rates[currency] ?? FALLBACK_RATES[currency] ?? 1;
  const converted = amount * rate;
  const info = CURRENCIES[currency];

  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  }).format(converted);

  return info.position === "before"
    ? `${info.symbol}${formatted}`
    : `${formatted} ${info.symbol}`;
}

interface CurrencyState {
  currency: CurrencyCode;
  rates: Partial<Record<CurrencyCode, number>>;
  ratesUpdatedAt: number;
  manuallySet: boolean;
  setCurrency: (code: CurrencyCode, manual?: boolean) => void;
  resetToAuto: () => void;
  setRates: (rates: Partial<Record<CurrencyCode, number>>) => void;
  convert: (amountXAF: number) => string;
}

export const GEO_CACHE_KEY = "_sl_geo_v2";

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: "XAF",
      rates: FALLBACK_RATES,
      ratesUpdatedAt: 0,
      manuallySet: false,

      setCurrency: (code, manual = false) =>
        set({ currency: code, ...(manual ? { manuallySet: true } : {}) }),

      resetToAuto: () => set({ manuallySet: false }),

      setRates: (rates) =>
        set({ rates: { ...FALLBACK_RATES, ...rates }, ratesUpdatedAt: Date.now() }),

      convert: (amountXAF) => {
        const { currency, rates } = get();
        return formatConverted(amountXAF, currency, rates);
      },
    }),
    {
      name: "sl-currency-v2",
      partialize: (s) => ({ currency: s.currency, manuallySet: s.manuallySet }),
    }
  )
);
