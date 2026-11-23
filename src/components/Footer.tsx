import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Check } from "lucide-react";
import CurrencySelector from "@/components/CurrencySelector";

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const TikTokIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.850 4.85 0 0 1-1.01-.06z" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.260c.001-5.450 4.436-9.884 9.888-9.884 2.64 0 5.122 1.030 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.450-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.050 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.480-8.413z" />
  </svg>
);

const PILIERS = [
  { href: "/ebooks", label: "Ebooks & guides pratiques" },
  { href: "/accompagnement", label: "Accompagnement" },
  { href: "/devenir-consultant", label: "Devenir consultant" },
  { href: "/analyse-smart", label: "Analyse Smart : business d'avenir" },
  { href: "/conseils", label: "Conseils gratuits pour se lancer" },
  { href: "/temoignages", label: "Avis & témoignages" },
  { href: "/contact", label: "Contact" },
];
const RAYONS = [
  { href: "/ebooks?cat=" + encodeURIComponent("Élevage & Dresseurs"), label: "Élevage" },
  { href: "/ebooks?cat=" + encodeURIComponent("Agriculture & Cultures Rentables"), label: "Agriculture" },
  { href: "/ebooks?cat=" + encodeURIComponent("Fabrication Artisanale & Transformation"), label: "Fabrication artisanale" },
  { href: "/ebooks?cat=" + encodeURIComponent("Création d'Entreprises & Commerce Réel"), label: "Commerce & business" },
  { href: "/ebooks", label: "Tous les guides" },
];
const GARANTIES = ["Livraison instantanée", "Paiement sécurisé", "PDF à vie", "Satisfait ou remboursé", "82 % d'avis positifs sur 248 avis"];

// Style « Galerie » : fond blanc puis gris très doux, lignes fines, une seule couleur (vert forêt)
// et une bande wax en haut du pied de page. Pas de dégradés, pas d'émojis, pas de pastilles qui flottent.
export default function Footer() {
  return (
    <footer className="mt-0 bg-white text-[var(--g-encre)]">
      {/* Appel à l'accompagnement, sur toutes les pages */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-14">
        <div className="border-t border-[var(--g-ligne)] pt-10 grid lg:grid-cols-[1.3fr_1fr] gap-6 lg:items-end">
          <div>
            <p className="text-[14px] font-semibold text-[var(--g-vert)]">100 % gratuit</p>
            <p className="mt-2 text-[26px] sm:text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] max-w-[22ch]">
              Inscrivez-vous et déposez votre candidature gratuitement
            </p>
            <p className="mt-3 text-[16px] leading-[1.5] text-[var(--g-gris)] max-w-[52ch]">
              Faites-vous accompagner par un expert pour réussir votre projet : lancer votre activité ou faire grandir celle qui tourne déjà.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 lg:justify-end">
            <Link href="/accompagnement" className="g-btn">Déposer ma candidature</Link>
            <Link href="/register" className="g-btn-ghost">Créer mon compte gratuit</Link>
          </div>
        </div>
      </div>

      <div className="bande-wax h-[18px]" aria-hidden="true" />

      <div className="bg-[var(--g-doux)]">
        {/* Communauté WhatsApp */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-9 flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-[#dde2dd]">
          <div>
            <p className="text-[20px] sm:text-[22px] font-semibold tracking-[-0.015em]">
              Rejoignez <span data-compteur="14960" data-suffixe="">14 960</span> clients et visionnaires africains
            </p>
            <p className="mt-1 text-[15px] text-[var(--g-gris)]">Conseils, nouveaux guides et offres réservées, directement sur WhatsApp.</p>
          </div>
          <a href="https://wa.me/237694176642" target="_blank" rel="noopener noreferrer" className="g-btn whitespace-nowrap self-start md:self-auto">
            <WhatsAppIcon /> Nous écrire sur WhatsApp
          </a>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-10">
            <div className="col-span-2 lg:col-span-4">
              <Link href="/" className="inline-flex items-center gap-3">
                <Image src="/logo-smartlife.jpeg" alt="SMART LIFE" width={44} height={44} className="rounded-full object-cover" />
                <span className="text-[19px] font-semibold tracking-[-0.01em]">Smart Life</span>
              </Link>
              <p className="mt-4 text-[15.5px] leading-[1.55] text-[var(--g-gris)] max-w-[36ch]">
                L&apos;écosystème des visionnaires africains : des guides pratiques, un accompagnement par des experts du terrain et une communauté qui avance ensemble.
              </p>
              <div className="mt-5 flex gap-2">
                {[
                  { href: "https://www.facebook.com/share/19dqUPc2zp/", label: "Facebook", icone: <FacebookIcon /> },
                  { href: "https://www.tiktok.com/@smartlife547", label: "TikTok", icone: <TikTokIcon /> },
                  { href: "https://wa.me/237694176642", label: "WhatsApp", icone: <WhatsAppIcon /> },
                ].map((r) => (
                  <a key={r.label} href={r.href} target="_blank" rel="noopener noreferrer" aria-label={r.label}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-[var(--g-encre)] border border-[#dde2dd] hover:border-[var(--g-encre)] transition-colors">
                    {r.icone}
                  </a>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3">
              <p className="text-[14px] font-semibold mb-3">Smart Life</p>
              <ul className="space-y-2.5">
                {PILIERS.map((l) => (
                  <li key={l.href}><Link href={l.href} className="text-[14.5px] text-[var(--g-gris)] hover:text-[var(--g-encre)]">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <p className="text-[14px] font-semibold mb-3">Guides</p>
              <ul className="space-y-2.5">
                {RAYONS.map((l) => (
                  <li key={l.label}><Link href={l.href} className="text-[14.5px] text-[var(--g-gris)] hover:text-[var(--g-encre)]">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 lg:col-span-3">
              <p className="text-[14px] font-semibold mb-3">Contact</p>
              <ul className="space-y-3 text-[14.5px] text-[var(--g-gris)]">
                <li><a href="mailto:contact@smartlifecm.com" className="flex items-center gap-2.5 hover:text-[var(--g-encre)]"><Mail size={16} /> contact@smartlifecm.com</a></li>
                <li><a href="tel:+237694176642" className="flex items-center gap-2.5 hover:text-[var(--g-encre)]"><Phone size={16} /> +237 694 176 642</a></li>
                <li className="flex items-center gap-2.5"><MapPin size={16} /> Cameroun · toute l&apos;Afrique</li>
              </ul>
            </div>
          </div>

          <ul className="mt-12 pt-6 border-t border-[#dde2dd] flex flex-wrap gap-x-7 gap-y-3 text-[14px] text-[var(--g-gris)]">
            {GARANTIES.map((g) => (
              <li key={g} className="inline-flex items-center gap-2"><Check size={16} className="text-[var(--g-vert)]" strokeWidth={2.5} /> {g}</li>
            ))}
          </ul>
        </div>

        <div className="border-t border-[#dde2dd]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[13px] text-[var(--g-gris)]">© {new Date().getFullYear()} SMART LIFE. Tous droits réservés.</p>
            <div className="flex items-center gap-4 text-[13px] text-[var(--g-gris)]">
              <Link href="/mentions-legales" className="hover:text-[var(--g-encre)]">Mentions légales</Link>
              <Link href="/confidentialite" className="hover:text-[var(--g-encre)]">Confidentialité</Link>
              <Link href="/cgv" className="hover:text-[var(--g-encre)]">CGV</Link>
              <CurrencySelector />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
