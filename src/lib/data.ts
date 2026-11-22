export type Section = {
  titre: string;
  contenu: string;
};

export type AvisClient = {
  nom: string;
  note: number;
  texte: string;
};

export type FaqItem = {
  q: string;
  a: string;
};

export type Ebook = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  cover: string;
  pages: number;
  rating: number;
  reviews: number;
  bestseller?: boolean;
  new?: boolean;
  sections?: Section[];
  ctaLabel?: string;
  ctaAnimation?: "pulse" | "bounce" | "shimmer" | "glow" | "wiggle" | "none";
  reviewCardSize?: "small" | "medium" | "large";
  faq?: FaqItem[];
  avisClients?: AvisClient[];
  commentAcheterUrl?: string;
  coverLayout?: "full" | "overlay" | "split" | "frame";
  pdfPreviewUrl?: string;
  promoEndDate?: string;
  promoCyclique?: boolean;
  promoDureeHeures?: number;
  cardBgColor?: string;
  cardTextColor?: string;
  priceColor?: string;
  ctaBgColor?: string;
  ctaTextColor?: string;
  coverHeight?: number;
  coverObjectPosition?: string;
  coverObjectFit?: "cover" | "contain";
  banner?: string;
  communityBgColor?: string;
  communityTextColor?: string;
  audioUrl?: string;
  videoUrl?: string;
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  customSlug?: string;
  ogImage?: string;
};

export type Service = {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  icon: string;
  startingPrice: number;
  deliveryTime: string;
  features: string[];
  packages: ServicePackage[];
};

export type ServicePackage = {
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
  deliveryTime: string;
};

