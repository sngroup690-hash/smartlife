import Link from "next/link";
import {
  ShoppingCart,
  CreditCard,
  Download,
  RefreshCw,
  AlertTriangle,
  Scale,
  FileText,
  Shield,
  BookOpen,
  Video,
  Mic,
  Package,
} from "lucide-react";

export const metadata = {
  title: "Conditions Générales de Vente – SMART LIFE",
  description: "Conditions Générales de Vente de la plateforme SMART LIFE : ebooks, voix off, vidéos, sourcing produits et accompagnement.",
};

const Section = ({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-3">
    <h2 className="text-gray-900 font-bold text-lg flex items-center gap-3">
      {icon && (
        <span className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
          {icon}
        </span>
      )}
      {title}
    </h2>
    <div className="text-gray-600 text-sm leading-relaxed space-y-2 pl-11">{children}</div>
  </div>
);

export default function CGVPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-medium mb-6">
          <FileText size={13} />
          Conditions contractuelles
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Conditions Générales <span className="gradient-text">de Vente</span>
        </h1>
        <p className="text-gray-600 text-base max-w-xl mx-auto">
          Les présentes CGV régissent l&apos;ensemble des ventes de produits et services réalisées
          sur la plateforme SMART LIFE. Tout achat implique l&apos;acceptation pleine et entière des
          présentes conditions.
        </p>
        <p className="text-gray-600 text-xs mt-4">Dernière mise à jour : Septembre 2025</p>
      </div>

      <div className="space-y-5">

        {/* Préambule */}
        <Section icon={<FileText size={16} />} title="1. Préambule et champ d'application">
          <p>
            Les présentes Conditions Générales de Vente (ci-après « CGV ») s&apos;appliquent à toutes
            les ventes de produits numériques et prestations de services conclues entre :
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 mt-2">
            <div>
              <p className="text-gray-900 font-medium">Le vendeur</p>
              <p>SMART LIFE, studio créatif digital, Cameroun</p>
              <p>
                Email :{" "}
                <a href="mailto:contact@smartlifecm.com" className="text-green-400 hover:text-green-300 transition-colors">
                  contact@smartlifecm.com
                </a>
              </p>
            </div>
            <div className="border-t border-white/10 pt-2">
              <p className="text-gray-900 font-medium">L&apos;acheteur</p>
              <p>
                Toute personne physique ou morale, majeure, effectuant un achat sur la plateforme
                smartlifecm.com (ci-après « le Client »).
              </p>
            </div>
          </div>
          <p className="mt-2">
            Toute commande passée sur la plateforme vaut acceptation sans réserve des présentes CGV.
            SMART LIFE se réserve le droit de modifier ces conditions à tout moment ;
            les conditions applicables sont celles en vigueur au moment de la commande.
          </p>
        </Section>

        {/* Produits et services */}
        <Section icon={<ShoppingCart size={16} />} title="2. Produits et services proposés">
          <p>SMART LIFE commercialise les produits et services suivants :</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {[
              {
                icon: <BookOpen size={15} />,
                titre: "Ebooks numériques",
                desc: "Guides pratiques sur le marketing digital, l'entrepreneuriat, la finance et le développement personnel. Livrés en format PDF téléchargeable.",
              },
              {
                icon: <Mic size={15} />,
                titre: "Voix off professionnelles",
                desc: "Enregistrements audio sur mesure pour publicités, vidéos, podcasts, présentations et contenus audiovisuels.",
              },
              {
                icon: <Video size={15} />,
                titre: "Création vidéo",
                desc: "Production de vidéos promotionnelles, reels, spots publicitaires et montages pour particuliers et entreprises.",
              },
              {
                icon: <Package size={15} />,
                titre: "Sourcing produits",
                desc: "Service de recherche, sélection et approvisionnement de produits auprès de fournisseurs locaux et internationaux.",
              },
            ].map(({ icon, titre, desc }) => (
              <div key={titre} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-400">{icon}</span>
                  <p className="text-gray-900 font-medium text-sm">{titre}</p>
                </div>
                <p>{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-3">
            Des services d&apos;accompagnement entrepreneurial (coaching, formations en ligne) peuvent
            également être proposés selon les offres disponibles sur la plateforme.
          </p>
        </Section>

        {/* Processus de commande */}
        <Section icon={<ShoppingCart size={16} />} title="3. Processus de commande">
          <p>La commande se déroule en plusieurs étapes :</p>
          <div className="space-y-2 mt-2">
            {[
              { num: "01", label: "Sélection", detail: "Le Client choisit le produit ou service souhaité et l'ajoute au panier." },
              { num: "02", label: "Création de compte", detail: "Le Client crée un compte ou se connecte à son compte existant." },
              { num: "03", label: "Validation du panier", detail: "Le Client vérifie sa commande (produits, quantités, montants)." },
              { num: "04", label: "Paiement", detail: "Le Client procède au paiement sécurisé via CinetPay (Mobile Money, carte bancaire)." },
              { num: "05", label: "Confirmation", detail: "Un email de confirmation est envoyé immédiatement après le paiement." },
              { num: "06", label: "Livraison", detail: "Les contenus numériques sont accessibles depuis le tableau de bord du compte." },
            ].map(({ num, label, detail }) => (
              <div key={num} className="flex gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <span className="text-green-400 font-bold text-lg leading-none flex-shrink-0">{num}</span>
                <div>
                  <p className="text-gray-900 font-medium text-sm">{label}</p>
                  <p className="mt-0.5">{detail}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2">
            Le contrat de vente est conclu au moment de la validation du paiement par l&apos;organisme
            bancaire. SMART LIFE se réserve le droit d&apos;annuler toute commande suspecte ou en cas
            de fraude avérée.
          </p>
        </Section>

        {/* Prix */}
        <Section icon={<CreditCard size={16} />} title="4. Prix et modalités de paiement">
          <div className="space-y-3">
            <div>
              <p className="text-gray-900 font-medium mb-1">Prix</p>
              <p>
                Les prix sont indiqués en Francs CFA (XAF) toutes taxes comprises (TTC).
                SMART LIFE se réserve le droit de modifier ses prix à tout moment.
                Le prix applicable est celui affiché au moment de la validation de la commande.
              </p>
            </div>
            <div>
              <p className="text-gray-900 font-medium mb-1">Moyens de paiement acceptés</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  "MTN Mobile Money",
                  "Orange Money",
                  "Carte bancaire Visa / Mastercard",
                  "Autres moyens disponibles via CinetPay",
                ].map((m) => (
                  <div key={m} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span className="text-sm">{m}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-gray-900 font-medium mb-1">Sécurité des paiements</p>
              <p>
                Toutes les transactions sont traitées par CinetPay, prestataire de paiement
                sécurisé. SMART LIFE ne stocke aucune donnée bancaire sur ses serveurs.
                Les paiements sont cryptés via le protocole SSL.
              </p>
            </div>
          </div>
        </Section>

        {/* Livraison */}
        <Section icon={<Download size={16} />} title="5. Livraison des produits numériques">
          <div className="space-y-3">
            <div>
              <p className="text-gray-900 font-medium mb-1">Ebooks et contenus téléchargeables</p>
              <p>
                Les ebooks sont disponibles en téléchargement immédiat après confirmation du
                paiement, depuis la rubrique « Mon Espace » du compte client. Un lien de
                téléchargement est également envoyé par email.
              </p>
            </div>
            <div>
              <p className="text-gray-900 font-medium mb-1">Formations en ligne</p>
              <p>
                L&apos;accès aux formations est activé immédiatement après paiement. Les vidéos
                sont accessibles en streaming depuis le tableau de bord, sans limitation de
                durée d&apos;accès sauf mention contraire sur la page de la formation.
              </p>
            </div>
            <div>
              <p className="text-gray-900 font-medium mb-1">Services sur mesure (voix off, vidéo, sourcing)</p>
              <p>
                Les délais de livraison varient selon la prestation et sont communiqués
                lors de la commande ou de l&apos;échange préalable. En cas de retard imprévu,
                le client est informé par email dans les meilleurs délais.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <p>
                En cas de non-réception de l&apos;email de confirmation ou du lien de téléchargement
                dans les 30 minutes suivant le paiement, vérifiez vos spams ou contactez-nous à{" "}
                <a href="mailto:contact@smartlifecm.com" className="text-green-400 hover:text-green-300 transition-colors">
                  contact@smartlifecm.com
                </a>.
              </p>
            </div>
          </div>
        </Section>

        {/* Droit de rétractation */}
        <Section icon={<RefreshCw size={16} />} title="6. Droit de rétractation et remboursements">
          <div className="space-y-3">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-gray-900 font-medium mb-2">Produits numériques (ebooks, formations)</p>
              <p>
                Conformément aux règles applicables aux contenus numériques dont l&apos;exécution
                a commencé avec l&apos;accord du client (téléchargement, streaming), <strong className="text-gray-900">le droit
                de rétractation ne s&apos;applique pas</strong> une fois le contenu téléchargé ou
                visionné.
              </p>
              <p className="mt-2">
                Cependant, si un problème technique empêche l&apos;accès au contenu payé, SMART LIFE
                s&apos;engage à résoudre le problème ou à procéder au remboursement intégral.
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-gray-900 font-medium mb-2">Services sur mesure (voix off, vidéo, sourcing)</p>
              <p>
                Pour les services personnalisés, l&apos;annulation est possible sous <strong className="text-gray-900">48h</strong>{" "}
                après la commande, sans frais, si la production n&apos;a pas encore débuté.
                Au-delà, des frais correspondant au travail déjà réalisé peuvent être retenus.
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-gray-900 font-medium mb-2">Procédure de remboursement</p>
              <p>
                Toute demande de remboursement doit être adressée à{" "}
                <a href="mailto:contact@smartlifecm.com" className="text-green-400 hover:text-green-300 transition-colors">
                  contact@smartlifecm.com
                </a>{" "}
                en indiquant le numéro de commande. Les remboursements acceptés sont effectués
                via le même moyen de paiement dans un délai de <strong className="text-gray-900">7 jours ouvrés</strong>.
              </p>
            </div>
          </div>
        </Section>

        {/* Propriété intellectuelle */}
        <Section icon={<Shield size={16} />} title="7. Propriété intellectuelle et licence d'utilisation">
          <p>
            Tous les contenus vendus sur la plateforme (ebooks, vidéos, audios) sont protégés
            par le droit de la propriété intellectuelle et restent la propriété exclusive de
            SMART LIFE ou de leurs auteurs respectifs.
          </p>
          <p>
            L&apos;achat d&apos;un produit numérique confère au Client une <strong className="text-gray-900">licence d&apos;utilisation
            personnelle, non exclusive et non transférable</strong>. Le Client s&apos;interdit
            formellement de :
          </p>
          <ul className="space-y-1.5 mt-2">
            {[
              "Reproduire, copier ou distribuer le contenu, même partiellement",
              "Vendre, louer ou partager le contenu avec des tiers",
              "Exploiter commercialement le contenu sans autorisation écrite",
              "Modifier, adapter ou créer des œuvres dérivées sans accord préalable",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400/70 mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-2">
            Tout manquement à ces dispositions expose le contrevenant à des poursuites judiciaires.
          </p>
        </Section>

        {/* Responsabilités */}
        <Section icon={<AlertTriangle size={16} />} title="8. Responsabilités">
          <div className="space-y-3">
            <div>
              <p className="text-gray-900 font-medium mb-1">Responsabilité de SMART LIFE</p>
              <p>
                SMART LIFE s&apos;engage à fournir des produits et services conformes à leur description.
                La responsabilité de SMART LIFE ne peut être engagée qu&apos;en cas de faute prouvée et
                est limitée au montant de la commande concernée.
              </p>
              <p className="mt-2">
                SMART LIFE ne saurait être responsable des dommages indirects tels que perte de
                revenus, perte de données, ou préjudice commercial résultant de l&apos;utilisation
                des produits.
              </p>
            </div>
            <div>
              <p className="text-gray-900 font-medium mb-1">Responsabilité du Client</p>
              <p>
                Le Client est responsable de l&apos;utilisation qu&apos;il fait des contenus acquis
                et s&apos;engage à les utiliser dans le respect des lois en vigueur, des droits
                des tiers et des présentes CGV.
              </p>
            </div>
          </div>
        </Section>

        {/* Données personnelles */}
        <Section icon={<Shield size={16} />} title="9. Protection des données personnelles">
          <p>
            Dans le cadre de la commande, SMART LIFE collecte et traite les données personnelles
            du Client conformément à sa{" "}
            <Link href="/confidentialite" className="text-green-400 hover:text-green-300 transition-colors">
              Politique de Confidentialité
            </Link>
            . Ces données sont utilisées exclusivement pour le traitement de la commande,
            la livraison des produits et la relation commerciale.
          </p>
        </Section>

        {/* Force majeure */}
        <Section icon={<AlertTriangle size={16} />} title="10. Force majeure">
          <p>
            SMART LIFE ne pourra être tenu responsable de l&apos;inexécution totale ou partielle
            de ses obligations si celle-ci est imputable à un cas de force majeure, notamment :
            catastrophe naturelle, incendie, coupure de réseau Internet, panne de système
            informatique, grève ou tout autre événement indépendant de sa volonté.
          </p>
          <p>
            En cas de force majeure, SMART LIFE informera le Client dans les meilleurs délais
            et proposera une solution alternative ou un remboursement.
          </p>
        </Section>

        {/* Litiges */}
        <Section icon={<Scale size={16} />} title="11. Réclamations, médiation et droit applicable">
          <div className="space-y-3">
            <div>
              <p className="text-gray-900 font-medium mb-1">Réclamations</p>
              <p>
                Pour toute réclamation, le Client contacte SMART LIFE à{" "}
                <a href="mailto:contact@smartlifecm.com" className="text-green-400 hover:text-green-300 transition-colors">
                  contact@smartlifecm.com
                </a>{" "}
                en précisant le numéro de commande et la nature du problème.
                SMART LIFE s&apos;engage à répondre dans un délai de <strong className="text-gray-900">5 jours ouvrés</strong>.
              </p>
            </div>
            <div>
              <p className="text-gray-900 font-medium mb-1">Résolution amiable</p>
              <p>
                En cas de litige, les parties s&apos;engagent à rechercher en priorité une solution
                amiable avant tout recours judiciaire. SMART LIFE favorise le dialogue et
                s&apos;engage à traiter chaque situation avec équité.
              </p>
            </div>
            <div>
              <p className="text-gray-900 font-medium mb-1">Droit applicable</p>
              <p>
                Les présentes CGV sont soumises au droit camerounais.
                Tout litige non résolu à l&apos;amiable sera soumis à la compétence exclusive
                des juridictions compétentes du Cameroun.
              </p>
            </div>
          </div>
        </Section>

        {/* Acceptation */}
        <div className="p-6 bg-green-50 border border-green-200 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <ShoppingCart size={22} className="text-green-600" />
            </div>
            <div>
              <p className="text-gray-900 font-semibold mb-2">Acceptation des CGV</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                En validant votre commande sur SMART LIFE, vous reconnaissez avoir lu, compris
                et accepté sans réserve les présentes Conditions Générales de Vente dans leur
                intégralité. Pour toute question, contactez-nous à{" "}
                <a href="mailto:contact@smartlifecm.com" className="text-green-400 hover:text-green-300 transition-colors font-medium">
                  contact@smartlifecm.com
                </a>.
              </p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Link href="/mentions-legales" className="text-sm text-gray-500 hover:text-green-400 transition-colors underline underline-offset-2">
            Mentions légales
          </Link>
          <span className="text-gray-700">·</span>
          <Link href="/confidentialite" className="text-sm text-gray-500 hover:text-green-400 transition-colors underline underline-offset-2">
            Politique de confidentialité
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
