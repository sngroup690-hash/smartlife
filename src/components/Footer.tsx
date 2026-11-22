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
const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/">
              <Image
                src="/logo-smartlife.jpeg"
                alt="SMART LIFE"
                width={160}
                height={50}
                className="h-12 w-auto rounded-lg"
              />
            </Link>
            <p className="text-gray-900 font-bold text-xs leading-snug uppercase tracking-wide">
              Smart Life : L&apos;acteur d&apos;un quotidien plus simple pour vous
            </p>
            <p className="text-gray-500 text-xs leading-relaxed">
              L&apos;écosystème des visionnaires africains : ebooks pratiques, accompagnement entrepreneurial et réseau de consultants pour transformer vos compétences en valeur.
            </p>
            <div className="flex gap-2">
              <a href="https://www.facebook.com/share/19dqUPc2zp/" target="_blank" rel="noopener noreferrer" aria-label="Facebook SMART LIFE" className="w-9 h-9 rounded-lg flex items-center justify-center text-white transition-all hover:opacity-80" style={{ background: "#1877F2" }}>
                <FacebookIcon />
              </a>
              <a href="https://www.tiktok.com/@smartlife547" target="_blank" rel="noopener noreferrer" aria-label="TikTok SMART LIFE" className="w-9 h-9 rounded-lg flex items-center justify-center text-white transition-all hover:opacity-80" style={{ background: "linear-gradient(135deg, #69C9D0, #EE1D52)" }}>
                <TikTokIcon />
              </a>
              <a href="https://wa.me/237694176642" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp SMART LIFE" className="w-9 h-9 rounded-lg flex items-center justify-center text-white transition-all hover:opacity-80" style={{ background: "#25D366" }}>
                <WhatsAppIcon />
              </a>
            </div>
          </div>

          {/* Nos Piliers */}
          <div>
            <h3 className="text-gray-900 font-bold mb-4">Nos Piliers</h3>
            <ul className="space-y-2">
              {[
                { href: "/ebooks", label: "Ebooks & Guides", color: "" },
                { href: "/accompagnement", label: "Accompagnement", color: "" },
                { href: "/devenir-consultant", label: "Devenir Consultant", color: "#27A827" },
                { href: "/temoignages", label: "Avis & Témoignages", color: "" },
                { href: "/contact", label: "Contact", color: "" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`text-sm transition-colors hover:text-[#27A827] ${l.color ? "font-bold" : "text-gray-600"}`}
                    style={l.color ? { color: l.color } : undefined}
                  >
                    {l.color ? `✦ ${l.label}` : l.label}
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
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-6">
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

        <div className="pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3">
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
