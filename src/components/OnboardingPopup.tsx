"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { useUserStore } from "@/lib/user-store";

type Step = {
  emoji: string;
  title: string;
  desc: string;
  accent: string;
  bg: string;
};

const STEPS: Step[] = [
  {
    emoji: "👋",
    title: "Bienvenue sur Smart Life !",
    desc: "La plateforme des visionnaires africains pour transformer vos compétences et idées en revenus durables.",
    accent: "#E8B800",
    bg: "from-amber-50 to-yellow-50",
  },
  {
    emoji: "📚",
    title: "Des guides qui font avancer",
    desc: "Accédez à des eBooks pratiques sur l'entrepreneuriat, le business en ligne et la création d'entreprise.",
    accent: "#3B82F6",
    bg: "from-blue-50 to-sky-50",
  },
  {
    emoji: "💡",
    title: "Des conseils gratuits et des consultants du terrain",
    desc: "Lisez nos conseils pour bien vous lancer, métier par métier, et échangez avec des consultants qui pratiquent déjà.",
    accent: "#8B5CF6",
    bg: "from-violet-50 to-purple-50",
  },
  {
    emoji: "🤝",
    title: "Un accompagnement personnalisé",
    desc: "Programme de coaching entrepreneurial sur mesure. Soumettez votre candidature et avancez avec un mentor dédié.",
    accent: "#10B981",
    bg: "from-emerald-50 to-green-50",
  },
  {
    emoji: "🚀",
    title: "Votre aventure commence !",
    desc: "Votre espace personnel est prêt. Retrouvez vos achats, téléchargez vos guides et suivez votre parcours.",
    accent: "#E8B800",
    bg: "from-amber-50 to-yellow-50",
  },
];

export default function OnboardingPopup() {
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const hasSeenOnboarding = useUserStore((s) => s.hasSeenOnboarding);
  const setOnboardingDone = useUserStore((s) => s.setOnboardingDone);
  const _hasHydrated = useUserStore((s) => s._hasHydrated);

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (isLoggedIn && !hasSeenOnboarding) {
      const t = setTimeout(() => setVisible(true), 700);
      return () => clearTimeout(t);
    }
  }, [_hasHydrated, isLoggedIn, hasSeenOnboarding]);

  function close() {
    setOnboardingDone();
    setVisible(false);
  }

  function goTo(next: number, direction: 1 | -1) {
    if (animating) return;
    setDir(direction);
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 180);
  }

  function next() {
    if (step < STEPS.length - 1) goTo(step + 1, 1);
    else close();
  }

  function prev() {
    if (step > 0) goTo(step - 1, -1);
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(5px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        className="relative w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Close */}
        <button
          onClick={close}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          aria-label="Fermer"
        >
          <X size={15} className="text-gray-600" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-5 pb-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                backgroundColor: i === step ? current.accent : "#E5E7EB",
              }}
            />
          ))}
        </div>

        {/* Step content */}
        <div
          className={`px-7 pt-5 pb-2 transition-all duration-180 ${
            animating
              ? dir === 1
                ? "-translate-x-4 opacity-0"
                : "translate-x-4 opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          {/* Emoji in colored circle */}
          <div
            className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${current.bg} flex items-center justify-center text-4xl mx-auto mb-5 shadow-sm`}
          >
            {current.emoji}
          </div>

          <h2 className="text-xl font-extrabold text-gray-900 text-center leading-tight mb-3">
            {current.title}
          </h2>
          <p className="text-gray-500 text-sm text-center leading-relaxed">
            {current.desc}
          </p>

          {/* Final step extra CTAs */}
          {isLast && (
            <div className="flex flex-col gap-2 mt-5">
              <Link
                href="/mon-espace"
                onClick={close}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm text-black transition-all hover:opacity-90 active:opacity-75"
                style={{ backgroundColor: current.accent }}
              >
                Aller à mon espace <ChevronRight size={15} />
              </Link>
              <Link
                href="/ebooks"
                onClick={close}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-all"
              >
                Explorer le catalogue
              </Link>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-7 py-5 mt-2">
          {/* Back or skip */}
          {step > 0 ? (
            <button
              onClick={prev}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
            >
              <ChevronLeft size={15} /> Retour
            </button>
          ) : (
            <button
              onClick={close}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
            >
              Passer
            </button>
          )}

          {/* Next or finish */}
          {!isLast && (
            <button
              onClick={next}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm text-black transition-all hover:opacity-90 active:opacity-75"
              style={{ backgroundColor: current.accent }}
            >
              Suivant <ChevronRight size={14} />
            </button>
          )}

          {isLast && (
            <button
              onClick={close}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
