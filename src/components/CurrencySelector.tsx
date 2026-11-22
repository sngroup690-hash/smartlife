"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { useCurrencyStore, GEO_CACHE_KEY, CURRENCIES, type CurrencyCode } from "@/lib/currency-store";

const CURRENCY_LIST: CurrencyCode[] = ["XAF", "XOF", "GNF", "CDF", "EUR", "USD"];

export default function CurrencySelector() {
  const { currency, manuallySet, setCurrency, resetToAuto } = useCurrencyStore();
  const [open, setOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const info = CURRENCIES[currency];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleResetToAuto() {
    setDetecting(true);
    setOpen(false);
    resetToAuto(); // efface manuallySet + cache sessionStorage
    try {
      const res = await fetch("/api/geo");
      const d = await res.json() as { countryCode?: string | null };
      if (d.countryCode) {
        const { COUNTRY_CURRENCY } = await import("@/lib/currency-store");
        const detected = COUNTRY_CURRENCY[d.countryCode.toUpperCase()] as CurrencyCode | undefined;
        if (detected) setCurrency(detected, false);
        try {
          sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ ts: Date.now(), countryCode: d.countryCode }));
        } catch { /* ignore */ }
      }
    } catch { /* réseau */ } finally {
      setDetecting(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-green-400 bg-white text-gray-700 text-xs font-semibold transition-colors"
        title="Changer de devise"
      >
        <span>{info.flag}</span>
        <span>{info.code}</span>
        {!manuallySet && (
          <span className="hidden sm:inline px-1 py-0.5 text-[9px] bg-green-100 text-green-700 rounded font-bold leading-none">
            Auto
          </span>
        )}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
          <p className="px-3 py-1.5 text-[10px] text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-100 mb-1">
            Devise d&apos;affichage
          </p>

          {/* Reset auto-detection (only when manually set) */}
          {manuallySet && (
            <button
              onClick={handleResetToAuto}
              disabled={detecting}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-blue-50 text-blue-600 border-b border-gray-100 mb-1"
            >
              <RotateCcw size={13} className={detecting ? "animate-spin" : ""} />
              <span className="font-medium">{detecting ? "Détection en cours…" : "Détection automatique"}</span>
            </button>
          )}

          {CURRENCY_LIST.map((code) => {
            const c = CURRENCIES[code];
            return (
              <button
                key={code}
                onClick={() => { setCurrency(code, true); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-green-50 ${
                  currency === code && manuallySet ? "bg-green-50 text-green-700 font-bold" : "text-gray-700"
                } ${currency === code && !manuallySet ? "bg-gray-50" : ""}`}
              >
                <span className="text-base w-6 flex-shrink-0">{c.flag}</span>
                <span className="flex-1 font-medium">{c.name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 font-mono">{c.symbol}</span>
                  {currency === code && !manuallySet && (
                    <span className="text-[9px] bg-green-100 text-green-700 rounded px-1 font-bold">Auto</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
