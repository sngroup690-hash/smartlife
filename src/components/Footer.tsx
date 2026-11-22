import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Download, ShieldCheck, Zap, CheckCircle, Star } from "lucide-react";
import CurrencySelector from "@/components/CurrencySelector";

const TRUST_BADGES = [
  { icon: Download, label: "PDF téléchargeable", desc: "Lisez sur tous vos appareils" },
  { icon: Mail, label: "Envoyé par email", desc: "Reçu immédiatement après paiement" },
  { icon: Zap, label: "Accès instantané", desc: "Disponible dès la confirmation" },
  { icon: ShieldCheck, label: "Paiement sécurisé", desc: "Mobile Money, Visa, PayPal" },
];

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const TikTokIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/">
              <Image
                src="/logo-smartlife.jpeg"
                alt="SMART LIFE"
                width={180}
                height={60}
                className="h-16 w-auto rounded-lg"
              />
            </Link>
            <p className="text-gray-900 font-bold text-sm leading-relaxed uppercase tracking-wide mb-1">
              Smart Life : L&apos;acteur d&apos;un quotidien plus simple pour vous
            </p>
            <p className="text-gray-500 text-xs leading-relaxed">
              La plateforme des visionnaires africains : ebooks pratiques, accompagnement entrepreneurial et réseau de consultants pour transformer vos compétences en valeur.
            </p>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/share/19dqUPc2zp/" target="_blank" rel="noopener noreferrer" aria-label="Facebook SMART LIFE" className="w-9 h-9 rounded-lg bg-white hover:bg-green-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:text-[#27A827] transition-all">
                <FacebookIcon />
              </a>
              <a href="https://www.tiktok.com/@smartlife547" target="_blank" rel="noopener noreferrer" aria-label="TikTok SMART LIFE" className="w-9 h-9 rounded-lg bg-white hover:bg-green-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:text-[#27A827] transition-all">
                <TikTokIcon />
              </a>
            </div>
          </div>

          {/* Nos Piliers */}
          <div>
            <h3 className="text-gray-900 font-bold mb-4">Nos Piliers</h3>
            <ul className="space-y-2">
              {[
                { href: "/ebooks", label: "Ebooks & Guides" },
                { href: "/accompagnement", label: "Accompagnement" },
                { href: "/devenir-consultant", label: "Devenir Consultant" },
                { href: "/temoignages", label: "Avis & Témoignages" },
                { href: "/contact", label: "Contact" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-gray-600 hover:text-[#27A827] text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ebooks */}
          <div>
            <h3 className="text-gray-900 font-bold mb-4">Ebooks</h3>
            <ul className="space-y-2">
              {[
                { href: "/ebooks?cat=Marketing", label: "Marketing Digital" },
                { href: "/ebooks?cat=Entrepreneuriat", label: "Entrepreneuriat" },
                { href: "/ebooks?cat=Finance", label: "Finance & Investissement" },
                { href: "/ebooks", label: "Tous les ebooks" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-gray-600 hover:text-[#27A827] text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-gray-900 font-bold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gray-600 text-sm">
                <Mail size={15} className="text-[#27A827] flex-shrink-0" />
                contact@smartlifecm.com
              </li>
              <li className="flex items-center gap-3 text-gray-600 text-sm">
                <Phone size={15} className="text-[#27A827] flex-shrink-0" />
                +237 694 176 642
              </li>
              <li className="flex items-center gap-3 text-gray-600 text-sm">
                <MapPin size={15} className="text-[#27A827] flex-shrink-0" />
                Cameroun
              </li>
            </ul>
          </div>
        </div>

        {/* Bande de réassurance */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mb-8">
            {/* Social proof compact */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["MN", "PK", "SF"].map((init) => (
                  <div key={init} className="w-7 h-7 rounded-full bg-[#27A827]/10 border-2 border-white flex items-center justify-center text-xs font-bold text-[#1e7a1e]">
                    {init}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={11} className="fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-500 text-xs mt-0.5">
                  <span className="font-bold text-[#1e7a1e]">15 000+</span> clients satisfaits
                </p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-gray-200" />
            {/* Badges */}
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-gray-500">
                <Icon size={13} className="text-[#27A827] flex-shrink-0" />
                <span className="text-xs font-medium">{label}</span>
              </div>
            ))}
            <div className="hidden sm:block w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-1.5 text-[#27A827] text-xs font-medium">
              <CheckCircle size={13} />
              Satisfait ou remboursé
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2025 SMART LIFE. Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <Link href="/mentions-legales" className="text-gray-500 hover:text-[#27A827] text-sm transition-colors">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="text-gray-500 hover:text-[#27A827] text-sm transition-colors">
              Confidentialité
            </Link>
            <Link href="/cgv" className="text-gray-500 hover:text-[#27A827] text-sm transition-colors">
              CGV
            </Link>
            <div className="h-4 w-px bg-gray-300 hidden md:block" />
            <CurrencySelector />
          </div>
        </div>
      </div>
    </footer>
  );
}
