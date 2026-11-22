"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Megaphone, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

type Announcement = {
  id: string;
  text: string;
  active: boolean;
  color: "yellow" | "green" | "red" | "blue" | "custom";
  link?: string;
  linkText?: string;
  bgColor?: string;
  textColor?: string;
  btnBgColor?: string;
  btnTextColor?: string;
};

const PRESET_BG: Record<string, string> = {
  yellow: "rgba(232,184,0,0.10)",
  green:  "rgba(16,185,129,0.10)",
  red:    "rgba(239,68,68,0.10)",
  blue:   "rgba(59,130,246,0.10)",
};

const PRESET_TEXT: Record<string, string> = {
  yellow: "#ca8a04",
  green:  "#27A827",
  red:    "#dc2626",
  blue:   "#2563eb",
};

const PRESET_BTN_BG: Record<string, string> = {
  yellow: "#E8B800",
  green:  "#27A827",
  red:    "#dc2626",
  blue:   "#2563eb",
};

const ROTATE_INTERVAL = 5000;

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const loadAnnouncements = useCallback(async () => {
    try {
      const r = await fetch("/api/announcement", { cache: "no-store" });
      const data = await r.json() as Announcement[];
      if (Array.isArray(data)) setAnnouncements(data);
    } catch {}
  }, []);

  // Chargement initial
  useEffect(() => { loadAnnouncements(); }, [loadAnnouncements]);

  // Polling version toutes les 30s — re-fetch si l'admin a sauvegardé
  useEffect(() => {
    let lastV: number | null = null;
    const check = async () => {
      try {
        const r = await fetch("/api/banner-version", { cache: "no-store" });
        const { v } = await r.json() as { v: number };
        if (lastV !== null && v !== lastV) await loadAnnouncements();
        lastV = v;
      } catch {}
    };
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [loadAnnouncements]);

  const active = announcements.filter(
    (a) => a.active && a.text?.trim() && !dismissed.has(a.id)
  );

  const goTo = useCallback((idx: number) => {
    setCurrentIndex(idx);
    setAnimKey((k) => k + 1);
  }, []);

  const advance = useCallback((dir: 1 | -1, len: number) => {
    setCurrentIndex((prev) => (prev + dir + len) % len);
    setAnimKey((k) => k + 1);
  }, []);

  // Reset index if out of bounds after a dismiss
  useEffect(() => {
    if (active.length > 0 && currentIndex >= active.length) {
      goTo(active.length - 1);
    }
  }, [active.length, currentIndex, goTo]);

  // Auto-rotate
  useEffect(() => {
    if (active.length <= 1) return;
    const id = setInterval(() => {
      advance(1, active.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(id);
  }, [active.length, advance]);

  if (active.length === 0) return null;

  const safeIndex = Math.min(currentIndex, active.length - 1);
  const ann = active[safeIndex];
  if (!ann) return null;

  const isCustom = ann.color === "custom";
  const bg     = isCustom ? (ann.bgColor   || "#1e293b") : (PRESET_BG[ann.color]   ?? PRESET_BG.yellow);
  const txt    = isCustom ? (ann.textColor || "#ffffff") : (PRESET_TEXT[ann.color]  ?? PRESET_TEXT.yellow);
  const btnBg  = isCustom ? (ann.btnBgColor || "#E8B800") : (PRESET_BTN_BG[ann.color] ?? PRESET_BTN_BG.yellow);
  const btnTxt = isCustom ? (ann.btnTextColor || "#000000") : "#ffffff";

  return (
    <div
      className="relative overflow-hidden border-b border-black/5"
      style={{ backgroundColor: bg, color: txt }}
    >
      {/* Navigation gauche */}
      {active.length > 1 && (
        <button
          onClick={() => advance(-1, active.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 transition-colors z-10"
          aria-label="Annonce précédente"
        >
          <ChevronLeft size={14} />
        </button>
      )}

      {/* Contenu animé */}
      <div
        key={animKey}
        className="animate-ann-slide flex items-center justify-center gap-3 px-10 py-2.5 text-sm font-medium"
      >
        <Megaphone size={14} className="shrink-0" />
        <span>{ann.text}</span>

        {ann.link && (
          <a
            href={ann.link}
            target={ann.link.startsWith("http") ? "_blank" : "_self"}
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-opacity hover:opacity-80"
            style={{ backgroundColor: btnBg, color: btnTxt }}
          >
            {ann.linkText || "Voir"} <ExternalLink size={11} />
          </a>
        )}

        {/* Indicateurs dots */}
        {active.length > 1 && (
          <div className="flex items-center gap-1 ml-1">
            {active.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="rounded-full transition-all"
                style={{
                  width:  i === safeIndex ? "16px" : "6px",
                  height: "6px",
                  backgroundColor: i === safeIndex ? txt : `${txt}55`,
                }}
                aria-label={`Annonce ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Navigation droite */}
      {active.length > 1 && (
        <button
          onClick={() => advance(1, active.length)}
          className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 transition-colors z-10"
          aria-label="Annonce suivante"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* Fermer */}
      <button
        onClick={() => setDismissed((prev) => new Set(prev).add(ann.id))}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 transition-colors z-10"
        aria-label="Fermer l'annonce"
      >
        <X size={14} />
      </button>
    </div>
  );
}
