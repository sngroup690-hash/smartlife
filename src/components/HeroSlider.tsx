"use client";

import { useRef } from "react";
import Link from "next/link";
import TitreDefilant from "@/components/TitreDefilant";

type SlideItem = {
  icon: string;
  title: string;
  subtitle: string;
  price?: string;
  color: string;
  href: string;
};

const SLIDES_ROW1: SlideItem[] = [
  { icon: "📖", title: "Gérer son Temps", subtitle: "Développement Personnel", price: "3 500 FCFA", color: "from-green-900 to-green-800", href: "/ebooks" },
  { icon: "🌱", title: "Agriculture Rentable", subtitle: "Agriculture & Cultures", price: "4 500 FCFA", color: "from-emerald-900 to-green-800", href: "/ebooks" },
  { icon: "💼", title: "Créer son Entreprise", subtitle: "Création d'Entreprises", price: "5 000 FCFA", color: "from-blue-900 to-indigo-800", href: "/ebooks" },
  { icon: "🐔", title: "Élevage Rentable", subtitle: "Élevage & Dresseurs", price: "3 500 FCFA", color: "from-orange-900 to-amber-800", href: "/ebooks" },
  { icon: "🤖", title: "Business IA & Tech", subtitle: "Numérique & IA", price: "6 000 FCFA", color: "from-cyan-900 to-blue-800", href: "/ebooks" },
  { icon: "🏥", title: "Santé & Bien-être", subtitle: "Santé & Soins Corporels", price: "3 500 FCFA", color: "from-pink-900 to-rose-800", href: "/ebooks" },
  { icon: "💰", title: "Gestion & Finance", subtitle: "Gestion, Droit & Finance", price: "4 000 FCFA", color: "from-yellow-900 to-amber-800", href: "/ebooks" },
  { icon: "🎨", title: "Fabrication Artisanale", subtitle: "Fabrication & Transformation", price: "3 500 FCFA", color: "from-yellow-900 to-amber-800", href: "/ebooks" },
];

const SLIDES_ROW2: SlideItem[] = [
  { icon: "📱", title: "Facebook Ads", subtitle: "Formation — Publicité & Traffic", price: "25 000 FCFA", color: "from-blue-900 to-sky-800", href: "/formation" },
  { icon: "🎬", title: "TikTok Ads", subtitle: "Formation — Contenu & Vidéo", price: "20 000 FCFA", color: "from-slate-900 to-gray-800", href: "/formation" },
  { icon: "📞", title: "Télévente & Closing", subtitle: "Formation — Télévente", price: "22 000 FCFA", color: "from-teal-900 to-emerald-800", href: "/formation" },
  { icon: "🏪", title: "Pressing & Blanchisserie", subtitle: "Accompagnement Entrepreneurial", color: "from-amber-900 to-yellow-800", href: "/accompagnement" },
  { icon: "🐟", title: "Pisciculture", subtitle: "Accompagnement Entrepreneurial", color: "from-cyan-900 to-teal-800", href: "/accompagnement" },
  { icon: "🍞", title: "Boulangerie & Pâtisserie", subtitle: "Accompagnement Entrepreneurial", color: "from-orange-900 to-red-800", href: "/accompagnement" },
  { icon: "💡", title: "Marketing Digital", subtitle: "Formation — Stratégie", price: "30 000 FCFA", color: "from-green-900 to-green-800", href: "/formation" },
  { icon: "🏪", title: "Commerce Général", subtitle: "Accompagnement Entrepreneurial", color: "from-green-900 to-emerald-800", href: "/accompagnement" },
];

function SlideCard({ item }: { item: SlideItem }) {
  return (
    <Link
      href={item.href}
      className={`flex-shrink-0 w-48 p-4 rounded-2xl bg-gradient-to-br ${item.color} border border-white/10 hover:border-white/30 transition-all cursor-pointer group`}
    >
      <div className="text-3xl mb-2">{item.icon}</div>
      <TitreDefilant texte={item.title} className="text-white font-bold text-sm mb-1" />
      <p className="text-gray-400 text-xs mb-2 line-clamp-1">{item.subtitle}</p>
      {item.price && (
        <p className="text-[#E8B800] font-bold text-xs">{item.price}</p>
      )}
    </Link>
  );
}

export default function HeroSlider() {
  const row1 = [...SLIDES_ROW1, ...SLIDES_ROW1];
  const row2 = [...SLIDES_ROW2, ...SLIDES_ROW2];

  return (
    <div className="relative w-full overflow-hidden py-4 space-y-4">
      {/* Dégradé gauche */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0e0e1a] to-transparent z-10 pointer-events-none" />
      {/* Dégradé droite */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0e0e1a] to-transparent z-10 pointer-events-none" />

      {/* Rangée 1 — défile vers la gauche */}
      <div className="flex gap-4 animate-marquee-left">
        {row1.map((item, i) => (
          <SlideCard key={i} item={item} />
        ))}
      </div>

      {/* Rangée 2 — défile vers la droite */}
      <div className="flex gap-4 animate-marquee-right">
        {row2.map((item, i) => (
          <SlideCard key={i} item={item} />
        ))}
      </div>
    </div>
  );
}
