// Fabrique des titres et descriptions qui répondent aux vraies recherches Google
// (« comment se lancer dans l'élevage de porcs au Cameroun », « business de shawarma au Cameroun »…).

export const SITE_URL = "https://smartlifecm.com";
export const NOM_SITE = "Smart Life";

const enMajuscules = (t: string) => {
  const lettres = t.replace(/[^\p{L}]/gu, "");
  if (!lettres) return false;
  const maj = lettres.replace(/[^\p{Lu}]/gu, "").length;
  return maj / lettres.length > 0.6;
};

/** « GUIDE COMPLET POUR L'ÉLEVAGE DE PORCS RENTABLE » → « L'élevage de porcs rentable » */
export function sujetDuTitre(titre: string): string {
  let s = titre
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s'’&,().:—–-]/gu, " ")
    .replace(/\s*[:—–]\s*(le |la )?(guide|formation)\s.*$/i, "")
    .replace(/^\s*(le |la |l['’])?(guide|formation)(\s+(complet|complète|pratique|ultime))?(\s*[:—–,-]\s*|\s+(pour|de|du|des)\s+|\s+)/i, "")
    .replace(/\s+—\s+.*$/, "")
    .replace(/\s+(le |la )?guide\s+(complet|pratique)\s*$/i, "")
    .replace(/\s+en afrique\s*$/i, "")
    .replace(/^[\s,:—–-]+|[\s,:—–-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) s = titre.trim();
  if (enMajuscules(s)) s = s.toLocaleLowerCase("fr-FR");
  s = s.replace(/\bafrique\b/g, "Afrique").replace(/\bcameroun\b/g, "Cameroun");
  return s.charAt(0).toLocaleUpperCase("fr-FR") + s.slice(1);
}

// Guides qui ne sont pas des activités à lancer : on ne promet pas « comment se lancer ».
const PAS_UN_BUSINESS = /code de la route|recette|cuisine|chien|bourse|trading|whatsapp|cheveux|topographe|styliste/i;
const relier = (sujet: string, suite: string) => `${sujet}${sujet.includes(":") ? " —" : " :"} ${suite}`;

const minuscule = (s: string) => s.charAt(0).toLocaleLowerCase("fr-FR") + s.slice(1);
const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ")} FCFA`;

export function titreGuide(titre: string): string {
  const sujet = sujetDuTitre(titre);
  return relier(sujet, PAS_UN_BUSINESS.test(sujet) ? "le guide pratique au Cameroun et en Afrique" : "comment se lancer au Cameroun et en Afrique");
}

export function descriptionGuide(titre: string, prix: number, ventes?: number): string {
  const sujet = sujetDuTitre(titre);
  const fin = `Guide pratique à ${fcfa(prix)}, reçu en quelques secondes sur ton téléphone${ventes && ventes > 0 ? `, déjà ${ventes.toLocaleString("fr-FR")} ventes` : ""}.`;
  return PAS_UN_BUSINESS.test(sujet)
    ? `${sujet} au Cameroun et en Afrique : tout ce qu'il faut savoir, expliqué simplement et étape par étape. ${fin}`
    : `${sujet} au Cameroun et en Afrique : les étapes pour se lancer, le budget de départ, les fournisseurs et la vente. ${fin}`;
}

export function titreAccompagnement(titre: string): string {
  return relier(sujetDuTitre(titre), "se lancer au Cameroun avec un expert");
}

export function descriptionAccompagnement(titre: string): string {
  return `${sujetDuTitre(titre)} au Cameroun ou en Afrique : soumettez votre projet, un consultant du terrain vous accompagne pas à pas, `
    + "du budget au lancement. Candidature gratuite.";
}

export const DESCRIPTION_SITE =
  "Smart Life, l'écosystème des visionnaires africains : 85 guides pratiques pour se lancer (élevage, agriculture, commerce, transformation…), "
  + "un accompagnement par des consultants du terrain et une communauté de 14 960+ clients au Cameroun, en Afrique et dans la diaspora.";

/** Étiquettes Google de l'organisation et du site (page d'accueil). */
export const ETIQUETTES_SITE = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: NOM_SITE,
    url: SITE_URL,
    logo: `${SITE_URL}/logo-smartlife.jpeg`,
    description: DESCRIPTION_SITE,
    areaServed: ["Cameroun", "Afrique"],
    sameAs: ["https://www.facebook.com/share/19dqUPc2zp/", "https://www.tiktok.com/@smartlife547"],
    contactPoint: { "@type": "ContactPoint", telephone: "+237694176642", contactType: "customer service", availableLanguage: ["French"] },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: NOM_SITE,
    url: SITE_URL,
    inLanguage: "fr",
  },
];

export const jsonLd = (donnees: unknown) => JSON.stringify(donnees).replace(/</g, "\\u003c");
