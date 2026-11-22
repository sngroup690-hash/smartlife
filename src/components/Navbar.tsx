"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, BookOpen, TrendingUp, Users } from "lucide-react";
import { useCartStore } from "@/lib/store";
import CartSidebar from "@/components/CartSidebar";
import CurrencySelector from "@/components/CurrencySelector";
import GlobalSearch from "@/components/GlobalSearch";
import { motion, AnimatePresence } from "framer-motion";

const PILLAR_LINKS = [
  { href: "/ebooks", label: "Ebooks", icon: BookOpen, color: "#27A827" },
  { href: "/accompagnement", label: "Accompagnement", icon: TrendingUp, color: "#E8B800" },
  { href: "/devenir-consultant", label: "Devenir Consultant", icon: Users, color: "#27A827" },
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
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`sticky top-0 z-50 bg-white/97 backdrop-blur-xl transition-shadow duration-300 ${
          scrolled ? "shadow-md" : "shadow-[0_1px_0_0_rgba(0,0,0,0.04)]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/logo-smartlife.jpeg"
                alt="SMART LIFE"
                width={152}
                height={50}
                className="h-11 w-auto rounded-md"
                priority
              />
            </Link>

            {/* 3 piliers — bien visibles sur desktop */}
            <div className="hidden lg:flex items-center gap-1">
              <Link
                href="/"
                className="px-3 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50"
              >
                Accueil
              </Link>

              {PILLAR_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="group flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 hover:bg-gray-50"
                  style={{ color: l.color }}
                >
                  <l.icon size={15} className="transition-transform duration-200 group-hover:scale-110" />
                  {l.label}
                </Link>
              ))}

              <Link
                href="/temoignages"
                className="px-3 py-2 text-[13px] font-medium text-[#C49A00] hover:text-[#A07800] transition-colors rounded-lg hover:bg-amber-50"
              >
                ⭐ Avis
              </Link>
            </div>

            {/* Actions droite */}
            <div className="flex items-center gap-1.5">
              <GlobalSearch />

              <div className="hidden xl:block">
                <CurrencySelector />
              </div>

              <Link
                href="/mon-espace"
                className="hidden md:flex items-center px-3.5 py-1.5 bg-[#E8B800] hover:bg-[#D4A017] text-black text-[12px] font-bold rounded-lg transition-colors duration-200"
              >
                Mon Espace
              </Link>

              <button
                onClick={openCart}
                className="relative p-2 text-gray-400 hover:text-gray-800 transition-colors duration-150 ml-0.5"
                title="Panier"
                aria-label="Ouvrir le panier"
              >
                <ShoppingCart size={19} strokeWidth={1.75} />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-[#E8B800] text-black text-[10px] font-bold rounded-full px-[3px] leading-none"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <CartSidebar />
    </>
  );
}
