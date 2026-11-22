"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { X, Sparkles, ArrowRight } from "lucide-react";
import type { BuyerBannerConfig } from "@/app/api/admin/buyer-banner/route";
import { useCartStore } from "@/lib/store";
import type { EspacePersonnalise } from "@/lib/accompagnement-store";

function normalizeStr(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function computeAccompUrl(
  cartItems: ReturnType<typeof useCartStore.getState>["items"],
  espaces: EspacePersonnalise[],
  defaultUrl: string
): string {
  const ebookItems = cartItems.filter((i) => i.type === "ebook" && i.category);
  if (ebookItems.length === 0) return defaultUrl;
  const activeEspaces = espaces.filter((e) => e.actif);
  for (const item of ebookItems) {
    const cat = normalizeStr(item.category!);
    const exact = activeEspaces.find((e) => normalizeStr(e.domaine) === cat);
    if (exact) return `/accompagnement/${exact.id}`;
    const partial = activeEspaces.find((e) => {
      const d = normalizeStr(e.domaine);
      return cat.includes(d) || d.includes(cat);
    });
    if (partial) return `/accompagnement/${partial.id}`;
  }
  return defaultUrl;
}

const DISMISSED_KEY = "sl_buyer_banner_dismissed";
const BUYER_FP_KEY = "sl_buyer_fp";
const SESSION_VERIFIED_KEY = "sl_buyer_verified";

function generateFingerprint(): string {
  try {
    const ua = navigator.userAgent;
    const sc = `${window.screen.width}x${window.screen.height}`;
    const lang = navigator.language;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const str = `${ua}|${sc}|${lang}|${tz}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  } catch {
    return "";
  }
}

export default function BuyerRecognitionBanner() {
  const [config, setConfig] = useState<BuyerBannerConfig | null>(null);
  const [show, setShow] = useState(false);
  const [espaces, setEspaces] = useState<EspacePersonnalise[]>([]);
  const { items: cartItems } = useCartStore();

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (dismissed === new Date().toDateString()) return;
    } catch { return; }

    async function checkAndShow() {
      // Session cache: avoid calling the API on every page navigation
      let sessionResult: string | null = null;
      try { sessionResult = sessionStorage.getItem(SESSION_VERIFIED_KEY); } catch {}

      let isBuyer = false;

      if (sessionResult === "1") {
        isBuyer = true;
      } else if (sessionResult === "0") {
        // Already verified as non-buyer this session
        return;
      } else {
        // First check this session — always call the server (fingerprint only, no IP)
        const fp = generateFingerprint();
        try {
          const res = await fetch(`/api/buyer-check?fp=${encodeURIComponent(fp)}`);
          const data = await res.json() as { isBuyer: boolean };
          isBuyer = data.isBuyer;
          try { sessionStorage.setItem(SESSION_VERIFIED_KEY, isBuyer ? "1" : "0"); } catch {}
          if (isBuyer) {
            try { localStorage.setItem(BUYER_FP_KEY, fp); } catch {}
          } else {
            // Clear any stale false-positive from localStorage
            try { localStorage.removeItem(BUYER_FP_KEY); } catch {}
          }
        } catch {}
      }

      if (!isBuyer) return;

      try {
        const [bannerRes, espacesRes] = await Promise.all([
          fetch("/api/admin/buyer-banner", { cache: "no-store" }),
          fetch("/api/espaces", { cache: "no-store" }),
        ]);
        const cfg = await bannerRes.json() as BuyerBannerConfig;
        if (!cfg.enabled) return;
        const espacesData = await espacesRes.json() as { espaces: EspacePersonnalise[] };
        if (Array.isArray(espacesData.espaces)) setEspaces(espacesData.espaces);
        setConfig(cfg);
        setShow(true);
      } catch {}
    }

    checkAndShow();
  }, []);

  const refreshConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/buyer-banner", { cache: "no-store" });
      const cfg = await res.json() as BuyerBannerConfig;
      if (!cfg.enabled) { setShow(false); return; }
      setConfig(cfg);
      setShow(true);
    } catch {}
  }, []);

  const ctaUrl = config ? computeAccompUrl(cartItems, espaces, config.ctaUrl) : "/accompagnement";

  useEffect(() => {
    if (!show) return;
    let lastV: number | null = null;
    const check = async () => {
      try {
        const r = await fetch("/api/banner-version", { cache: "no-store" });
        const { v } = await r.json() as { v: number };
        if (lastV !== null && v !== lastV) await refreshConfig();
        lastV = v;
      } catch {}
    };
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [show, refreshConfig]);

  function dismiss() {
    try { localStorage.setItem(DISMISSED_KEY, new Date().toDateString()); } catch {}
    setShow(false);
  }

  if (!show || !config) return null;

  return (
    <div
      className="relative border-b px-4 py-3"
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.bgColor,
        position: "relative",
        zIndex: 9999,
        pointerEvents: "auto",
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        {/* Texte */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: config.ctaBgColor + "33" }}
          >
            <Sparkles size={14} style={{ color: config.ctaBgColor }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: config.textColor }}>
              🎉 {config.title}
            </p>
            {config.subtitle && (
              <p className="text-xs" style={{ color: config.textColor, opacity: 0.75 }}>
                {config.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions — toujours visibles, mobile + desktop */}
        <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-auto">
          {config.ctaText && ctaUrl && (
            <Link
              href={ctaUrl}
              onClick={dismiss}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-opacity hover:opacity-90 active:opacity-75"
              style={{
                backgroundColor: config.ctaBgColor,
                color: config.ctaTextColor,
                pointerEvents: "auto",
                position: "relative",
                zIndex: 9999,
              }}
            >
              {config.ctaText}
              <ArrowRight size={12} />
            </Link>
          )}
          <button
            onClick={dismiss}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: config.textColor, pointerEvents: "auto" }}
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
