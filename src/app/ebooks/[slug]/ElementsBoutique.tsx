"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag, Check } from "lucide-react";
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
  { href: "/", label: "Accueil" },
  { href: "/accompagnement", label: "Se faire accompagner", fort: true },
  { href: "/devenir-consultant", label: "Devenir consultant" },
  { href: "/packs", label: "Packs à prix réduit" },
  { href: "/nos-consultants", label: "Nos consultants" },
];

export function EnteteBoutique() {
  const [menu, setMenu] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="max-w-6xl mx-auto h-[65px] px-4 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-smartlife.jpeg" alt="Smart Life" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-semibold text-[17px] tracking-[-0.01em] text-[var(--g-encre)] truncate">Smart Life</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-6 text-[14.5px] text-[var(--g-gris)]">
          {LIENS.filter((l) => l.href !== "/" && l.href !== "/devenir-consultant").map((l) => <Link key={l.href} href={l.href} className="hover:text-[var(--g-encre)] transition-colors">{l.label}</Link>)}
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
      <div className="border-t border-[var(--g-ligne)] bg-white">
        <div className="max-w-6xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {RACCOURCIS.map((r) => (
            <Link key={r.href} href={r.href}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors ${r.fort ? "bg-[var(--g-jaune)] text-[var(--g-encre)] font-semibold" : "border border-[var(--g-ligne)] text-[var(--g-encre)] hover:border-[var(--g-encre)]"}`}>
              {r.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="bande-wax h-[10px]" aria-hidden="true" />
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
  { titre: "Livraison instantanée", texte: "Ton guide arrive en quelques secondes" },
  { titre: "Paiement sécurisé", texte: "Tes informations sont protégées" },
  { titre: "Mobile Money & carte", texte: "MTN, Orange, Wave, Visa…" },
  { titre: "Groupe privé WhatsApp", texte: "Échange avec d'autres entrepreneurs" },
  { titre: "Accès à vie", texte: "Retélécharge ton guide quand tu veux" },
  { titre: "Accompagnement possible", texte: "Un consultant du terrain à tes côtés" },
  { titre: "Aide sur WhatsApp", texte: "Une vraie personne te répond" },
  { titre: "14 960 clients", texte: "Partout en Afrique et dans la diaspora" },
];

export function PiedBoutique() {
  return (
    <footer className="bg-[var(--g-doux)]">
      <div className="bande-wax h-[18px]" aria-hidden="true" />
      <div className="max-w-6xl mx-auto px-4 pt-9 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6">
        {GARANTIES.map((g) => (
          <div key={g.titre} className="flex items-start gap-2.5">
            <Check size={17} strokeWidth={2.5} className="mt-[3px] flex-shrink-0 text-[var(--g-vert)]" />
            <div>
              <p className="text-[14.5px] font-semibold leading-tight text-[var(--g-encre)]">{g.titre}</p>
              <p className="mt-1 text-[13px] leading-snug text-[var(--g-gris)]">{g.texte}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col items-center gap-4 text-center">
        <a href="https://wa.me/237694176642" target="_blank" rel="noopener noreferrer"
          className="g-btn">
          Une question ? WhatsApp +237 694 176 642
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
