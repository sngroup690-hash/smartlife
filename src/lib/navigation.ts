// Liste unique des rubriques du site : le menu du haut, le menu du bas et l'en-tête de la boutique
// lisent tous cette liste, pour qu'un visiteur retrouve toujours les mêmes repères, à la même place.
export type Rubrique = {
  href: string;
  label: string;
  /** Libellé sur deux lignes pour le menu du bas (téléphone) */
  court: string;
  /** Rubrique mise en avant (bouton jaune) */
  fort?: boolean;
};

export const RUBRIQUES: Rubrique[] = [
  { href: "/", label: "Accueil", court: "Accueil" },
  { href: "/ebooks", label: "Guides", court: "Guides" },
  { href: "/conseils", label: "Conseils gratuits", court: "Conseils\ngratuits" },
  { href: "/nos-consultants", label: "Nos consultants", court: "Nos\nconsultants" },
  { href: "/devenir-consultant", label: "Devenir consultant", court: "Devenir\nconsultant" },
  { href: "/accompagnement", label: "Se faire accompagner", court: "Se faire\naccompagner", fort: true },
];

// Pages secondaires, dans le panneau « Menu »
export const AUTRES_PAGES = [
  { href: "/packs", label: "Packs à prix réduit", desc: "Plusieurs guides ensemble, moins cher" },
  { href: "/analyse-smart", label: "Analyse Smart", desc: "Quel business lancer maintenant ?" },
  { href: "/temoignages", label: "Avis et témoignages", desc: "Ce que disent nos clients" },
  { href: "/contact", label: "Contact", desc: "Nous écrire" },
];

/** Événement qui ouvre le panneau « Menu » du téléphone (bouton du haut → panneau du bas) */
export const EVENEMENT_MENU = "smartlife-ouvrir-menu";

export function estActif(href: string, chemin: string | null): boolean {
  if (!chemin) return false;
  if (href === "/") return chemin === "/";
  return chemin === href || chemin.startsWith(href + "/");
}
