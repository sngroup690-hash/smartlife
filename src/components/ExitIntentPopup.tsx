"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X, Copy, Check } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "sl_exit_intent_v1";
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const WA_URL = "https://wa.me/237694176642";
const INACTIVITY_PRODUCT_MS = 45_000;   // 45s on product/payment pages
const INACTIVITY_DEFAULT_MS = 60_000;   // 60s on all other pages

const EXCLUDED_PREFIXES = [
  "/admin", "/login", "/register", "/dashboard",
  "/mon-espace", "/affilies", "/checkout/success",
];

const PRODUCT_PATTERNS = [
  /^\/ebooks\/.+/,
  /^\/services\/.+/,
  /^\/accompagnement\/.+/,
  /^\/packs\/.+/,
  /^\/checkout/,
  /^\/pay\/.+/,
];

type Choice = 1 | 2 | 3 | 4;
type Step = "survey" | "response" | "closed";

const CHOICES: { id: Choice; label: string }[] = [
  { id: 1, label: "Le prix est trop élevé pour le moment." },
  { id: 2, label: "Je ne sais pas si cette formation / cet ebook me convient." },
  { id: 3, label: "Je repasserai plus tard / j'ai un problème de paiement." },
  { id: 4, label: "Autre" },
];

const RESPONSES: Record<Choice, {
  icon: string;
  title: string;
  desc: string;
  promo?: string;
  btnLabel: string;
  btnHref: string | null;
}> = {
  1: {
    icon: "💰",
    title: "On comprend totalement !",
    desc: "Voici un code promo exclusif de -10% valable tout de suite :",
    promo: "OFFRE10",
    btnLabel: "Appliquer et acheter →",
    btnHref: "/ebooks",
  },
  2: {
    icon: "💬",
    title: "Besoin d'un conseil pour faire le bon choix ?",
    desc: "Notre équipe est disponible maintenant pour vous guider vers la bonne formation.",
    btnLabel: "Discuter avec nous sur WhatsApp",
    btnHref: WA_URL,
  },
  3: {
    icon: "🤝",
    title: "Besoin d'aide pour finaliser votre commande ?",
    desc: "Notre support est disponible pour vous aider à régler le paiement.",
    btnLabel: "Contacter le Support WhatsApp",
    btnHref: WA_URL,
  },
  4: {
    icon: "🙏",
    title: "Merci pour votre retour !",
    desc: "Votre avis nous aide à améliorer notre service. Revenez nous voir bientôt !",
    btnLabel: "Retourner au site",
    btnHref: null,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasShownRecently(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (!val) return false;
    const { ts } = JSON.parse(val);
    return Date.now() - ts < EXPIRY_MS;
  } catch { return false; }
}

function markShown(): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now() })); } catch { /* noop */ }
}

