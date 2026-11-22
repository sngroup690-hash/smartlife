import type { Section, AvisClient, FaqItem } from "./data";
export type { Section, AvisClient, FaqItem };

export type ModuleVideo = {
  id: string;
  titre: string;
  duree: string;
  url: string;
};

export type ModuleLecon = {
  id: string;
  titre: string;
  videos: ModuleVideo[];
};

export type FormationModule = {
  id: string;
  titre: string;
  lecons?: ModuleLecon[];
  videos?: ModuleVideo[]; // ancien format — rétrocompat
};

export type Formation = {
  id: string;
  titre: string;
  categorie: string;
  description: string;
  instructeur: string;
  duree: string;
  modules: number;
  prix: number;
  prixOriginal?: number;
  niveau: "Débutant" | "Intermédiaire" | "Avancé";
  note: number;
  apprenants: number;
  badge?: string;
  mode: "online" | "presentiel" | "both";
  cover?: string;
  videoPreview?: string;
  videoUrl?: string;
  sections?: Section[];
  faq?: FaqItem[];
  avisClients?: AvisClient[];
  commentAcheterUrl?: string;
  promoEndDate?: string;
  promoCyclique?: boolean;
  promoDureeHeures?: number;
  cardBgColor?: string;
  cardTextColor?: string;
  priceColor?: string;
  ctaBgColor?: string;
  ctaTextColor?: string;
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  customSlug?: string;
  ogImage?: string;
};

