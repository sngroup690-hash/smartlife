"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { Popup } from "@/app/api/admin/popups/route";

// ─── Countdown Timer ──────────────────────────────────────────────────────────

function CountdownTimer({ endDate, accentColor }: { endDate: string; accentColor: string }) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    function tick() {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ d, h, m, s });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  const box = "flex flex-col items-center bg-black/20 rounded-lg px-3 py-2 min-w-[48px]";
  return (
    <div className="flex items-center gap-2 mt-3">
      {[
        { label: "j", value: timeLeft.d },
        { label: "h", value: timeLeft.h },
        { label: "m", value: timeLeft.m },
        { label: "s", value: timeLeft.s },
      ].map(({ label, value }) => (
        <div key={label} className={box} style={{ borderColor: accentColor + "33" }}>
          <span className="text-xl font-bold tabular-nums" style={{ color: accentColor }}>
            {String(value).padStart(2, "0")}
          </span>
          <span className="text-xs opacity-60">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Single Popup Renderer ────────────────────────────────────────────────────

function PopupRenderer({ popup, onClose }: { popup: Popup; onClose: (id: string) => void }) {
  const close = useCallback(() => onClose(popup.id), [onClose, popup.id]);

  const handleCta = useCallback(() => {
    // Save discount to localStorage so checkout can apply it automatically
    if (popup.discountType && popup.discountType !== "none" && popup.discountValue > 0) {
      try {
        localStorage.setItem("sl_popup_promo", JSON.stringify({
          type: popup.discountType,
          value: popup.discountValue,
          label: popup.discountLabel || `Réduction ${popup.discountType === "percent" ? `${popup.discountValue}%` : `${popup.discountValue} FCFA`}`,
          popupId: popup.id,
        }));
      } catch { /* ignore */ }
    }
    close();
  }, [popup, close]);

  if (popup.type === "banner_top" || popup.type === "banner_bottom") {
    const posClass = popup.type === "banner_top" ? "top-0" : "bottom-0";
    return (
      <div
        className={`fixed left-0 right-0 ${posClass} z-40 flex items-center justify-between px-4 py-3 shadow-lg`}
        style={{ backgroundColor: popup.bgColor, color: popup.textColor }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {popup.imageUrl && (
            <img src={popup.imageUrl} alt="" className="h-8 w-8 object-cover rounded-full flex-shrink-0" />
          )}
          <div className="min-w-0">
            {popup.title && <span className="font-bold text-sm mr-2">{popup.title}</span>}
            {popup.content && <span className="text-sm opacity-90">{popup.content}</span>}
          </div>
          {popup.hasCountdown && popup.countdownEnd && (
            <CountdownTimer endDate={popup.countdownEnd} accentColor={popup.accentColor} />
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {popup.ctaText && popup.ctaUrl && (
            <Link
              href={popup.ctaUrl}
              className="px-4 py-1.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-80"
              style={{ backgroundColor: popup.accentColor, color: popup.bgColor }}
              onClick={handleCta}
            >
              {popup.ctaText}
            </Link>
          )}
          <button
            onClick={close}
            className="text-current opacity-60 hover:opacity-100 transition-opacity text-xl font-bold leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  // Popup overlay
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl p-8"
        style={{ backgroundColor: popup.bgColor, color: popup.textColor }}
      >
        <button
          onClick={close}
          className="absolute top-4 right-4 text-current opacity-50 hover:opacity-100 transition-opacity text-2xl font-bold leading-none"
          aria-label="Fermer"
        >
          ×
        </button>

        {popup.imageUrl && (
          <img
            src={popup.imageUrl}
            alt=""
            className="w-full h-40 object-cover rounded-xl mb-5"
          />
        )}

        {popup.title && (
          <h2 className="text-xl font-bold mb-3" style={{ color: popup.accentColor }}>
            {popup.title}
          </h2>
        )}

        {popup.content && (
          <p className="text-sm opacity-90 leading-relaxed mb-4">{popup.content}</p>
        )}

        {popup.hasCountdown && popup.countdownEnd && (
          <CountdownTimer endDate={popup.countdownEnd} accentColor={popup.accentColor} />
        )}

        {popup.ctaText && popup.ctaUrl && (
          <Link
            href={popup.ctaUrl}
            className="mt-5 block text-center px-6 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-80"
            style={{ backgroundColor: popup.accentColor, color: popup.bgColor }}
            onClick={handleCta}
          >
            {popup.ctaText}
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Main PopupManager ────────────────────────────────────────────────────────

export default function PopupManager() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const dismiss = useCallback((id: string) => {
    setVisible((v) => {
      const next = new Set(v);
      next.delete(id);
      return next;
    });
    // Mark as seen in localStorage
    try {
      localStorage.setItem(`popup_seen_${id}`, "1");
    } catch { /* ignore */ }
  }, []);

  const loadPopups = useCallback(async () => {
    try {
      const r = await fetch("/api/popups", { cache: "no-store" });
      if (r.ok) setPopups(await r.json() as Popup[]);
    } catch {}
  }, []);

  useEffect(() => { loadPopups(); }, [loadPopups]);

  // Polling version 30s — re-déclenche si l'admin a modifié un popup
  useEffect(() => {
    let lastV: number | null = null;
    const check = async () => {
      try {
        const r = await fetch("/api/banner-version", { cache: "no-store" });
        const { v } = await r.json() as { v: number };
        if (lastV !== null && v !== lastV) await loadPopups();
        lastV = v;
      } catch {}
    };
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [loadPopups]);

  useEffect(() => {
    if (popups.length === 0) return;

    const pathname = window.location.pathname;
    // Determine if user is "logged in" via localStorage
    let isLoggedIn = false;
    try {
      const stored = localStorage.getItem("sl_user") ?? localStorage.getItem("user-store");
      if (stored) {
        const parsed = JSON.parse(stored) as { state?: { isLoggedIn?: boolean }; isLoggedIn?: boolean };
        isLoggedIn = parsed?.state?.isLoggedIn ?? parsed?.isLoggedIn ?? false;
      }
    } catch { /* ignore */ }

    const isNewVisitor = !localStorage.getItem("sl_visited");
    // Mark as visited
    try { localStorage.setItem("sl_visited", "1"); } catch { /* ignore */ }

    for (const popup of popups) {
      // Check pages
      if (!popup.pages.includes("all") && !popup.pages.includes(pathname)) continue;

      // Check audience
      if (popup.audience === "new_visitors" && !isNewVisitor) continue;
      if (popup.audience === "logged_in" && !isLoggedIn) continue;
      if (popup.audience === "not_logged_in" && isLoggedIn) continue;

      // Check showOnce
      if (popup.showOnce) {
        try {
          if (localStorage.getItem(`popup_seen_${popup.id}`)) continue;
        } catch { /* ignore */ }
      }

      // Schedule display based on trigger
      const show = () => setVisible((v) => new Set(v).add(popup.id));

      if (popup.trigger === "immediate") {
        show();
      } else if (popup.trigger === "delay") {
        const t = setTimeout(show, popup.triggerDelay * 1000);
        timersRef.current.push(t);
      } else if (popup.trigger === "exit_intent") {
        const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (!isMobile) {
          // Desktop: souris qui monte vers la barre d'adresse
          const handleLeave = (e: MouseEvent) => {
            if (e.clientY <= 0) {
              show();
              document.removeEventListener("mouseleave", handleLeave);
            }
          };
          document.addEventListener("mouseleave", handleLeave);
        } else {
          // Mobile: scroll rapide vers le haut + fallback délai 8s
          let lastY = window.scrollY;
          let lastT = Date.now();
          let shown = false;
          const onMobileScroll = () => {
            if (shown) return;
            const now = Date.now();
            const dy = window.scrollY - lastY;
            const dt = now - lastT;
            // Scroll montant rapide (>40px en <300ms)
            if (dy < -40 && dt < 300 && window.scrollY > 100) {
              shown = true;
              show();
              window.removeEventListener("scroll", onMobileScroll);
            }
            lastY = window.scrollY;
            lastT = now;
          };
          window.addEventListener("scroll", onMobileScroll, { passive: true });
          // Fallback: afficher après le délai configuré si le scroll n'est pas détecté
          const fallbackMs = (popup.mobileExitDelay ?? 8) * 1000;
          const fallback = setTimeout(() => {
            if (!shown) { shown = true; show(); }
          }, fallbackMs);
          timersRef.current.push(fallback);
        }
      } else if (popup.trigger === "scroll") {
        const target = popup.triggerScrollPercent / 100;
        const handleScroll = () => {
          const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
          if (scrolled >= target) {
            show();
            window.removeEventListener("scroll", handleScroll);
          }
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
      }
    }

    return () => {
      for (const t of timersRef.current) clearTimeout(t);
      timersRef.current = [];
    };
  }, [popups]);

  const visiblePopups = popups.filter((p) => visible.has(p.id));

  if (visiblePopups.length === 0) return null;

  return (
    <>
      {visiblePopups.map((popup) => (
        <PopupRenderer key={popup.id} popup={popup} onClose={dismiss} />
      ))}
    </>
  );
}
