"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag } from "lucide-react";
import CurrencySelector from "@/components/CurrencySelector";

const LIENS = [
  { href: "/", label: "Accueil" },
  { href: "/ebooks", label: "Produits" },
  { href: "/packs", label: "Packs" },
  { href: "/accompagnement", label: "Accompagnement" },
  { href: "/devenir-consultant", label: "Devenir consultant" },
  { href: "/temoignages", label: "Avis" },
  { href: "/contact", label: "Contact" },
];

// Raccourcis toujours visibles, même sur téléphone : on ne reste jamais « coincé » dans la boutique.
const RACCOURCIS = [
  { href: "/", label: "🏠 Accueil", fond: "#f7f7f8", texte: "#20252b" },
  { href: "/accompagnement", label: "🤝 Se faire accompagner", fond: "#27A827", texte: "#fff" },
  { href: "/devenir-consultant", label: "🚀 Devenir consultant", fond: "#E8B800", texte: "#fff" },
  { href: "/packs", label: "📦 Packs à prix réduit", fond: "#f7f7f8", texte: "#20252b" },
  { href: "/nos-consultants", label: "👥 Nos consultants", fond: "#f7f7f8", texte: "#20252b" },
];

export function EnteteBoutique() {
  const [menu, setMenu] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#e8e9eb]">
      <div className="max-w-6xl mx-auto h-[65px] px-4 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-smartlife.jpeg" alt="Smart Life" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-bold text-base text-black truncate">Smart Life</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-5 text-sm text-[#20252b]">
          {LIENS.filter((l) => l.href !== "/" && l.href !== "/devenir-consultant").map((l) => <Link key={l.href} href={l.href} className="hover:opacity-70">{l.label}</Link>)}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/mon-espace" className="hidden lg:flex items-center gap-1.5 text-sm text-[#20252b] hover:opacity-70">
            <ShoppingBag size={16} /> Mes achats
          </Link>
          <div className="rounded-full border border-[#d4d6d7] px-1"><CurrencySelector /></div>
          <button onClick={() => setMenu((v) => !v)} className="lg:hidden p-1 text-[#20252b]" aria-label="Menu">
            {menu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      <div className="border-t border-[#f1f2f3] bg-white">
        <div className="max-w-6xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {RACCOURCIS.map((r) => (
            <Link key={r.href} href={r.href}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12.5px] font-bold transition-transform hover:scale-105 ${r.href === "/devenir-consultant" || r.href === "/accompagnement" ? "cta-respire shadow-sm" : "border border-[#e8e9eb]"}`}
              style={{ background: r.fond, color: r.texte }}>
              {r.label}
            </Link>
          ))}
        </div>
      </div>
      {menu && (
        <div className="lg:hidden border-t border-[#e8e9eb] bg-white px-4 py-2">
          {[...LIENS, { href: "/mon-espace", label: "Mes achats" }].map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenu(false)} className="block py-3 text-[15px] text-[#20252b] border-b border-[#f1f2f3] last:border-0">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

const GARANTIES = [
  { icone: "⚡", titre: "Livraison instantanée", texte: "Ton guide arrive en quelques secondes" },
  { icone: "🔒", titre: "Paiement sécurisé", texte: "Tes informations sont protégées" },
  { icone: "📱", titre: "Mobile Money & carte", texte: "MTN, Orange, Wave, Visa…" },
  { icone: "👥", titre: "Groupe privé WhatsApp", texte: "Échange avec d'autres entrepreneurs" },
  { icone: "♾️", titre: "Accès à vie", texte: "Retélécharge ton guide quand tu veux" },
  { icone: "🤝", titre: "Accompagnement possible", texte: "Un consultant du terrain à tes côtés" },
  { icone: "💬", titre: "Aide sur WhatsApp", texte: "Une vraie personne te répond" },
  { icone: "🌍", titre: "14 960+ clients", texte: "Partout en Afrique et dans la diaspora" },
];

export function PiedBoutique() {
  return (
    <footer className="border-t border-[#e8e9eb] bg-white">
      <div className="max-w-6xl mx-auto px-4 pt-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {GARANTIES.map((g, i) => (
          <div key={g.titre}
            className="garantie-boutique group flex flex-col items-center gap-1.5 rounded-2xl px-3 py-4 text-center shadow-sm transition-transform hover:-translate-y-1"
            style={{ background: i % 2 === 0 ? "linear-gradient(135deg, #fffbea, #fff4c2)" : "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: `1.5px solid ${i % 2 === 0 ? "#E8B800" : "#27A827"}`, animationDelay: `${i * 0.25}s` }}>
            <span className="flex items-center justify-center w-11 h-11 rounded-full text-[22px] shadow-md group-hover:scale-110 transition-transform"
              style={{ background: i % 2 === 0 ? "#E8B800" : "#27A827" }}>{g.icone}</span>
            <span className="text-[13px] font-extrabold text-[#111827] leading-tight">{g.titre}</span>
            <span className="text-[11px] text-[#5c5e62] leading-snug">{g.texte}</span>
          </div>
        ))}
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col items-center gap-4 text-center">
        <a href="https://wa.me/237694176642" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[#25D366] text-[13px] font-semibold text-[#128C4A]">
          💬 Une question ? WhatsApp +237 694 176 642
        </a>
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-smartlife.jpeg" alt="Smart Life" className="w-7 h-7 rounded-md object-cover" />
          <span className="font-bold text-sm text-black">Smart Life</span>
        </div>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-[#717882]">
          <Link href="/mentions-legales" className="hover:underline">Mentions légales</Link>
          <Link href="/confidentialite" className="hover:underline">Confidentialité</Link>
          <Link href="/cgv" className="hover:underline">Conditions de vente</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
        </div>
        <p className="text-[12px] text-[#a9aeb5]">© {new Date().getFullYear()} Smart Life</p>
      </div>
    </footer>
  );
}

function finEffective(fin: string, cyclique: boolean, dureeHeures: number): number {
  const ancre = new Date(fin).getTime();
  if (!cyclique || dureeHeures <= 0) return ancre;
  const duree = dureeHeures * 3_600_000;
  const maintenant = Date.now();
  if (maintenant <= ancre) return ancre;
  return ancre + (Math.floor((maintenant - ancre) / duree) + 1) * duree;
}

export function CompteARebours({ fin, cyclique = false, dureeHeures = 24 }: { fin: string; cyclique?: boolean; dureeHeures?: number }) {
  const [reste, setReste] = useState<number | null>(null);
  useEffect(() => {
    const maj = () => setReste(Math.max(0, finEffective(fin, cyclique, dureeHeures) - Date.now()));
    maj();
    const id = setInterval(maj, 1000);
    return () => clearInterval(id);
  }, [fin, cyclique, dureeHeures]);
  if (reste === null) return null;
  const s = Math.floor(reste / 1000);
  const blocs: [number, string][] = [
    [Math.floor(s / 86400), "Jours"], [Math.floor((s % 86400) / 3600), "Heures"],
    [Math.floor((s % 3600) / 60), "Minutes"], [s % 60, "Secondes"],
  ];
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-[13px] font-bold text-[#0e0f10]">L&apos;offre se termine dans</p>
      <div className="flex items-start justify-center gap-1.5">
        {blocs.map(([v, l], i) => (
          <div key={l} className="flex items-start gap-1.5">
            <div className="flex flex-col items-center gap-1">
              <span className="w-10 h-10 rounded-md bg-[#f2f3f5] flex items-center justify-center text-[20px] font-bold text-black tabular-nums">
                {String(v).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-medium text-black">{l}</span>
            </div>
            {i < 3 && <span className="text-[18px] font-bold text-black leading-10">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