// More robust touch-device detection (covers high-res phones, tablets, etc.)
function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    navigator.maxTouchPoints > 0 ||
    ("ontouchstart" in window) ||
    /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent)
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ExitIntentPopup() {
  const pathname = usePathname();
  const [step, setStep] = useState<Step>("closed");
  const [selected, setSelected] = useState<Choice | null>(null);
  const [otherText, setOtherText] = useState("");
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);
  const triggered = useRef(false);

  const isExcluded = EXCLUDED_PREFIXES.some(p => pathname.startsWith(p));
  const isProduct = PRODUCT_PATTERNS.some(p => p.test(pathname));

  const trigger = useCallback(() => {
    if (triggered.current || isExcluded) return;
    if (hasShownRecently()) return;
    triggered.current = true;
    markShown();
    setStep("survey");
    setVisible(true);
  }, [isExcluded]);

  // ── Desktop: mouse leaving toward top of viewport ─────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || isExcluded) return;
    if (isTouchDevice()) return;

    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 5) trigger();
    };
    document.addEventListener("mouseleave", onLeave);
    return () => document.removeEventListener("mouseleave", onLeave);
  }, [trigger, isExcluded]);

  // ── Mobile: back button via popstate sentinel ──────────────────────────────
  // Re-runs on every pathname change to keep sentinel just below the current page.
  // When user presses back, they land on the sentinel and the popup fires.
  useEffect(() => {
    if (typeof window === "undefined" || isExcluded) return;
    if (!isTouchDevice()) return;
    if (hasShownRecently()) return;

    // Push sentinel at current URL (only if the top of history isn't already ours)
    if (!history.state?._sl_ei) {
      history.pushState({ _sl_ei: true }, "", location.href);
    }

    const onPop = () => {
      if (hasShownRecently()) return;
      // Re-push to keep user on the current page while popup is shown
      history.pushState({ _sl_ei: true }, "", location.href);
      trigger();
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  // pathname in deps ensures sentinel is re-pushed after each Next.js navigation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, isExcluded, pathname]);

  // ── Mobile: inactivity timer ───────────────────────────────────────────────
  // Runs on ALL non-excluded pages: 45s on product/payment, 60s elsewhere.
  useEffect(() => {
    if (typeof window === "undefined" || isExcluded) return;
    if (!isTouchDevice()) return;
    if (hasShownRecently()) return;

    const delay = isProduct ? INACTIVITY_PRODUCT_MS : INACTIVITY_DEFAULT_MS;
    let timer = window.setTimeout(trigger, delay);

    const reset = () => {
      clearTimeout(timer);
      timer = window.setTimeout(trigger, delay);
    };

    const events = ["touchstart", "touchmove", "scroll", "click"] as const;
    events.forEach(ev => document.addEventListener(ev, reset, { passive: true }));

    return () => {
      clearTimeout(timer);
      events.forEach(ev => document.removeEventListener(ev, reset));
    };
  }, [trigger, isExcluded, isProduct]);

  // ── Submit choice to API ──────────────────────────────────────────────────
  async function handleChoice(choice: Choice) {
    setSelected(choice);
    setStep("response");

    const choiceLabel = CHOICES.find(c => c.id === choice)?.label ?? "";
    try {
      await fetch("/api/exit-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choice,
          choiceLabel,
          otherText: choice === 4 ? otherText : undefined,
          page: pathname,
        }),
      });
    } catch { /* silent — don't block UX */ }
  }

  function close() {
    setVisible(false);
    setTimeout(() => setStep("closed"), 300);
  }

  async function copyPromo(code: string) {
    try { await navigator.clipboard.writeText(code); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (step === "closed") return null;

  const resp = selected ? RESPONSES[selected] : null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        className={`relative w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors"
          aria-label="Fermer"
        >
          <X size={16} className="text-gray-600" />
        </button>

        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* ── Step 1 : Survey ──────────────────────────────────────────────── */}
        {step === "survey" && (
          <div className="px-6 pt-4 pb-6 sm:p-7">
            <div className="text-4xl mb-3 text-center">🥺</div>
            <h2 className="text-xl font-extrabold text-gray-900 text-center mb-1 leading-tight">
              Pourquoi vous nous quittez déjà ?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-5 leading-snug">
              Dites-nous ce qui vous retient en 1 clic et débloquez votre avantage exclusif !
            </p>

            <div className="space-y-2.5">
              {CHOICES.map((c) => (
                <div key={c.id}>
                  <button
                    onClick={() => c.id !== 4 ? handleChoice(c.id) : undefined}
                    className="w-full text-left px-4 py-3.5 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 active:bg-green-100 text-gray-700 text-sm font-medium transition-all touch-manipulation"
                  >
                    <span className="inline-flex items-center gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300" />
                      <span className="leading-snug">{c.label}</span>
                    </span>
                  </button>
                  {c.id === 4 && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="Précisez (facultatif)…"
                        value={otherText}
                        onChange={e => setOtherText(e.target.value)}
                        className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400"
                      />
                      <button
                        onClick={() => handleChoice(4)}
                        className="px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 active:bg-gray-600 transition-colors touch-manipulation"
                      >
                        OK
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2 : Dynamic response ───────────────────────────────────── */}
        {step === "response" && resp && (
          <div className="px-6 pt-4 pb-6 sm:p-7 text-center">
            <div className="text-5xl mb-4">{resp.icon}</div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2 leading-tight">{resp.title}</h2>
            <p className="text-gray-600 text-sm mb-5 leading-snug">{resp.desc}</p>

            {resp.promo && (
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="bg-green-50 border-2 border-dashed border-green-400 px-6 py-3 rounded-xl">
                  <span className="text-green-700 font-extrabold text-2xl tracking-widest">{resp.promo}</span>
                </div>
                <button
                  onClick={() => copyPromo(resp.promo!)}
                  className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors touch-manipulation"
                  title="Copier le code"
                >
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-600" />}
                </button>
              </div>
            )}

            {resp.btnHref ? (
              <a
                href={resp.btnHref}
                target={resp.btnHref.startsWith("http") ? "_blank" : undefined}
                rel={resp.btnHref.startsWith("http") ? "noopener noreferrer" : undefined}
                onClick={close}
                className="block w-full py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-extrabold text-sm rounded-xl transition-all shadow-md touch-manipulation"
              >
                {resp.btnLabel}
              </a>
            ) : (
              <button
                onClick={close}
                className="w-full py-4 bg-gray-900 hover:bg-gray-700 active:bg-gray-600 text-white font-bold text-sm rounded-xl transition-all touch-manipulation"
              >
                {resp.btnLabel}
              </button>
            )}

            <button
              onClick={close}
              className="mt-4 text-xs text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors touch-manipulation py-2"
            >
              Non merci, je continue quand même
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