export const ebooks: Ebook[] = [
  // ── Développement Personnel, Compétences & Spiritualité ──
  {
    id: "eb-001",
    slug: "gerer-son-temps",
    title: "Guide pratique : Comment bien gérer son temps",
    description: "Méthodes éprouvées pour organiser vos journées, éliminer la procrastination et atteindre vos objectifs plus rapidement.",
    price: 3500,
    originalPrice: 5000,
    category: "Développement Personnel, Compétences & Spiritualité",
    cover: "/covers/gestion-temps.jpg",
    pages: 120,
    rating: 4.8,
    reviews: 156,
    bestseller: true,
  },
  {
    id: "eb-002",
    slug: "lire-retenir-apprendre",
    title: "Guide pratique : Comment lire, retenir et mieux apprendre",
    description: "Techniques de lecture rapide, mémorisation durable et apprentissage accéléré pour absorber tout ce que vous lisez.",
    price: 3500,
    category: "Développement Personnel, Compétences & Spiritualité",
    cover: "/covers/lire-retenir.jpg",
    pages: 110,
    rating: 4.7,
    reviews: 98,
  },
  {
    id: "eb-003",
    slug: "entretien-embauche-negociation",
    title: "Guide pratique : Réussir son entretien d'embauche et maîtriser l'art de la négociation",
    description: "Préparez-vous à briller en entretien et négociez votre salaire ou vos contrats avec confiance et efficacité.",
    price: 4000,
    originalPrice: 6000,
    category: "Développement Personnel, Compétences & Spiritualité",
    cover: "/covers/entretien-negociation.jpg",
    pages: 140,
    rating: 4.9,
    reviews: 213,
    bestseller: true,
  },
  {
    id: "eb-004",
    slug: "detecter-mensonge",
    title: "Guide pratique : Comment détecter un mensonge",
    description: "Apprenez à lire le langage corporel, les micro-expressions et les signaux verbaux pour identifier un mensonge en temps réel.",
    price: 3000,
    category: "Développement Personnel, Compétences & Spiritualité",
    cover: "/covers/detecter-mensonge.jpg",
    pages: 95,
    rating: 4.6,
    reviews: 87,
  },
  {
    id: "eb-005",
    slug: "prier-pour-ses-enfants",
    title: "Guide pratique : Comment prier spirituellement pour ses enfants",
    description: "Un guide spirituel complet pour intercéder efficacement en faveur de vos enfants et les couvrir de protection divine.",
    price: 2500,
    category: "Développement Personnel, Compétences & Spiritualité",
    cover: "/covers/prier-enfants.jpg",
    pages: 85,
    rating: 4.9,
    reviews: 174,
  },
  {
    id: "eb-006",
    slug: "prier-pour-ses-desirs",
    title: "Guide pratique : Comment prier pour obtenir ce que l'on désire",
    description: "Principes bibliques et spirituels d'une prière puissante et féconde pour voir vos requêtes exaucées.",
    price: 2500,
    category: "Développement Personnel, Compétences & Spiritualité",
    cover: "/covers/prier-desirs.jpg",
    pages: 90,
    rating: 4.8,
    reviews: 142,
  },

  // ── Santé, Bien-être & Soins Corporels ──
  {
    id: "eb-007",
    slug: "perdre-du-poids",
    title: "Guide pratique : Perdre du poids efficacement",
    description: "Plan nutritionnel et programme de remise en forme adapté à l'Afrique pour perdre du poids durablement sans régimes extrêmes.",
    price: 3500,
    originalPrice: 5500,
    category: "Santé, Bien-être & Soins Corporels",
    cover: "/covers/perdre-poids.jpg",
    pages: 130,
    rating: 4.7,
    reviews: 189,
    bestseller: true,
  },
  {
    id: "eb-008",
    slug: "sante-digestion",
    title: "Guide pratique : Prendre soin de son estomac et de sa digestion",
    description: "Alimentation saine, plantes médicinales et habitudes quotidiennes pour soulager les maux digestifs et retrouver un ventre plat.",
    price: 3000,
    category: "Santé, Bien-être & Soins Corporels",
    cover: "/covers/sante-digestion.jpg",
    pages: 100,
    rating: 4.6,
    reviews: 76,
  },
  {
    id: "eb-009",
    slug: "soin-peau-eclat",
    title: "Guide pratique : Éclaircir et nettoyer les zones sombres de la peau",
    description: "Recettes naturelles et soins artisanaux efficaces pour uniformiser le teint et sublimer votre peau en toute sécurité.",
    price: 3000,
    category: "Santé, Bien-être & Soins Corporels",
    cover: "/covers/soin-peau.jpg",
    pages: 88,
    rating: 4.5,
    reviews: 134,
    new: true,
  },

  // ── Élevage & Dresseurs ──
  {
    id: "eb-010",
    slug: "elevage-volailles",
    title: "Guide pratique : Élevage complet de volailles (Poulets de chair et poules pondeuses)",
    description: "Tout ce qu'il faut savoir pour lancer et rentabiliser un élevage de poulets de chair et de poules pondeuses en Afrique.",
    price: 5000,
    originalPrice: 7500,
    category: "Élevage & Dresseurs",
    cover: "/covers/elevage-volailles.jpg",
    pages: 180,
    rating: 4.9,
    reviews: 267,
    bestseller: true,
  },
  {
    id: "eb-011",
    slug: "elevage-poissons-silures",
    title: "Guide pratique : Élevage de poissons (Silures et fabrication d'aliments aquacoles)",
    description: "Maîtrisez la pisciculture des silures et la fabrication d'aliments aquacoles locaux pour une production rentable.",
    price: 5000,
    category: "Élevage & Dresseurs",
    cover: "/covers/elevage-poissons.jpg",
    pages: 160,
    rating: 4.8,
    reviews: 143,
  },
  {
    id: "eb-012",
    slug: "elevage-porcs",
    title: "Guide pratique : Élevage de porcs et fabrication de leur alimentation",
    description: "Guide complet pour élever des porcs de manière rentable et fabriquer soi-même leur alimentation à moindre coût.",
    price: 4500,
    category: "Élevage & Dresseurs",
    cover: "/covers/elevage-porcs.jpg",
    pages: 150,
    rating: 4.7,
    reviews: 98,
  },
  {
    id: "eb-013",
    slug: "elevage-bovins",
    title: "Guide pratique : Élevage de bovins en Afrique",
    description: "Techniques d'élevage bovin adaptées au contexte africain : alimentation, santé animale, reproduction et commercialisation.",
    price: 5500,
    category: "Élevage & Dresseurs",
    cover: "/covers/elevage-bovins.jpg",
    pages: 200,
    rating: 4.8,
    reviews: 112,
  },
  {
    id: "eb-014",
    slug: "elevage-lapins",
    title: "Guide pratique : Élevage de lapins",
    description: "Démarrez un élevage de lapins rentable avec peu d'espace et peu d'investissement grâce à ce guide pratique complet.",
    price: 3500,
    category: "Élevage & Dresseurs",
    cover: "/covers/elevage-lapins.jpg",
    pages: 120,
    rating: 4.6,
    reviews: 89,
  },
  {
    id: "eb-015",
    slug: "elevage-canards",
    title: "Guide pratique : Élevage de canards",
    description: "Tout sur l'élevage des canards : races, alimentation, logement, santé et commercialisation pour maximiser votre rentabilité.",
    price: 3500,
    category: "Élevage & Dresseurs",
    cover: "/covers/elevage-canards.jpg",
    pages: 115,
    rating: 4.5,
    reviews: 67,
  },
  {
    id: "eb-016",
    slug: "elevage-escargots",
    title: "Guide pratique : Élevage d'escargots",
    description: "L'héliciculture facile : comment élever des escargots géants africains de façon rentable avec un investissement minimal.",
    price: 4000,
    category: "Élevage & Dresseurs",
    cover: "/covers/elevage-escargots.jpg",
    pages: 130,
    rating: 4.7,
    reviews: 154,
    new: true,
  },
  {
    id: "eb-017",
    slug: "dresser-son-chien",
    title: "Guide pratique : Comment bien nourrir, dresser et entretenir son chien",
    description: "Guide du maître responsable : nutrition adaptée, techniques de dressage efficaces et soins quotidiens pour un chien en pleine santé.",
    price: 3000,
    category: "Élevage & Dresseurs",
    cover: "/covers/dresser-chien.jpg",
    pages: 110,
    rating: 4.6,
    reviews: 78,
  },

  // ── Agriculture & Cultures Rentables ──
  {
    id: "eb-018",
    slug: "cultures-maraicheres",
    title: "Cultures maraîchères & légumes : Tomates, piments, poivrons, gombos, concombres, pastèques, choux, carottes, haricots verts, oignons et aubergines",
    description: "Techniques rentables pour cultiver et commercialiser les légumes les plus demandés en Afrique, du semis à la récolte.",
    price: 5000,
    originalPrice: 7000,
    category: "Agriculture & Cultures Rentables",
    cover: "/covers/cultures-maraicheres.jpg",
    pages: 200,
    rating: 4.9,
    reviews: 312,
    bestseller: true,
  },
  {
    id: "eb-019",
    slug: "cultures-vivrieres",
    title: "Cultures vivrières & tubercules : Bananes plantains, pommes de terre et soja",
    description: "Production intensive et rentable de bananes plantains, pommes de terre et soja grâce aux techniques modernes adaptées à l'Afrique.",
    price: 4500,
    category: "Agriculture & Cultures Rentables",
    cover: "/covers/cultures-vivrieres.jpg",
    pages: 160,
    rating: 4.7,
    reviews: 134,
  },
  {
    id: "eb-020",
    slug: "cultures-perennes",
    title: "Cultures pérennes & spécialisées : Avocats, poivre, palmiers à huile, gingembre et aloe vera",
    description: "Guide de plantation et d'exploitation rentable des cultures à haute valeur ajoutée sur le long terme en Afrique.",
    price: 5000,
    category: "Agriculture & Cultures Rentables",
    cover: "/covers/cultures-perennes.jpg",
    pages: 175,
    rating: 4.8,
    reviews: 98,
  },

  // ── Création d'Entreprises & Commerce Réel ──
  {
    id: "eb-021",
    slug: "ouvrir-restaurant",
    title: "Restauration & Alimentation : Ouvrir un restaurant rentable, une poissonnerie ou une boulangerie",
    description: "Business plan, équipement, recrutement et gestion opérationnelle pour lancer avec succès votre établissement alimentaire en Afrique.",
    price: 7500,
    originalPrice: 10000,
    category: "Création d'Entreprises & Commerce Réel",
    cover: "/covers/restauration-alimentation.jpg",
    pages: 240,
    rating: 4.9,
    reviews: 287,
    bestseller: true,
  },
  {
    id: "eb-022",
    slug: "ouvrir-boutique-commerce",
    title: "Boutiques & Commerces : Quincaillerie, pièces détachées, pneus, lunettes médicales et librairie",
    description: "Lancer et rentabiliser votre commerce physique : emplacement, approvisionnement, gestion des stocks et fidélisation client.",
    price: 7500,
    category: "Création d'Entreprises & Commerce Réel",
    cover: "/covers/boutiques-commerces.jpg",
    pages: 230,
    rating: 4.8,
    reviews: 203,
  },
  {
    id: "eb-023",
    slug: "ouvrir-entreprise-services",
    title: "Services & Immobilier : Pressing, lavage auto, événementiel, agent immobilier et auto-école",
    description: "Ouvrir et rentabiliser votre entreprise de services : étude de marché, réglementation, équipement et stratégies commerciales.",
    price: 7500,
    originalPrice: 10000,
    category: "Création d'Entreprises & Commerce Réel",
    cover: "/covers/services-immobilier.jpg",
    pages: 250,
    rating: 4.9,
    reviews: 176,
  },
  {
    id: "eb-024",
    slug: "etablissements-btp",
    title: "Établissements & BTP : École, microfinance, devis de construction et achat de terrain",
    description: "Créer une école rentable, ouvrir une microfinance, lire un devis BTP et acheter un terrain sans risques en Afrique.",
    price: 7500,
    category: "Création d'Entreprises & Commerce Réel",
    cover: "/covers/etablissements-btp.jpg",
    pages: 220,
    rating: 4.8,
    reviews: 145,
  },

  // ── Fabrication Artisanale & Transformation ──
  {
    id: "eb-025",
    slug: "fabrication-agroalimentaire",
    title: "Agroalimentaire : Fabrication de jus de fruits naturels, yaourts, confitures et glaces artisanales",
    description: "Recettes, équipements et stratégies de commercialisation pour lancer une production agroalimentaire artisanale rentable.",
    price: 4500,
    originalPrice: 6500,
    category: "Fabrication Artisanale & Transformation",
    cover: "/covers/fabrication-agroalimentaire.jpg",
    pages: 160,
    rating: 4.7,
    reviews: 189,
  },
  {
    id: "eb-026",
    slug: "fabrication-cosmetique",
    title: "Cosmétique & Chimie : Parfums, baumes à lèvres, savons artisanaux et produits d'entretien ménager",
    description: "Créez et vendez vos propres produits cosmétiques et ménagers : formules, matières premières et lancement de marque.",
    price: 5000,
    category: "Fabrication Artisanale & Transformation",
    cover: "/covers/fabrication-cosmetique.jpg",
    pages: 175,
    rating: 4.8,
    reviews: 234,
    bestseller: true,
  },
  {
    id: "eb-027",
    slug: "fabrication-parpaings",
    title: "Matériaux : Production et fabrication de parpaings (blocs de ciment)",
    description: "Technologie et business de la fabrication de parpaings : machines, formules de dosage, rendement et mise en marché.",
    price: 4500,
    category: "Fabrication Artisanale & Transformation",
    cover: "/covers/fabrication-parpaings.jpg",
    pages: 130,
    rating: 4.6,
    reviews: 87,
  },

  // ── Business Numérique, IA & Tech ──
  {
    id: "eb-028",
    slug: "gagner-argent-ia",
    title: "Guide pratique : Comment gagner de l'argent avec l'intelligence artificielle",
    description: "Les meilleures opportunités de revenus grâce à l'IA : outils, stratégies et cas pratiques pour monétiser l'intelligence artificielle dès aujourd'hui.",
    price: 5500,
    originalPrice: 8000,
    category: "Business Numérique, IA & Tech",
    cover: "/covers/gagner-argent-ia.jpg",
    pages: 190,
    rating: 4.9,
    reviews: 456,
    bestseller: true,
  },
  {
    id: "eb-029",
    slug: "publier-livre-ia",
    title: "Guide pratique : Écrire et publier un livre grâce à l'IA",
    description: "De l'idée à la publication : utilisez ChatGPT et les outils IA pour rédiger, corriger et auto-publier votre livre en un temps record.",
    price: 4500,
    category: "Business Numérique, IA & Tech",
    cover: "/covers/publier-livre-ia.jpg",
    pages: 150,
    rating: 4.8,
    reviews: 312,
    new: true,
  },
  {
    id: "eb-030",
    slug: "campagnes-facebook-ads",
    title: "Guide pratique : Lancer et rentabiliser ses campagnes publicitaires Facebook",
    description: "Créez des publicités Facebook rentables : ciblage précis, visuels qui convertissent et stratégies pour maximiser votre retour sur investissement.",
    price: 5000,
    originalPrice: 7000,
    category: "Business Numérique, IA & Tech",
    cover: "/covers/pubs-facebook.jpg",
    pages: 170,
    rating: 4.7,
    reviews: 198,
  },
  {
    id: "eb-031",
    slug: "location-logements-meubles",
    title: "Guide pratique : Comment louer des logements meublés",
    description: "Stratégie complète pour investir dans la location de logements meublés, attirer des locataires et générer des revenus passifs stables.",
    price: 4500,
    category: "Business Numérique, IA & Tech",
    cover: "/covers/location-meubles.jpg",
    pages: 145,
    rating: 4.7,
    reviews: 123,
  },
  {
    id: "eb-032",
    slug: "reussir-teletravail",
    title: "Guide pratique : Réussir dans le travail à distance (télétravail)",
    description: "Outils, organisation et discipline pour exceller en télétravail et décrocher des missions bien rémunérées à distance.",
    price: 3500,
    category: "Business Numérique, IA & Tech",
    cover: "/covers/teletravail.jpg",
    pages: 125,
    rating: 4.6,
    reviews: 167,
  },

  // ── Gestion, Droit & Finance ──
  {
    id: "eb-033",
    slug: "investir-en-bourse",
    title: "Guide pratique : Comment investir en bourse",
    description: "Initiez-vous à la bourse africaine et internationale : actions, dividendes, analyse technique et stratégies pour investisseurs débutants.",
    price: 5500,
    originalPrice: 7500,
    category: "Gestion, Droit & Finance",
    cover: "/covers/investir-bourse.jpg",
    pages: 195,
    rating: 4.8,
    reviews: 234,
  },
  {
    id: "eb-034",
    slug: "obtenir-financement",
    title: "Guide pratique : Comment obtenir des financements pour ses projets",
    description: "Subventions, microcrédits, investisseurs et banques : toutes les stratégies pour financer votre projet en Afrique sans se faire refuser.",
    price: 5000,
    category: "Gestion, Droit & Finance",
    cover: "/covers/obtenir-financement.jpg",
    pages: 175,
    rating: 4.9,
    reviews: 289,
    bestseller: true,
  },
  {
    id: "eb-035",
    slug: "contrats-juridiques",
    title: "Guide pratique : Comprendre, rédiger et gérer ses contrats et plaintes juridiques",
    description: "Guide juridique pratique pour rédiger des contrats solides, gérer les litiges et défendre vos droits sans forcément passer par un avocat.",
    price: 5000,
    originalPrice: 7000,
    category: "Gestion, Droit & Finance",
    cover: "/covers/contrats-juridique.jpg",
    pages: 190,
    rating: 4.7,
    reviews: 156,
  },
];

