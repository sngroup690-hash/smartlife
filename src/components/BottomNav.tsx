"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ChevronRight, Search, Home, BookOpen, Handshake, UserPlus, Users, MoreHorizontal } from "lucide-react";
import { useCartStore } from "@/lib/store";
import CurrencySelector from "@/components/CurrencySelector";

const DRAWER_LINKS = [
  { href: "/ebooks",              label: "Ebooks & Guides",     icon: "📚", desc: "Guides pratiques pour monter en compétences" },
  { href: "/accompagnement",      label: "Accompagnement",      icon: "🤝", desc: "Profitez de l'expertise de professionnels du terrain" },
  { href: "/nos-consultants",     label: "Nos Consultants",     icon: "👥", desc: "Notre réseau d'experts à votre service" },
  { href: "/devenir-consultant",  label: "Devenir Consultant",  icon: "💼", desc: "Partagez votre savoir et contribuez au changement" },
  { href: "/temoignages",         label: "Avis & Témoignages",  icon: "⭐", desc: "Ce que disent nos clients" },
  { href: "/contact",             label: "Contact",             icon: "📞", desc: "Nous contacter" },
];

const NAV_ITEMS = [
  { href: "/", label: "Accueil", icon: Home, color: "#E8B800", activeColor: "#E8B800" },
  { href: "/ebooks", label: "Ebooks", icon: BookOpen, color: "#27A827", activeColor: "#27A827" },
  { href: "/accompagnement", label: "Accompagnement", icon: Handshake, color: "#E8B800", activeColor: "#E8B800", center: true },
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
      {/* ── Barre fixe en bas — mobile/tablette uniquement ── */}
      <nav
        className="lg:hidden fixed left-2 right-2 z-50 rounded-[1.75rem] border border-white/70 shadow-[0_10px_35px_-8px_rgba(0,0,0,0.28)]"
        style={{
          bottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
          background: "linear-gradient(180deg, #ffffff 0%, #fafcf6 100%)",
        }}
      >
        <div className="flex items-end h-[66px] px-1.5">

          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const lines = item.label.split("\n");

            if (item.center) {
              return (
                <Link key={item.href} href={item.href} className="menu-touche flex-[1.25] flex flex-col items-center justify-center -mt-6 pb-1.5">
                  <span className="relative flex items-center justify-center">
                    {!active && <span className="menu-halo absolute inset-0 rounded-full" style={{ background: "#E8B800" }} />}
                    <span
                      className="relative w-[58px] h-[58px] rounded-full flex items-center justify-center border-4 border-white transition-transform duration-300"
                      style={{
                        background: active ? "linear-gradient(135deg, #27A827 0%, #1b7a1b 100%)" : "linear-gradient(135deg, #E8B800 0%, #27A827 100%)",
                        boxShadow: "0 8px 20px -6px rgba(39,168,39,0.7)",
                        transform: active ? "scale(1.06)" : "scale(1)",
                      }}
                    >
                      <Icon size={24} style={{ color: "#fff" }} strokeWidth={2.3} />
                    </span>
                  </span>
                  <span className="text-[9.5px] font-extrabold mt-1 leading-tight text-center" style={{ color: active ? "#1b7a1b" : "#374151" }}>
                    Accompagnement
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="menu-touche flex-1 flex flex-col items-center justify-center gap-[2px] pb-1.5 pt-2"
              >
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    background: active ? item.activeColor : `${item.color}1f`,
                    boxShadow: active ? `0 6px 14px -6px ${item.activeColor}` : "none",
                    transform: active ? "translateY(-3px)" : "none",
                  }}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 2.1} style={{ color: active ? "#fff" : item.color === "#E8B800" ? "#b38f00" : "#1e7a1e" }} />
                </span>
                {lines.map((line, i) => (
                  <span
                    key={i}
                    className="leading-[1.1] text-center transition-colors duration-200"
                    style={{ fontSize: "9.5px", fontWeight: active ? 800 : 600, color: active ? "#111827" : "#4b5563" }}
                  >
                    {line}
                  </span>
                ))}
                <span className="h-1 w-1 rounded-full transition-opacity duration-300" style={{ background: item.activeColor, opacity: active ? 1 : 0 }} />
              </Link>
            );
          })}

          {/* Menu / Plus */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="menu-touche flex-1 flex flex-col items-center justify-center gap-[2px] pb-1.5 pt-2"
          >
            <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#1118270f" }}>
              <MoreHorizontal size={19} strokeWidth={2.3} style={{ color: "#374151" }} />
            </span>
            <span className="text-[9.5px] font-semibold" style={{ color: "#4b5563" }}>Plus</span>
            <span className="h-1 w-1" />
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
        className={`lg:hidden fixed left-0 right-0 bottom-0 z-[70] bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out`}
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
              className="flex-1 py-2.5 bg-[#E8B800] hover:bg-[#D4A017] text-black font-bold text-sm text-center rounded-xl transition-colors"
            >
              Mon Espace
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
                    ? "bg-[#E8B800]/10 text-[#B8920A]"
                    : "hover:bg-gray-50 text-gray-800"
                }`}
              >
                <span className="text-xl w-8 flex-shrink-0 text-center">{link.icon}</span>
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
              className="flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-black font-bold text-sm rounded-2xl shadow-md"
            >
              🚀 Devenir Consultant
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
