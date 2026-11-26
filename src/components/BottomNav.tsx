"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { X, ChevronRight, Search, Home, BookOpen, Lightbulb, UserPlus, Users, Handshake, type LucideIcon } from "lucide-react";
import CurrencySelector from "@/components/CurrencySelector";
import { LienNav, useCheminVise } from "@/components/LienNav";
import { RUBRIQUES, AUTRES_PAGES, EVENEMENT_MENU, estActif } from "@/lib/navigation";

const ICONES: Record<string, LucideIcon> = {
  "/": Home,
  "/ebooks": BookOpen,
  "/conseils": Lightbulb,
  "/nos-consultants": Users,
  "/devenir-consultant": UserPlus,
  "/accompagnement": Handshake,
};

// Ordre du menu du bas : « Se faire accompagner » au centre, à portée du pouce.
const ORDRE_BAS = ["/", "/ebooks", "/conseils", "/accompagnement", "/nos-consultants", "/devenir-consultant"];
const ELEMENTS_BAS = ORDRE_BAS.map((h) => RUBRIQUES.find((r) => r.href === h)!);

export default function BottomNav() {
  const [panneau, setPanneau] = useState(false);
  const cheminReel = usePathname();
  const chemin = useCheminVise();

  useEffect(() => { setPanneau(false); }, [cheminReel]);

  useEffect(() => {
    const ouvrir = () => setPanneau(true);
    window.addEventListener(EVENEMENT_MENU, ouvrir);
    return () => window.removeEventListener(EVENEMENT_MENU, ouvrir);
  }, []);

  useEffect(() => {
    document.body.style.overflow = panneau ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [panneau]);

  return (
    <>
      {/* ── Menu fixe en bas, téléphone et tablette : blanc, plat, une pastille jaune glisse sous la rubrique choisie ── */}
      <nav
        className="lg:hidden fixed left-0 right-0 bottom-0 z-50 bg-white border-t border-[var(--g-ligne)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", viewTransitionName: "menu-bas" }}
        aria-label="Menu principal"
      >
        <div className="flex items-stretch h-[62px] max-w-xl mx-auto">
          {ELEMENTS_BAS.map((item) => {
            const actif = estActif(item.href, chemin);
            const Icone = ICONES[item.href];
            return (
              <LienNav
                key={item.href}
                href={item.href}
                className="menu-touche relative flex-1 min-w-0 flex flex-col items-center justify-center gap-[3px] pt-1"
                aria-current={actif ? "page" : undefined}
              >
                <span className="relative flex items-center justify-center w-11 h-7">
                  {actif && (
                    <motion.span
                      layoutId="nav-bas-pastille"
                      className="absolute inset-0 rounded-full bg-[var(--g-jaune-doux)]"
                      transition={{ type: "spring", stiffness: 560, damping: 40 }}
                    />
                  )}
                  {item.fort && !actif && (
                    <span className="absolute inset-0 rounded-full bg-[var(--g-jaune)]" />
                  )}
                  <Icone
                    size={20}
                    strokeWidth={actif ? 2.3 : 1.85}
                    className="relative"
                    style={{ color: actif || item.fort ? "var(--g-encre)" : "var(--g-gris)" }}
                  />
                </span>
                <span
                  className="leading-[1.08] text-center whitespace-pre-line tracking-[-0.01em]"
                  style={{ fontSize: "10px", fontWeight: actif ? 700 : 500, color: actif ? "var(--g-encre)" : "var(--g-gris)" }}
                >
                  {item.court}
                </span>
              </LienNav>
            );
          })}
        </div>
      </nav>

      {/* ── Fond sombre ── */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] bg-black/45 transition-opacity duration-300 ${
          panneau ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setPanneau(false)}
      />

      {/* ── Panneau « Menu » qui monte du bas ── */}
      <div
        className="lg:hidden fixed left-0 right-0 bottom-0 z-[70] bg-white rounded-t-[20px] shadow-2xl transition-transform duration-300"
        style={{
          maxHeight: "88vh",
          transform: panneau ? "translateY(0)" : "translateY(100%)",
          transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        role="dialog"
        aria-label="Menu"
        aria-hidden={!panneau}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--g-ligne)]" />
        </div>

        <div className="flex items-center justify-between px-5 py-2.5">
          <span className="font-semibold text-[19px] tracking-[-0.02em] text-[var(--g-encre)]">Menu</span>
          <button
            onClick={() => setPanneau(false)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--g-doux)] text-[var(--g-encre)] active:scale-95 transition-transform"
            aria-label="Fermer le menu"
          >
            <X size={17} />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-4" style={{ maxHeight: "calc(88vh - 80px)" }}>
          <button
            onClick={() => {
              setPanneau(false);
              window.dispatchEvent(new CustomEvent("open-global-search"));
            }}
            className="flex items-center gap-3 w-full px-4 py-3 bg-[var(--g-doux)] rounded-[12px] text-left active:scale-[0.99] transition-transform"
          >
            <Search size={16} className="text-[var(--g-gris)] shrink-0" />
            <span className="text-[15px] text-[var(--g-gris)]">Rechercher un guide, un conseil…</span>
          </button>

          <div className="pt-3 flex gap-2.5">
            <LienNav href="/login" className="flex-1 py-3 border border-[var(--g-ligne)] text-[var(--g-encre)] font-semibold text-[14px] text-center rounded-[10px] active:bg-[var(--g-doux)]">
              Connexion
            </LienNav>
            <LienNav href="/mon-espace" className="flex-1 py-3 bg-[var(--g-jaune)] text-[var(--g-encre)] font-semibold text-[14px] text-center rounded-[10px] active:scale-[0.98] transition-transform">
              Mon espace
            </LienNav>
          </div>

          <p className="mt-5 mb-1 px-1 text-[12px] font-semibold text-[var(--g-gris)]">Rubriques</p>
          <div className="rounded-[14px] border border-[var(--g-ligne)] overflow-hidden">
            {RUBRIQUES.map((r) => {
              const Icone = ICONES[r.href];
              const actif = estActif(r.href, chemin);
              return (
                <LienNav
                  key={r.href}
                  href={r.href}
                  className={`flex items-center gap-3 px-4 py-3.5 border-b border-[var(--g-ligne)] last:border-0 transition-colors ${
                    actif ? "bg-[var(--g-jaune-doux)]" : "active:bg-[var(--g-doux)]"
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${r.fort ? "bg-[var(--g-jaune)]" : "bg-[var(--g-doux)]"}`}>
                    <Icone size={16} strokeWidth={2} className="text-[var(--g-encre)]" />
                  </span>
                  <span className={`flex-1 text-[15.5px] text-[var(--g-encre)] ${actif ? "font-semibold" : ""}`}>{r.label}</span>
                  <ChevronRight size={15} className="text-[var(--g-gris)] shrink-0" />
                </LienNav>
              );
            })}
          </div>

          <p className="mt-5 mb-1 px-1 text-[12px] font-semibold text-[var(--g-gris)]">Aussi sur Smart Life</p>
          <div className="rounded-[14px] border border-[var(--g-ligne)] overflow-hidden">
            {AUTRES_PAGES.map((p) => (
              <LienNav
                key={p.href}
                href={p.href}
                className={`flex items-center gap-3 px-4 py-3 border-b border-[var(--g-ligne)] last:border-0 ${
                  estActif(p.href, chemin) ? "bg-[var(--g-jaune-doux)]" : "active:bg-[var(--g-doux)]"
                }`}
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] text-[var(--g-encre)]">{p.label}</span>
                  <span className="block text-[12.5px] text-[var(--g-gris)] leading-snug">{p.desc}</span>
                </span>
                <ChevronRight size={15} className="text-[var(--g-gris)] shrink-0" />
              </LienNav>
            ))}
          </div>

          <div className="mt-5 pb-6">
            <p className="mb-2 px-1 text-[12px] font-semibold text-[var(--g-gris)]">Devise</p>
            <CurrencySelector />
          </div>
        </div>
      </div>
    </>
  );
}
