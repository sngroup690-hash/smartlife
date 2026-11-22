"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag } from "lucide-react";
import CurrencySelector from "@/components/CurrencySelector";

const LIENS = [
  { href: "/ebooks", label: "Produits" },
  { href: "/accompagnement", label: "Accompagnement" },
  { href: "/temoignages", label: "Avis" },
  { href: "/contact", label: "Contact" },
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
        <nav className="hidden lg:flex items-center gap-6 text-sm text-[#20252b]">
          {LIENS.map((l) => <Link key={l.href} href={l.href} className="hover:opacity-70">{l.label}</Link>)}
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

export function PiedBoutique() {
  return (
    <footer className="border-t border-[#e8e9eb] bg-white">
      <div className="max-w-6xl mx-auto px-4 pt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {["⚡ Livraison instantanée", "🔒 Paiement sécurisé", "📱 Mobile Money & carte", "👥 Groupe privé WhatsApp"].map((g) => (
          <span key={g} className="rounded-xl bg-[#f7f7f8] px-3 py-2.5 text-center text-[12px] font-semibold text-[#20252b]">{g}</span>
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
