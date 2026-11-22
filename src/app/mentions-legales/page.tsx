import Link from "next/link";
import { Scale, Building2, Globe, Mail, Phone, MapPin, Shield } from "lucide-react";

export const metadata = {
  title: "Mentions légales – SMART LIFE",
  description: "Mentions légales de la plateforme SMART LIFE, studio créatif digital au Cameroun.",
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-3">
    <h2 className="text-gray-900 font-bold text-lg flex items-center gap-2">{title}</h2>
    <div className="text-gray-600 text-sm leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-medium mb-6">
          <Scale size={13} />
          Informations légales
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Mentions <span className="gradient-text">Légales</span>
        </h1>
        <p className="text-gray-600 text-base max-w-xl mx-auto">
          Conformément aux obligations légales en vigueur, voici les informations légales relatives à la plateforme SMART LIFE.
        </p>
        <p className="text-gray-600 text-xs mt-4">Dernière mise à jour : Septembre 2025</p>
      </div>

      <div className="space-y-5">
        {/* Éditeur */}
        <Section title="1. Éditeur du site">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Building2 size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-900 text-sm font-medium">Dénomination sociale</p>
                <p>SMART LIFE</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-900 text-sm font-medium">Activité</p>
                <p>Studio créatif digital – ebooks, voix off professionnelles, créations vidéo, sourcing produits et accompagnement entrepreneurial</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-900 text-sm font-medium">Siège social</p>
                <p>Cameroun</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-900 text-sm font-medium">Contact</p>
                <a href="mailto:contact@smartlifecm.com" className="text-green-400 hover:text-green-300 transition-colors">
                  contact@smartlifecm.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-900 text-sm font-medium">Téléphone / WhatsApp</p>
                <p>+237 694 176 642</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Directeur de publication */}
        <Section title="2. Directeur de la publication">
          <p>
            Le directeur de la publication est le responsable légal de l&apos;entreprise SMART LIFE.
            Toute demande relative au contenu éditorial du site peut être adressée à{" "}
            <a href="mailto:contact@smartlifecm.com" className="text-green-400 hover:text-green-300 transition-colors">
              contact@smartlifecm.com
            </a>.
          </p>
        </Section>

        {/* Hébergement */}
        <Section title="3. Hébergement">
          <p>
            Le site <strong className="text-gray-900">smartlifecm.com</strong> est hébergé par un prestataire
            d&apos;hébergement professionnel. Les serveurs assurent la disponibilité et la sécurité
            de la plateforme 24h/24, 7j/7. Pour toute question technique relative à l&apos;hébergement,
            contacter{" "}
            <a href="mailto:contact@smartlifecm.com" className="text-green-400 hover:text-green-300 transition-colors">
              contact@smartlifecm.com
            </a>.
          </p>
        </Section>

        {/* Propriété intellectuelle */}
        <Section title="4. Propriété intellectuelle">
          <p>
            L&apos;ensemble du contenu de ce site (textes, images, logos, ebooks, vidéos, illustrations,
            données) est la propriété exclusive de SMART LIFE ou de ses partenaires et est protégé
            par les lois camerounaises et internationales relatives à la propriété intellectuelle.
          </p>
          <p>
            Toute reproduction, représentation, modification, publication, adaptation ou exploitation,
            totale ou partielle, par quelque procédé que ce soit, sans l&apos;autorisation écrite préalable
            de SMART LIFE, est strictement interdite et constitue une contrefaçon sanctionnée par la loi.
          </p>
          <p>
            Les ebooks et contenus numériques achetés sur la plateforme sont destinés à un usage
            strictement personnel et non commercial. Toute revente ou redistribution non autorisée
            est susceptible de poursuites.
          </p>
        </Section>

        {/* Responsabilité */}
        <Section title="5. Limitation de responsabilité">
          <p>
            SMART LIFE s&apos;efforce de fournir des informations exactes et à jour sur ce site.
            Cependant, la société ne peut garantir l&apos;exactitude, la complétude ou l&apos;actualité
            des informations diffusées. SMART LIFE se réserve le droit de corriger le contenu
            à tout moment et sans préavis.
          </p>
          <p>
            SMART LIFE ne saurait être tenu responsable des dommages directs ou indirects résultant
            de l&apos;utilisation du site ou de l&apos;impossibilité d&apos;y accéder, ni de tout dommage causé
            par des virus informatiques ou tout autre élément nuisible.
          </p>
        </Section>

        {/* Liens externes */}
        <Section title="6. Liens hypertextes">
          <p>
            Le site peut contenir des liens vers des sites tiers. SMART LIFE n&apos;exerce aucun contrôle
            sur ces sites et décline toute responsabilité quant à leur contenu ou pratiques.
            La présence de ces liens ne constitue pas une approbation de leur contenu.
          </p>
        </Section>

        {/* Droit applicable */}
        <Section title="7. Droit applicable et juridiction">
          <p>
            Les présentes mentions légales sont régies par le droit camerounais.
            Tout litige relatif à l&apos;utilisation du site sera soumis à la compétence exclusive
            des juridictions compétentes du Cameroun.
          </p>
        </Section>

        {/* Contact */}
        <div className="p-6 bg-green-50 border border-green-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <Shield size={22} className="text-green-600" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-gray-900 font-semibold mb-1">Une question légale ?</p>
            <p className="text-gray-600 text-sm">
              Contactez-nous à{" "}
              <a href="mailto:contact@smartlifecm.com" className="text-green-400 hover:text-green-300 transition-colors font-medium">
                contact@smartlifecm.com
              </a>{" "}
              pour toute demande relative aux présentes mentions.
            </p>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Link href="/confidentialite" className="text-sm text-gray-500 hover:text-green-400 transition-colors underline underline-offset-2">
            Politique de confidentialité
          </Link>
          <span className="text-gray-700">·</span>
          <Link href="/cgv" className="text-sm text-gray-500 hover:text-green-400 transition-colors underline underline-offset-2">
            Conditions Générales de Vente
          </Link>
          <span className="text-gray-700">·</span>
          <Link href="/" className="text-sm text-gray-500 hover:text-green-400 transition-colors underline underline-offset-2">
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
