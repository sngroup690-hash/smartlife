import Link from "next/link";
import { Lock, Eye, UserCheck, Database, Cookie, Mail, Trash2, Shield } from "lucide-react";

export const metadata = {
  title: "Politique de confidentialité – SMART LIFE",
  description: "Découvrez comment SMART LIFE collecte, utilise et protège vos données personnelles.",
};

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-3">
    <h2 className="text-gray-900 font-bold text-lg flex items-center gap-3">
      <span className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
        {icon}
      </span>
      {title}
    </h2>
    <div className="text-gray-600 text-sm leading-relaxed space-y-2 pl-11">{children}</div>
  </div>
);

export default function ConfidentialitePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-medium mb-6">
          <Lock size={13} />
          Protection des données
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Politique de <span className="gradient-text">Confidentialité</span>
        </h1>
        <p className="text-gray-500 text-base max-w-xl mx-auto">
          Chez SMART LIFE, votre vie privée est une priorité. Cette politique explique comment nous
          collectons, utilisons et protégeons vos données personnelles.
        </p>
        <p className="text-gray-600 text-xs mt-4">Dernière mise à jour : Septembre 2025</p>
      </div>

      <div className="space-y-5">
        {/* Responsable du traitement */}
        <Section icon={<UserCheck size={16} />} title="1. Responsable du traitement">
          <p>
            Le responsable du traitement des données personnelles collectées sur ce site est :
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1">
            <p className="text-gray-900 font-medium">SMART LIFE</p>
            <p>Cameroun</p>
            <p>
              Email :{" "}
              <a href="mailto:contact@smartlifecm.com" className="text-green-400 hover:text-green-300 transition-colors">
                contact@smartlifecm.com
              </a>
            </p>
          </div>
        </Section>

        {/* Données collectées */}
        <Section icon={<Database size={16} />} title="2. Données personnelles collectées">
          <p>Nous collectons les données suivantes selon vos interactions avec la plateforme :</p>
          <div className="space-y-3 mt-2">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-gray-900 font-medium mb-2">Lors de la création de compte</p>
              <ul className="space-y-1 list-disc list-inside text-gray-600">
                <li>Nom et prénom</li>
                <li>Adresse e-mail</li>
                <li>Mot de passe (chiffré)</li>
              </ul>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-gray-900 font-medium mb-2">Lors d&apos;un achat</p>
              <ul className="space-y-1 list-disc list-inside text-gray-600">
                <li>Coordonnées de facturation</li>
                <li>Historique des commandes</li>
                <li>Contenus numériques achetés</li>
              </ul>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-gray-900 font-medium mb-2">Lors de la navigation</p>
              <ul className="space-y-1 list-disc list-inside text-gray-600">
                <li>Adresse IP</li>
                <li>Type et version du navigateur</li>
                <li>Pages visitées et durée de visite</li>
                <li>Données de cookies (voir section 6)</li>
              </ul>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-gray-900 font-medium mb-2">Lors d&apos;une demande de service</p>
              <ul className="space-y-1 list-disc list-inside text-gray-600">
                <li>Informations transmises via le formulaire de contact</li>
                <li>Fichiers ou documents partagés pour la réalisation du service</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Finalités */}
        <Section icon={<Eye size={16} />} title="3. Finalités du traitement">
          <p>Vos données sont utilisées exclusivement pour :</p>
          <ul className="space-y-2 mt-2">
            {[
              "Créer et gérer votre compte utilisateur",
              "Traiter vos commandes et livrer les contenus numériques achetés",
              "Assurer le service après-vente et répondre à vos demandes",
              "Envoyer des confirmations de commande et factures",
              "Améliorer l'expérience utilisateur et les fonctionnalités du site",
              "Envoyer des communications commerciales si vous y avez consenti",
              "Respecter nos obligations légales et fiscales",
              "Prévenir la fraude et sécuriser la plateforme",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* Base légale */}
        <Section icon={<Shield size={16} />} title="4. Base légale du traitement">
          <p>Le traitement de vos données repose sur les bases légales suivantes :</p>
          <div className="space-y-2 mt-2">
            {[
              { base: "Exécution du contrat", detail: "Traitement des commandes et livraison des produits/services" },
              { base: "Consentement", detail: "Envoi de communications marketing et utilisation de cookies analytiques" },
              { base: "Intérêt légitime", detail: "Amélioration de nos services, sécurité et prévention de la fraude" },
              { base: "Obligation légale", detail: "Conservation des données de facturation et respect des lois applicables" },
            ].map(({ base, detail }) => (
              <div key={base} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-900 font-medium">{base} :</span>{" "}
                  <span>{detail}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Durée de conservation */}
        <Section icon={<Database size={16} />} title="5. Durée de conservation">
          <div className="space-y-2">
            {[
              { type: "Données de compte", duree: "Durée d'activité du compte + 3 ans après la dernière connexion" },
              { type: "Données de commande", duree: "10 ans (obligations comptables et fiscales)" },
              { type: "Données de contact", duree: "3 ans à compter de la dernière interaction" },
              { type: "Cookies", duree: "13 mois maximum" },
              { type: "Données de navigation", duree: "13 mois" },
            ].map(({ type, duree }) => (
              <div key={type} className="flex justify-between items-start gap-4 bg-gray-50 border border-gray-200 rounded-xl p-3">
                <span className="text-gray-900 font-medium text-sm">{type}</span>
                <span className="text-right text-xs text-gray-600 max-w-[60%]">{duree}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Cookies */}
        <Section icon={<Cookie size={16} />} title="6. Cookies">
          <p>
            Notre site utilise des cookies pour améliorer votre expérience de navigation.
            Un cookie est un petit fichier texte déposé sur votre terminal lors de la visite du site.
          </p>
          <div className="space-y-2 mt-2">
            {[
              { nom: "Cookies essentiels", desc: "Nécessaires au fonctionnement du site (session, panier, authentification). Ne peuvent être désactivés.", optionnel: false },
              { nom: "Cookies analytiques", desc: "Nous aident à comprendre comment vous utilisez le site (pages visitées, durée). Activés avec votre consentement.", optionnel: true },
              { nom: "Cookies de préférences", desc: "Mémorisent vos préférences (langue, affichage). Activés avec votre consentement.", optionnel: true },
            ].map(({ nom, desc, optionnel }) => (
              <div key={nom} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex gap-3">
                <span className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${optionnel ? "bg-yellow-500/70" : "bg-emerald-500/70"}`} />
                <div>
                  <p className="text-gray-900 font-medium text-sm">{nom}</p>
                  <p className="mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2">
            Vous pouvez gérer vos préférences de cookies via les paramètres de votre navigateur
            ou en nous contactant à{" "}
            <a href="mailto:contact@smartlifecm.com" className="text-green-400 hover:text-green-300 transition-colors">
              contact@smartlifecm.com
            </a>.
          </p>
        </Section>

        {/* Partage des données */}
        <Section icon={<UserCheck size={16} />} title="7. Partage des données">
          <p>
            SMART LIFE ne vend, ne loue et ne cède jamais vos données personnelles à des tiers
            à des fins commerciales. Vos données peuvent être partagées uniquement avec :
          </p>
          <ul className="space-y-2 mt-2">
            {[
              "Les prestataires de paiement (CinetPay) pour le traitement sécurisé des transactions",
              "Les prestataires d'hébergement pour le stockage sécurisé des données",
              "Les autorités compétentes sur réquisition légale",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-2">
            Ces prestataires sont soumis à des obligations de confidentialité strictes et ne peuvent
            utiliser vos données qu&apos;aux fins pour lesquelles elles leur sont transmises.
          </p>
        </Section>

        {/* Droits des utilisateurs */}
        <Section icon={<Trash2 size={16} />} title="8. Vos droits">
          <p>Conformément à la réglementation applicable, vous disposez des droits suivants :</p>
          <div className="grid sm:grid-cols-2 gap-2 mt-2">
            {[
              { droit: "Droit d'accès", detail: "Obtenir une copie de vos données personnelles" },
              { droit: "Droit de rectification", detail: "Corriger des données inexactes ou incomplètes" },
              { droit: "Droit à l'effacement", detail: "Demander la suppression de vos données" },
              { droit: "Droit d'opposition", detail: "Vous opposer à certains traitements (marketing)" },
              { droit: "Droit à la portabilité", detail: "Recevoir vos données dans un format structuré" },
              { droit: "Droit à la limitation", detail: "Restreindre temporairement un traitement" },
            ].map(({ droit, detail }) => (
              <div key={droit} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-gray-900 font-medium text-sm">{droit}</p>
                <p className="text-xs mt-0.5">{detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-3">
            Pour exercer ces droits, envoyez votre demande à{" "}
            <a href="mailto:contact@smartlifecm.com" className="text-green-400 hover:text-green-300 transition-colors">
              contact@smartlifecm.com
            </a>{" "}
            en précisant votre identité. Nous répondrons dans un délai de 30 jours.
          </p>
        </Section>

        {/* Sécurité */}
        <Section icon={<Lock size={16} />} title="9. Sécurité des données">
          <p>
            SMART LIFE met en œuvre des mesures techniques et organisationnelles appropriées
            pour protéger vos données contre tout accès non autorisé, divulgation, altération
            ou destruction :
          </p>
          <ul className="space-y-2 mt-2">
            {[
              "Chiffrement des mots de passe par hachage sécurisé",
              "Connexion sécurisée via HTTPS (SSL/TLS)",
              "Accès aux données limité au personnel autorisé",
              "Transactions de paiement traitées via des prestataires certifiés PCI-DSS",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* Mineurs */}
        <Section icon={<Shield size={16} />} title="10. Protection des mineurs">
          <p>
            La plateforme SMART LIFE est destinée à un public adulte. Nous ne collectons pas
            sciemment de données personnelles concernant des personnes âgées de moins de 18 ans.
            Si vous êtes parent ou tuteur et pensez que votre enfant nous a fourni des informations,
            contactez-nous immédiatement à{" "}
            <a href="mailto:contact@smartlifecm.com" className="text-green-400 hover:text-green-300 transition-colors">
              contact@smartlifecm.com
            </a>.
          </p>
        </Section>

        {/* Modifications */}
        <Section icon={<Eye size={16} />} title="11. Modifications de la politique">
          <p>
            SMART LIFE se réserve le droit de modifier la présente politique de confidentialité
            à tout moment. Les modifications entrent en vigueur dès leur publication sur le site.
            En cas de modification substantielle, nous vous en informerons par e-mail ou via
            une notification sur le site. La date de dernière mise à jour figure en haut de cette page.
          </p>
        </Section>

        {/* Contact DPO */}
        <div className="p-6 bg-green-50 border border-green-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <Mail size={22} className="text-green-600" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-gray-900 font-semibold mb-1">Questions sur vos données ?</p>
            <p className="text-gray-600 text-sm">
              Pour toute demande relative à vos données personnelles, contactez-nous à{" "}
              <a href="mailto:contact@smartlifecm.com" className="text-green-400 hover:text-green-300 transition-colors font-medium">
                contact@smartlifecm.com
              </a>
              . Nous traitons votre demande dans un délai de 30 jours ouvrés.
            </p>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Link href="/mentions-legales" className="text-sm text-gray-500 hover:text-green-400 transition-colors underline underline-offset-2">
            Mentions légales
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