export const services: Service[] = [
  {
    id: "svc-001",
    slug: "voix-off",
    title: "Voix Off Professionnelle",
    description: "Des voix off captivantes pour vos publicités, présentations et vidéos.",
    longDescription:
      "Donnez vie à vos contenus avec des enregistrements audio de qualité studio. Nos voix off professionnelles s'adaptent à tous vos besoins : publicités radio/TV, e-learning, documentaires, présentations d'entreprise, livres audio et plus encore.",
    icon: "Mic",
    startingPrice: 15000,
    deliveryTime: "24-48h",
    features: [
      "Voix masculines et féminines disponibles",
      "Plusieurs accents francophones",
      "Qualité studio (192kHz)",
      "Formats MP3, WAV, AIFF",
      "Corrections incluses",
      "Livraison rapide",
    ],
    packages: [
      {
        name: "Starter",
        price: 15000,
        deliveryTime: "48h",
        features: [
          "Jusqu'à 300 mots",
          "1 voix au choix",
          "Format MP3",
          "1 correction incluse",
        ],
      },
      {
        name: "Pro",
        price: 30000,
        deliveryTime: "24h",
        features: [
          "Jusqu'à 600 mots",
          "2 voix au choix",
          "Formats MP3 + WAV",
          "3 corrections incluses",
          "Musique de fond optionnelle",
        ],
        popular: true,
      },
      {
        name: "Business",
        price: 55000,
        deliveryTime: "12h",
        features: [
          "Mots illimités",
          "Toutes les voix disponibles",
          "Tous formats audio",
          "Corrections illimitées",
          "Musique de fond incluse",
          "Support prioritaire",
        ],
      },
    ],
  },
  {
    id: "svc-002",
    slug: "creation-video",
    title: "Création Vidéo",
    description: "Vidéos promotionnelles, publicités et contenus engageants pour vos réseaux.",
    longDescription:
      "Augmentez votre visibilité et convertissez vos prospects grâce à des vidéos professionnelles. Nous créons des contenus vidéo adaptés à votre secteur : publicités pour entreprises, vidéos de présentation, contenus pour réseaux sociaux, tutoriels et bien plus.",
    icon: "Video",
    startingPrice: 25000,
    deliveryTime: "48-72h",
    features: [
      "Montage vidéo professionnel",
      "Motion design & animations",
      "Ajout de voix off",
      "Sous-titres inclus",
      "Formats adaptés (Story, Reel, YouTube...)",
      "Musique libre de droits",
    ],
    packages: [
      {
        name: "Basic",
        price: 25000,
        deliveryTime: "72h",
        features: [
          "Vidéo jusqu'à 30 secondes",
          "Montage simple",
          "1 format",
          "1 révision",
        ],
      },
      {
        name: "Avancé",
        price: 55000,
        deliveryTime: "48h",
        features: [
          "Vidéo jusqu'à 2 minutes",
          "Montage + animations",
          "3 formats (Story/Reel/YouTube)",
          "Voix off incluse",
          "3 révisions",
        ],
        popular: true,
      },
      {
        name: "Premium",
        price: 100000,
        deliveryTime: "24h",
        features: [
          "Vidéo jusqu'à 5 minutes",
          "Montage cinématique",
          "Tous formats",
          "Voix off + musique",
          "Révisions illimitées",
          "Livraison express",
        ],
      },
    ],
  },
  {
    id: "svc-003",
    slug: "commande-produits",
    title: "Commande & Sourcing Produits",
    description: "Nous sourçons et commandons vos produits au meilleur prix pour votre business.",
    longDescription:
      "Vous cherchez des produits spécifiques pour votre commerce ou votre usage personnel ? Nous prenons en charge tout le processus : recherche de fournisseurs, négociation des prix, commande et livraison. Profitez de notre réseau de fournisseurs de confiance.",
    icon: "ShoppingBag",
    startingPrice: 5000,
    deliveryTime: "5-15 jours",
    features: [
      "Recherche de fournisseurs fiables",
      "Négociation des meilleurs prix",
      "Vérification qualité",
      "Suivi de commande en temps réel",
      "Gestion des retours",
      "Produits de toutes catégories",
    ],
    packages: [
      {
        name: "Particulier",
        price: 5000,
        deliveryTime: "7-15 jours",
        features: [
          "1 à 5 articles",
          "Recherche fournisseur",
          "Suivi basique",
          "Support email",
        ],
      },
      {
        name: "Commerçant",
        price: 15000,
        deliveryTime: "5-10 jours",
        features: [
          "Jusqu'à 50 articles",
          "Multi-fournisseurs",
          "Vérification qualité",
          "Suivi en temps réel",
          "Support WhatsApp",
        ],
        popular: true,
      },
      {
        name: "Entreprise",
        price: 35000,
        deliveryTime: "5-7 jours",
        features: [
          "Articles illimités",
          "Sourcing global",
          "Contrôle qualité complet",
          "Gestion des douanes",
          "Manager dédié",
          "Facturation adaptée",
        ],
      },
    ],
  },
];

