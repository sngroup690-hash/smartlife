"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ChevronRight, Search, Home, BookOpen, Lightbulb, UserPlus, Users, MoreHorizontal } from "lucide-react";
import { useCartStore } from "@/lib/store";
import CurrencySelector from "@/components/CurrencySelector";

const DRAWER_LINKS = [
  { href: "/ebooks",              label: "Ebooks & Guides",     icon: "📚", desc: "Guides pratiques pour monter en compétences" },
  { href: "/accompagnement",      label: "Accompagnement",      icon: "🤝", desc: "Profitez de l'expertise de professionnels du terrain" },
  { href: "/nos-consultants",     label: "Nos Consultants",     icon: "👥", desc: "Notre réseau d'experts à votre service" },
  { href: "/devenir-consultant",  label: "Devenir Consultant",  icon: "💼", desc: "Partagez votre savoir et contribuez au changement" },
  { href: "/analyse-smart",       label: "Analyse Smart",       icon: "📊", desc: "Quel business lancer maintenant ?" },
  { href: "/conseils",            label: "Conseils gratuits",   icon: "💡", desc: "Comment se lancer, métier par métier" },
  { href: "/temoignages",         label: "Avis & Témoignages",  icon: "⭐", desc: "Ce que disent nos clients" },
  { href: "/contact",             label: "Contact",             icon: "📞", desc: "Nous contacter" },
];

const NAV_ITEMS = [
  { href: "/", label: "Accueil", icon: Home, color: "#E8B800", activeColor: "#E8B800" },
  { href: "/ebooks", label: "Guides", icon: BookOpen, color: "#27A827", activeColor: "#27A827" },
  { href: "/conseils", label: "Conseils\ngratuits", icon: Lightbulb, color: "#E8B800", activeColor: "#E8B800" },
  { href: "/nos-consultants", label: "Nos\nConsultants", icon: Users, color: "#27A827", activeColor: "#27A827" },
  { href: "/devenir-consultant", label: "Devenir\nConsultant", icon: UserPlus, color: "#E8B800", activeColor: "#E8B800" },
];

export default function BottomNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { openCart, items } = useCartStore();
  const cartCount = items.filter((i) => i.type !== "formation").length;

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Barre fixe en bas, mobile/tablette uniquement : style « Galerie » (blanche, plate, sobre) ── */}
      <nav
        className="lg:hidden fixed left-0 right-0 bottom-0 z-50 bg-white border-t border-[var(--g-ligne)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-stretch h-[60px] px-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="menu-touche flex-1 flex flex-col items-center justify-center gap-[3px]"
                aria-current={active ? "page" : undefined}
              >
                <Icon size={21} strokeWidth={active ? 2.3 : 1.8} style={{ color: active ? "var(--g-encre)" : "var(--g-gris)" }} />
                <span
                  className="leading-[1.1] text-center whitespace-pre-line"
                  style={{ fontSize: "10.5px", fontWeight: active ? 700 : 500, color: active ? "var(--g-encre)" : "var(--g-gris)" }}
                >
                  {item.label}
                </span>
                <span className="h-[3px] w-4 rounded-full" style={{ background: "var(--g-jaune)", opacity: active ? 1 : 0 }} />
              </Link>
            );
          })}

          <button
            onClick={() => setDrawerOpen(true)}
            className="menu-touche flex-1 flex flex-col items-center justify-center gap-[3px]"
          >
            <MoreHorizontal size={21} strokeWidth={1.8} style={{ color: "var(--g-gris)" }} />
            <span style={{ fontSize: "10.5px", fontWeight: 500, color: "var(--g-gris)" }}>Plus</span>
            <span className="h-[3px] w-4" />
          </button>
        </div>
      </nav>

      {/* ── Overlay ── */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* ── Drawer slide-up ── */}
      <div
        className={`lg:hidden fixed left-0 right-0 bottom-0 z-[70] bg-white rounded-t-[18px] shadow-2xl transition-transform duration-300 ease-out`}
        style={{
          maxHeight: "88vh",
          transform: drawerOpen ? "translateY(0)" : "translateY(100%)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Poignée */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-smartlife.jpeg" alt="SmartLife" className="h-8 w-auto rounded-md object-cover" />
            <span className="font-bold text-gray-900 text-base">Smart Life</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: "calc(88vh - 90px)" }}>

          {/* Barre de recherche */}
          <button
            onClick={() => {
              setDrawerOpen(false);
              window.dispatchEvent(new CustomEvent("open-global-search"));
            }}
            className="flex items-center gap-3 w-full px-4 py-3 mx-0 mt-3 mb-1 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors text-left"
          >
            <Search size={15} className="text-gray-400 shrink-0" />
            <span className="text-sm text-gray-400">Rechercher ebooks, accompagnement…</span>
          </button>

          {/* Boutons compte */}
          <div className="px-4 pt-3 pb-3 flex gap-2.5">
            <Link
              href="/login"
              onClick={() => setDrawerOpen(false)}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-semibold text-sm text-center rounded-xl hover:bg-gray-50 transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/mon-espace"
              onClick={() => setDrawerOpen(false)}
              className="flex-1 py-2.5 bg-[var(--g-jaune)] text-[var(--g-encre)] font-semibold text-sm text-center rounded-[10px] transition-colors"
            >
              Mon espace
            </Link>
          </div>

          {/* Liens de navigation */}
          <div className="px-2 pb-2">
            {DRAWER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-3.5 rounded-xl mb-0.5 transition-colors ${
                  isActive(link.href)
                    ? "bg-[var(--g-doux)] text-[var(--g-encre)]"
                    : "hover:bg-gray-50 text-gray-800"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{link.label}</p>
                  <p className="text-gray-400 text-xs leading-tight">{link.desc}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
              </Link>
            ))}
          </div>

          {/* CTA Devenir Consultant */}
          <div className="px-4 pt-2 pb-4">
            <Link
              href="/devenir-consultant"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center justify-center gap-2 py-3.5 border border-[var(--g-ligne)] text-[var(--g-encre)] font-semibold text-sm rounded-[10px]"
            >
              Devenir consultant
            </Link>
          </div>

          {/* Sélecteur de devise */}
          <div className="px-5 pb-6 border-t border-gray-100 pt-3">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Devise</p>
            <CurrencySelector />
          </div>

        </div>
      </div>
    </>
  );
}
