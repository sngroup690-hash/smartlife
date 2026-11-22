export type AdminRole = "super_admin" | "admin_manager" | "content_editor" | "candidatures_manager";

export const ROLE_CONFIG: Record<AdminRole, {
  label: string;
  description: string;
  color: string;
  tabs: string[];
}> = {
  super_admin: {
    label: "Super Administrateur",
    description: "Accès complet + gestion des comptes staff",
    color: "text-yellow-400",
    tabs: ["espaces", "consultants", "candidatures_consultant", "candidatures", "ebooks", "formations", "annonces", "avis", "temoignages", "parcours", "motivations", "staff", "about"],
  },
  admin_manager: {
    label: "Administrateur",
    description: "Accès complet au contenu du site",
    color: "text-blue-400",
    tabs: ["espaces", "consultants", "candidatures_consultant", "candidatures", "ebooks", "formations", "annonces", "avis", "temoignages", "parcours", "motivations", "about"],
  },
  content_editor: {
    label: "Éditeur de contenu",
    description: "Gestion des ebooks & formations uniquement",
    color: "text-violet-400",
    tabs: ["ebooks", "formations", "annonces", "avis", "temoignages"],
  },
  candidatures_manager: {
    label: "Gestionnaire Candidatures",
    description: "Traitement des candidatures d'accompagnement uniquement",
    color: "text-emerald-400",
    tabs: ["candidatures_consultant", "candidatures"],
  },
};
