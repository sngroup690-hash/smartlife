"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/store";
import CartSidebar from "@/components/CartSidebar";
import CurrencySelector from "@/components/CurrencySelector";
import GlobalSearch from "@/components/GlobalSearch";
import { motion } from "framer-motion";

// Style « Galerie » : menu en texte sobre, sans icônes ni couleurs, et une fine bande wax dessous.
const LIENS = [
  { href: "/ebooks", label: "Guides" },
  { href: "/accompagnement", label: "Accompagnement" },
  { href: "/devenir-consultant", label: "Devenir consultant" },
  { href: "/temoignages", label: "Avis" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { openCart, items } = useCartStore();
  const cartCount = items.filter((i) => i.type !== "formation").length;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${
          scrolled ? "shadow-[0_1px_12px_rgba(16,20,16,0.07)]" : ""
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-6">

            <Link href="/" className="flex-shrink-0">
              <Image
                src="/logo-smartlife.jpeg"
                alt="SMART LIFE"
                width={152}
                height={50}
                className="h-10 w-auto rounded-md"
                priority
              />
            </Link>

            <div className="hidden lg:flex items-center gap-7 text-[14.5px]">
              {LIENS.map((l) => (
                <Link key={l.href} href={l.href} className="text-[var(--g-gris)] hover:text-[var(--g-encre)] transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <GlobalSearch />

              <div className="hidden xl:block">
                <CurrencySelector />
              </div>

              <Link
                href="/mon-espace"
                className="hidden md:flex items-center px-4 py-2 bg-[var(--g-jaune)] hover:bg-[var(--g-jaune-fonce)] text-[var(--g-encre)] text-[14px] font-semibold rounded-[10px] transition-colors duration-200"
              >
                Mon espace
              </Link>

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
            </div>
          </div>
        </div>
        <div className="bande-wax h-[6px]" aria-hidden="true" />
      </nav>

      <CartSidebar />
    </>
  );
}
