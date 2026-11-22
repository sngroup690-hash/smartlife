import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Download, ShieldCheck, Zap, CheckCircle, Star } from "lucide-react";
import CurrencySelector from "@/components/CurrencySelector";

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

const PILIERS = [
  { href: "/ebooks", label: "Ebooks & guides pratiques" },
  { href: "/accompagnement", label: "Accompagnement" },
  { href: "/devenir-consultant", label: "Devenir consultant" },
  { href: "/conseils", label: "Conseils gratuits pour se lancer" },
  { href: "/temoignages", label: "Avis & témoignages" },
  { href: "/contact", label: "Contact" },
];
const RAYONS = [
  { href: "/ebooks?cat=" + encodeURIComponent("Élevage & Dresseurs"), label: "Élevage" },
  { href: "/ebooks?cat=" + encodeURIComponent("Agriculture & Cultures Rentables"), label: "Agriculture" },
  { href: "/ebooks?cat=" + encodeURIComponent("Fabrication Artisanale & Transformation"), label: "Fabrication artisanale" },
  { href: "/ebooks?cat=" + encodeURIComponent("Création d'Entreprises & Commerce Réel"), label: "Commerce & business" },
  { href: "/ebooks", label: "Tous les guides →" },
];
const GARANTIES = [
  { icon: Zap, label: "Livraison instantanée" },
  { icon: ShieldCheck, label: "Paiement sécurisé" },
  { icon: Download, label: "PDF à vie" },
  { icon: CheckCircle, label: "Satisfait ou remboursé" },
];