export const FORMATIONS: Formation[] = [
  // ── Publicité, Acquisition & Traffic Management ──
  {
    id: "f-001",
    titre: "Publicité Facebook Ads & Instagram Ads",
    categorie: "Publicité & Traffic",
    description: "Créez, gérez et optimisez vos campagnes Facebook et Instagram : ciblage précis, pixel Meta, audiences personnalisées et retargeting pour des résultats rentables.",
    instructeur: "SMART LIFE",
    duree: "10h",
    modules: 7,
    prix: 25000,
    prixOriginal: 40000,
    niveau: "Débutant",
    note: 4.9,
    apprenants: 423,
    badge: "Bestseller",
    mode: "both",
  },
  {
    id: "f-002",
    titre: "Publicité TikTok Ads",
    categorie: "Publicité & Traffic",
    description: "Lancez vos premières campagnes TikTok Ads et captez un trafic massif et qualifié sur la plateforme la plus engageante du moment.",
    instructeur: "SMART LIFE",
    duree: "7h",
    modules: 5,
    prix: 20000,
    prixOriginal: 30000,
    niveau: "Intermédiaire",
    note: 4.8,
    apprenants: 289,
    badge: "Nouveau",
    mode: "both",
  },
  {
    id: "f-003",
    titre: "Stratégies de publicité percutante et rentabilité de budget",
    categorie: "Publicité & Traffic",
    description: "Créez des publicités qui convertissent vraiment : copywriting d'annonces, visuels percutants, optimisation du budget et lecture des KPIs essentiels.",
    instructeur: "SMART LIFE",
    duree: "6h",
    modules: 5,
    prix: 18000,
    niveau: "Avancé",
    note: 4.7,
    apprenants: 198,
    mode: "both",
  },

  // ── Création de Contenu, Vidéo & IA ──
  {
    id: "f-004",
    titre: "Création de contenu pour réseaux sociaux",
    categorie: "Contenu, Vidéo & IA",
    description: "Maîtrisez les formats qui performent sur Instagram, TikTok et Facebook : reels, stories, carousels et posts qui génèrent de l'engagement et de la croissance.",
    instructeur: "SMART LIFE",
    duree: "8h",
    modules: 6,
    prix: 20000,
    prixOriginal: 32000,
    niveau: "Débutant",
    note: 4.8,
    apprenants: 356,
    mode: "both",
  },
  {
    id: "f-005",
    titre: "Montage vidéo sur mobile et ordinateur",
    categorie: "Contenu, Vidéo & IA",
    description: "De la captation au montage finalisé : produisez des vidéos professionnelles avec votre smartphone ou votre PC grâce aux meilleurs outils gratuits et payants.",
    instructeur: "SMART LIFE",
    duree: "9h",
    modules: 7,
    prix: 22000,
    niveau: "Débutant",
    note: 4.7,
    apprenants: 241,
    mode: "both",
  },
  {
    id: "f-006",
    titre: "Maîtrise de l'IA appliquée : idées, scripts et visuels percutants",
    categorie: "Contenu, Vidéo & IA",
    description: "Exploitez ChatGPT et les meilleurs outils IA pour générer des idées de contenu, rédiger des scripts accrocheurs et créer des visuels percutants en quelques minutes.",
    instructeur: "SMART LIFE",
    duree: "8h",
    modules: 6,
    prix: 25000,
    prixOriginal: 38000,
    niveau: "Intermédiaire",
    note: 4.9,
    apprenants: 512,
    badge: "Bestseller",
    mode: "both",
  },
  {
    id: "f-007",
    titre: "Monétiser ses compétences en ligne grâce au contenu",
    categorie: "Contenu, Vidéo & IA",
    description: "Transformez votre expertise en revenus : vente de formations, prestation de services, affiliation et personal branding pour vivre de la création de contenu.",
    instructeur: "SMART LIFE",
    duree: "7h",
    modules: 6,
    prix: 22000,
    prixOriginal: 35000,
    niveau: "Intermédiaire",
    note: 4.8,
    apprenants: 178,
    mode: "both",
  },

  // ── Télévente & Commercialisation ──
  {
    id: "f-008",
    titre: "22 commandes pour devenir un excellent vendeur",
    categorie: "Télévente & Commercialisation",
    description: "Maîtrisez les 22 commandes psychologiques de la vente pour convaincre, traiter les objections et closer plus de clients à chaque appel ou message.",
    instructeur: "SMART LIFE",
    duree: "8h",
    modules: 6,
    prix: 20000,
    prixOriginal: 32000,
    niveau: "Débutant",
    note: 4.9,
    apprenants: 387,
    badge: "Bestseller",
    mode: "both",
  },
  {
    id: "f-009",
    titre: "Vendre ses compétences de vente en tant que Télévendeur",
    categorie: "Télévente & Commercialisation",
    description: "Transformez vos compétences commerciales en activité indépendante : trouver des clients, proposer vos services de télévendeur et générer des revenus récurrents.",
    instructeur: "SMART LIFE",
    duree: "6h",
    modules: 5,
    prix: 18000,
    niveau: "Intermédiaire",
    note: 4.7,
    apprenants: 214,
    mode: "both",
  },
  {
    id: "f-010",
    titre: "Formation et accompagnement dédié à la vente de produits digitaux",
    categorie: "Télévente & Commercialisation",
    description: "Lancez, vendez et scalez vos produits digitaux (ebooks, formations, templates) en Afrique et à l'international avec un accompagnement personnalisé.",
    instructeur: "SMART LIFE",
    duree: "10h",
    modules: 8,
    prix: 30000,
    prixOriginal: 45000,
    niveau: "Débutant",
    note: 4.9,
    apprenants: 298,
    badge: "Nouveau",
    mode: "both",
  },

  // ── Marketing Digital Général & Stratégie ──
  {
    id: "f-011",
    titre: "Vue d'ensemble du marketing digital",
    categorie: "Marketing Digital & Stratégie",
    description: "Panorama complet du marketing digital : réseaux sociaux, publicité payante, SEO, email marketing et analytics — comprenez l'écosystème et positionnez-vous.",
    instructeur: "SMART LIFE",
    duree: "5h",
    modules: 4,
    prix: 12000,
    niveau: "Débutant",
    note: 4.6,
    apprenants: 445,
    mode: "both",
  },
  {
    id: "f-012",
    titre: "Conversion, tunnels de vente et monétisation des audiences",
    categorie: "Marketing Digital & Stratégie",
    description: "Construisez des tunnels de vente efficaces, optimisez vos pages de conversion et monétisez vos audiences avec des stratégies éprouvées.",
    instructeur: "SMART LIFE",
    duree: "9h",
    modules: 7,
    prix: 28000,
    prixOriginal: 42000,
    niveau: "Avancé",
    note: 4.9,
    apprenants: 267,
    badge: "Premium",
    mode: "both",
  },
];