export const testimonials = [
  {
    id: 1,
    name: "Patrick Kamga",
    role: "Entrepreneur Digital",
    avatar: "PK",
    content:
      "J'ai acheté 3 ebooks sur le marketing digital. Des contenus riches et pratiques qui m'ont vraiment aidé à développer mon business en ligne.",
    rating: 5,
  },
  {
    id: 2,
    name: "Marie Nguetsop",
    role: "Gérante de Boutique",
    avatar: "MN",
    content:
      "L'ebook sur la librairie rentable m'a donné toutes les clés pour lancer mon activité. Étape par étape, très clair. Je recommande !",
    rating: 5,
  },
  {
    id: 3,
    name: "Sandrine Fotso",
    role: "Agricultrice",
    avatar: "SF",
    content:
      "Grâce à l'ebook sur la culture de la tomate, j'ai doublé ma production cette saison. Les conseils sont vraiment adaptés au terrain africain.",
    rating: 5,
  },
  {
    id: 4,
    name: "Jean-Paul Mbida",
    role: "Commerçant",
    avatar: "JM",
    content:
      "L'ebook sur le dépôt de boissons m'a permis d'éviter les erreurs de débutant. Très bon investissement pour le prix.",
    rating: 4,
  },
  {
    id: 5,
    name: "Aïcha Kouam",
    role: "Entrepreneure",
    avatar: "AK",
    content:
      "J'ai acheté le guide sur le salon de coiffure rentable et j'ai ouvert mon salon en 3 mois. Tout était expliqué, du budget au recrutement.",
    rating: 5,
  },
  {
    id: 6,
    name: "Samuel Essomba",
    role: "Éleveur",
    avatar: "SE",
    content:
      "Le guide complet sur l'élevage de poulets pondeuses est une mine d'or. J'ai maintenant 500 poules et mon activité est rentable.",
    rating: 5,
  },
];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
}
