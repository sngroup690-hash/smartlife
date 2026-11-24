"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ShoppingCart, Menu } from "lucide-react";
import { useCartStore } from "@/lib/store";
import CartSidebar from "@/components/CartSidebar";
import CurrencySelector from "@/components/CurrencySelector";
import GlobalSearch from "@/components/GlobalSearch";
import { motion } from "framer-motion";
import { LienNav, useCheminVise } from "@/components/LienNav";
import { RUBRIQUES, EVENEMENT_MENU, estActif } from "@/lib/navigation";

// Style « Galerie » : menu en texte sobre, un trait jaune glisse sous la rubrique choisie,
// « Se faire accompagner » en bouton jaune, une fine bande Ndop dessous.
const LIENS = RUBRIQUES.filter((r) => r.href !== "/" && !r.fort);
const ACCOMPAGNER = RUBRIQUES.find((r) => r.fort)!;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { openCart, items } = useCartStore();
  const cartCount = items.filter((i) => i.type !== "formation").length;
  const chemin = useCheminVise();

  // Défilement fluide : le menu (avec la recherche et le panier) ne se recalcule QUE quand l'ombre
  // doit apparaître ou disparaître, et non à chaque mouvement du doigt.
  useEffect(() => {
    let ombre = window.scrollY > 8;
    setScrolled(ombre);
    const onScroll = () => {
      const v = window.scrollY > 8;
      if (v !== ombre) { ombre = v; setScrolled(v); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        // Collé juste sous la bannière d'annonce (sa hauteur est publiée dans --annonce-h)
        className={`sticky top-[var(--annonce-h,0px)] z-50 bg-white transition-shadow duration-300 ${
          scrolled ? "shadow-[0_1px_12px_rgba(16,20,16,0.07)]" : ""
        }`}
        style={{ viewTransitionName: "entete-site" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-5">

            <LienNav href="/" className="flex-shrink-0" aria-label="Accueil Smart Life">
              <Image
                src="/logo-smartlife.jpeg"
                alt="SMART LIFE"
                width={152}
                height={50}
                className="h-10 w-auto rounded-md"
                priority
              />
            </LienNav>

            <div className="hidden lg:flex items-center gap-1 text-[14.5px]">
              {LIENS.map((l) => {
                const actif = estActif(l.href, chemin);
                return (
                  <LienNav
                    key={l.href}
                    href={l.href}
                    aria-current={actif ? "page" : undefined}
                    className={`relative whitespace-nowrap px-3 py-2 rounded-[8px] transition-colors duration-150 hover:bg-[var(--g-doux)] ${
                      actif ? "text-[var(--g-encre)] font-semibold" : "text-[var(--g-gris)] hover:text-[var(--g-encre)]"
                    }`}
                  >
                    {l.label}
                    {actif && (
                      <motion.span
                        layoutId="nav-haut-trait"
                        className="absolute left-3 right-3 -bottom-[3px] h-[2.5px] rounded-full bg-[var(--g-jaune)]"
                        transition={{ type: "spring", stiffness: 520, damping: 38 }}
                      />
                    )}
                  </LienNav>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <GlobalSearch />

              <div className="hidden 2xl:block">
                <CurrencySelector />
              </div>

              <LienNav
                href={ACCOMPAGNER.href}
                className={`hidden lg:flex items-center whitespace-nowrap px-4 py-2 text-[14px] font-semibold rounded-[10px] transition-all duration-200 active:scale-[0.97] ${
                  estActif(ACCOMPAGNER.href, chemin)
                    ? "bg-[var(--g-encre)] text-white"
                    : "bg-[var(--g-jaune)] hover:bg-[var(--g-jaune-fonce)] text-[var(--g-encre)]"
                }`}
              >
                {ACCOMPAGNER.label}
              </LienNav>

              <LienNav
                href="/mon-espace"
                className="hidden xl:flex items-center whitespace-nowrap px-3 py-2 text-[14px] font-medium text-[var(--g-gris)] hover:text-[var(--g-encre)] rounded-[10px] hover:bg-[var(--g-doux)] transition-colors"
              >
                Mon espace
              </LienNav>

              <button
                onClick={openCart}
                className="relative p-2 text-[var(--g-gris)] hover:text-[var(--g-encre)] transition-colors duration-150 ml-0.5"
                title="Panier"
                aria-label="Ouvrir le panier"
              >
                <ShoppingCart size={19} strokeWidth={1.75} />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-[var(--g-jaune)] text-[var(--g-encre)] text-[10px] font-bold rounded-full px-[3px] leading-none"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </button>

              <button
                onClick={() => window.dispatchEvent(new Event(EVENEMENT_MENU))}
                className="lg:hidden p-2 -mr-1 text-[var(--g-encre)] rounded-[10px] active:bg-[var(--g-doux)] transition-colors"
                aria-label="Ouvrir le menu"
              >
                <Menu size={22} strokeWidth={1.9} />
              </button>
            </div>
          </div>
        </div>
        <div className="bande-wax h-[12px]" aria-hidden="true" />
      </nav>

      <CartSidebar />
    </>
  );
}