export default function Footer() {
  return (
    <footer className="mt-0">
      {/* Appel à l'accompagnement — comble le vide avant le pied de page, sur toutes les pages */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-10" style={{ background: "#fff" }}>
        <div className="relative max-w-5xl mx-auto overflow-hidden rounded-3xl p-6 sm:p-9 text-center shadow-xl"
          style={{ background: "linear-gradient(135deg, #fffbea 0%, #ffffff 45%, #f0fdf4 100%)", border: "2px solid #E8B800" }}>
          <span className="absolute -top-10 -left-10 w-36 h-36 rounded-full opacity-40 animate-pulse" style={{ background: "#E8B800", filter: "blur(40px)" }} />
          <span className="absolute -bottom-12 -right-10 w-40 h-40 rounded-full opacity-30 animate-pulse" style={{ background: "#27A827", filter: "blur(44px)" }} />
          <p className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold mb-3" style={{ background: "#27A827", color: "#fff" }}>
            🤝 100 % gratuit
          </p>
          <p className="relative text-[22px] sm:text-[28px] font-extrabold leading-tight text-[#111827]">
            Inscrivez-vous et déposez votre candidature <span className="texte-brillant">gratuitement</span>
          </p>
          <p className="relative mt-2 text-[15px] sm:text-base text-[#393c41] max-w-2xl mx-auto leading-relaxed">
            Faites-vous accompagner par un expert pour réussir votre projet : lancer votre activité ou faire grandir celle qui tourne déjà.
          </p>
          <div className="relative mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/accompagnement" className="cta-clignote inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl text-[15px] font-bold shadow-lg"
              style={{ background: "linear-gradient(135deg, #E8B800, #27A827)", color: "#fff" }}>
              Déposer ma candidature gratuite →
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center h-12 px-6 rounded-xl text-[15px] font-bold border-2 border-[#27A827] text-[#1e7a1e] hover:bg-[#f0fdf4] transition-colors">
              Créer mon compte gratuit
            </Link>
          </div>
        </div>
      </div>

      {/* Invitation à la communauté */}
      <div className="bg-gradient-to-br from-[#1b7a1b] via-[#27A827] to-[#1f8f1f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
          <div>
            <p className="text-[20px] sm:text-2xl font-extrabold" style={{ color: "#fff" }}>
              Rejoins{" "}
              <span data-compteur="14960" data-suffixe="+" className="inline-block min-w-[4.2em] px-1.5 rounded-lg" style={{ background: "#E8B800", color: "#fff" }}>14 960+</span>{" "}
              clients et visionnaires africains
            </p>
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>Conseils, nouveaux guides et offres réservées, directement sur WhatsApp.</p>
          </div>
          <a href="https://wa.me/237694176642" target="_blank" rel="noopener noreferrer"
            className="cta-respire flex items-center gap-2 h-12 px-6 rounded-xl bg-white font-bold text-[15px] text-[#128C4A] shadow-lg hover:scale-[1.02] transition-transform whitespace-nowrap">
            <WhatsAppIcon /> Nous écrire sur WhatsApp
          </a>
        </div>
      </div>

      <div className="bg-[#fbfaf6] border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Marque + carte « Pourquoi Smart Life » */}
          <div className="grid md:grid-cols-2 gap-8 items-center pb-9 mb-9 border-b border-gray-200">
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                <Image src="/logo-smartlife.jpeg" alt="SMART LIFE" width={52} height={52} className="rounded-full object-cover shadow-md" />
                <span className="text-xl font-extrabold text-[#111827]">Smart Life</span>
              </Link>
              <p className="mt-4 text-[16px] sm:text-[17px] font-semibold leading-relaxed text-[#374151] max-w-md">
                L&apos;<span className="font-extrabold text-[#c99a00]">écosystème</span> des{" "}
                <span className="font-extrabold text-[#1e7a1e]">visionnaires africains</span> : des guides pratiques, un{" "}
                <span className="font-extrabold text-[#c99a00]">accompagnement</span> par des{" "}
                <span className="font-extrabold text-[#1e7a1e]">experts du terrain</span> et une{" "}
                <span className="font-extrabold text-[#c99a00]">communauté</span>{" "}
                <span className="font-extrabold text-[#1e7a1e]">qui avance ensemble</span>.
              </p>
              <div className="mt-5 flex gap-2.5">
                {[
                  { href: "https://www.facebook.com/share/19dqUPc2zp/", label: "Facebook", icone: <FacebookIcon />, fond: "#1877F2" },
                  { href: "https://www.tiktok.com/@smartlife547", label: "TikTok", icone: <TikTokIcon />, fond: "#111827" },
                  { href: "https://wa.me/237694176642", label: "WhatsApp", icone: <WhatsAppIcon />, fond: "#25D366" },
                ].map((r) => (
                  <a key={r.label} href={r.href} target="_blank" rel="noopener noreferrer" aria-label={r.label}
                    className="w-11 h-11 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                    style={{ backgroundColor: r.fond, color: "#fff" }}>
                    {r.icone}
                  </a>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] p-6 shadow-xl" style={{ background: "linear-gradient(135deg, #1b7a1b 0%, #27A827 60%, #b8a000 100%)" }}>
              <span className="accueil-bulle" style={{ top: "-180px", right: "-140px", background: "#E8B800", opacity: 0.35 }} />
              <p className="relative text-[13px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.85)" }}>Pourquoi Smart Life ?</p>
              <div className="relative mt-4 grid grid-cols-3 gap-2.5 text-center">
                {[
                  { n: "14 960+", l: "clients" },
                  { n: "82 %", l: "avis positifs" },
                  { n: "248", l: "avis clients" },
                ].map((c) => (
                  <div key={c.l} className="rounded-2xl px-2 py-3" style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.25)" }}>
                    <p className="text-[20px] sm:text-[24px] font-black leading-none" style={{ color: "#fff" }}>{c.n}</p>
                    <p className="mt-1 text-[11.5px] font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>{c.l}</p>
                  </div>
                ))}
              </div>
              <div className="relative mt-4 flex flex-wrap gap-2">
                <Link href="/ebooks" className="bouton-reflet relative overflow-hidden inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[14px] font-extrabold shadow-lg" style={{ background: "#fff", color: "#1b7a1b" }}>
                  📚 Voir la boutique
                </Link>
                <Link href="/accompagnement" className="cta-respire inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[14px] font-extrabold shadow-lg" style={{ background: "#E8B800", color: "#fff" }}>
                  🤝 Être accompagné
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-8">
            {/* Nos piliers */}
            <div className="lg:col-span-4">
              <p className="text-[13px] font-extrabold uppercase tracking-wider text-[#27A827] mb-3">Nos piliers</p>
              <ul className="space-y-2.5">
                {PILIERS.map((l) => (
                  <li key={l.href}><Link href={l.href} className="text-[14px] text-[#374151] hover:text-[#27A827]">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Guides */}
            <div className="lg:col-span-4">
              <p className="text-[13px] font-extrabold uppercase tracking-wider text-[#27A827] mb-3">Guides</p>
              <ul className="space-y-2.5">
                {RAYONS.map((l) => (
                  <li key={l.label}><Link href={l.href} className="text-[14px] text-[#374151] hover:text-[#27A827]">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="col-span-2 lg:col-span-4">
              <p className="text-[13px] font-extrabold uppercase tracking-wider text-[#27A827] mb-3">Contact</p>
              <ul className="space-y-3 text-[14px] text-[#374151]">
                <li><a href="mailto:contact@smartlifecm.com" className="flex items-center gap-2.5 hover:text-[#27A827]"><Mail size={16} className="text-[#27A827]" /> contact@smartlifecm.com</a></li>
                <li><a href="tel:+237694176642" className="flex items-center gap-2.5 hover:text-[#27A827]"><Phone size={16} className="text-[#27A827]" /> +237 694 176 642</a></li>
                <li className="flex items-center gap-2.5"><MapPin size={16} className="text-[#27A827]" /> Cameroun · toute l&apos;Afrique</li>
              </ul>
            </div>
          </div>

          {/* Garanties */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {GARANTIES.map(({ icon: Icone, label }, i) => (
              <div key={label} className="garantie-boutique flex items-center gap-2.5 rounded-full px-3 py-2.5 shadow-sm"
                style={{ background: i % 2 === 0 ? "#fffbea" : "#f0fdf4", border: `1.5px solid ${i % 2 === 0 ? "#E8B800" : "#27A827"}`, animationDelay: `${i * 0.3}s` }}>
                <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow" style={{ background: i % 2 === 0 ? "#E8B800" : "#27A827" }}>
                  <Icone size={17} style={{ color: "#fff" }} />
                </span>
                <span className="text-[12.5px] font-extrabold text-[#111827] leading-tight">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[13px] text-[#374151]">
            <span className="flex">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={14} className="fill-[#E8B800] text-[#E8B800]" />)}</span>
            <span><strong className="text-[#1e7a1e]" data-compteur="14960" data-suffixe="+">14 960+</strong> clients</span>
          </div>
        </div>

        {/* Bas de page */}
        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-[#6b7280]">© {new Date().getFullYear()} SMART LIFE. Tous droits réservés.</p>
            <div className="flex items-center gap-4 text-[12px] text-[#6b7280]">
              <Link href="/mentions-legales" className="hover:text-[#27A827]">Mentions légales</Link>
              <Link href="/confidentialite" className="hover:text-[#27A827]">Confidentialité</Link>
              <Link href="/cgv" className="hover:text-[#27A827]">CGV</Link>
              <CurrencySelector />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
