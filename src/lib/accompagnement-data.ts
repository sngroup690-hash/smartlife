export type Espace = {
  id: string;
  slug: string;
  titre: string;
  description: string;
  descriptionLongue: string;
  icone: string;
  categorie: string;
  investissementMin: number;
  investissementMax: number;
  dureeAccompagnement: string;
  avantages: string[];
  exigences: string[];
  etapes: string[];
  places: number;
  image?: string;
};

export const espaces: Espace[] = [
  {
    id: "esp-001",
    slug: "pressing",
    titre: "Pressing & Blanchisserie",
    description: "Créez et gérez un service de pressing professionnel avec notre accompagnement complet.",
    descriptionLongue:
      "Le secteur du pressing est en pleine expansion au Cameroun. Nous vous accompagnons dans la création de votre pressing : choix de l'équipement, formation des employés, stratégie commerciale et gestion quotidienne. Un business rentable avec un retour sur investissement rapide.",
    icone: "👔",
    categorie: "Services",
    image: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=600&h=400&fit=crop&q=80",
    investissementMin: 500000,
    investissementMax: 2000000,
    dureeAccompagnement: "3 mois",
    places: 5,
    avantages: [
      "Demande constante et croissante",
      "Retour sur investissement en 6-12 mois",
      "Marges bénéficiaires élevées",
      "Clientèle fidèle et récurrente",
      "Faible concurrence dans certaines zones",
    ],
    exigences: [
      "Local commercial de 20m² minimum",
      "Investissement initial disponible",
      "Disponibilité pour la formation (2 semaines)",
      "Motivation et sérieux",
    ],
    etapes: [
      "Inscription et évaluation du dossier",
      "Validation par l'administrateur",
      "Étude de marché de votre zone",
      "Formation métier et gestion",
      "Accompagnement à l'installation",
      "Suivi mensuel pendant 3 mois",
    ],
  },
  {
    id: "esp-002",
    slug: "elevage-poissons",
    titre: "Élevage de Poissons (Pisciculture)",
    description: "Lancez votre ferme piscicole avec un encadrement technique et commercial expert.",
    descriptionLongue:
      "La pisciculture est un secteur très porteur au Cameroun avec une forte demande en protéines animales. Notre équipe d'experts vous accompagne de A à Z : choix du site, construction des bassins, sélection des espèces (tilapia, clarias), alimentation, gestion sanitaire et commercialisation.",
    icone: "🐟",
    categorie: "Agriculture",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop&q=80",
    investissementMin: 800000,
    investissementMax: 5000000,
    dureeAccompagnement: "6 mois",
    places: 8,
    avantages: [
      "Secteur subventionné par l'État",
      "Forte demande locale et régionale",
      "Revenus complémentaires possibles",
      "Respect de l'environnement",
      "Valorisation des terres disponibles",
    ],
    exigences: [
      "Terrain avec accès à l'eau (rivière, forage)",
      "Surface minimale de 500m²",
      "Investissement initial disponible",
      "Résidence proche du site de production",
    ],
    etapes: [
      "Inscription et évaluation du dossier",
      "Validation par l'administrateur",
      "Visite et analyse du site",
      "Formation technique piscicole",
      "Mise en place des bassins",
      "Suivi et commercialisation",
    ],
  },
  {
    id: "esp-003",
    slug: "quincaillerie",
    titre: "Quincaillerie & Matériaux",
    description: "Ouvrez votre quincaillerie avec un accompagnement en approvisionnement et gestion.",
    descriptionLongue:
      "Le secteur BTP est en plein essor et les quincailleries sont des commerces très rentables. Nous vous aidons à choisir les bons produits, négocier avec les fournisseurs, organiser votre espace de vente, gérer vos stocks et fidéliser votre clientèle professionnelle et particulière.",
    icone: "🔧",
    categorie: "Commerce",
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=400&fit=crop&q=80",
    investissementMin: 1500000,
    investissementMax: 10000000,
    dureeAccompagnement: "4 mois",
    places: 4,
    avantages: [
      "Marché porteur lié au BTP",
      "Clientèle professionnelle stable",
      "Diversification des produits possible",
      "Forte valeur ajoutée par le conseil",
      "Réseau fournisseurs déjà établi",
    ],
    exigences: [
      "Local commercial de 50m² minimum",
      "Capitaux disponibles pour le stock initial",
      "Connaissance de base des matériaux",
      "Sens du commerce et du relationnel",
    ],
    etapes: [
      "Inscription et évaluation du dossier",
      "Validation par l'administrateur",
      "Étude de zone et concurrence",
      "Formation gestion commerciale",
      "Mise en relation fournisseurs",
      "Ouverture et suivi pendant 4 mois",
    ],
  },
  {
    id: "esp-004",
    slug: "restaurant-snack",
    titre: "Restaurant & Snack",
    description: "Créez votre restauration avec des recettes éprouvées et un accompagnement complet.",
    descriptionLongue:
      "La restauration est l'un des secteurs les plus accessibles et les plus rentables. Nous vous accompagnons dans le choix du concept, des recettes, de l'équipement, de la décoration, du recrutement et de la gestion. Que ce soit un snack de quartier ou un restaurant thématique.",
    icone: "🍽️",
    categorie: "Restauration",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop&q=80",
    investissementMin: 300000,
    investissementMax: 3000000,
    dureeAccompagnement: "3 mois",
    places: 6,
    avantages: [
      "Faible investissement de départ possible",
      "Retour sur investissement rapide",
      "Clientèle locale fidèle",
      "Flexibilité des horaires et du concept",
      "Possibilité de livraison à domicile",
    ],
    exigences: [
      "Local ou espace disponible",
      "Passion pour la cuisine",
      "Respect des normes d'hygiène",
      "Disponibilité complète au lancement",
    ],
    etapes: [
      "Inscription et évaluation du dossier",
      "Validation par l'administrateur",
      "Définition du concept et des recettes",
      "Formation hygiène et gestion",
      "Accompagnement à l'ouverture",
      "Suivi et optimisation 3 mois",
    ],
  },
  {
    id: "esp-005",
    slug: "salon-coiffure",
    titre: "Salon de Coiffure & Beauté",
    description: "Ouvrez votre salon avec un accompagnement en gestion, décoration et fidélisation.",
    descriptionLongue:
      "Le secteur de la beauté ne connaît pas la crise ! Salons de coiffure, centres esthétiques et instituts de beauté ont une clientèle fidèle et des revenus réguliers. Nous vous aidons à créer un salon attractif, recruter des coiffeurs qualifiés et développer votre portefeuille clients.",
    icone: "💇",
    categorie: "Beauté",
    image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=400&fit=crop&q=80",
    investissementMin: 400000,
    investissementMax: 2500000,
    dureeAccompagnement: "2 mois",
    places: 7,
    avantages: [
      "Clientèle féminine très fidèle",
      "Revenus réguliers et prévisibles",
      "Possibilité de vente de produits",
      "Faible saisonnalité",
      "Facilité d'extension des services",
    ],
    exigences: [
      "Local accessible, idéalement en centre-ville",
      "Formation en coiffure ou partenariat",
      "Sens de l'esthétique et du service",
      "Investissement en matériel de qualité",
    ],
    etapes: [
      "Inscription et évaluation du dossier",
      "Validation par l'administrateur",
      "Étude de positionnement",
      "Formation gestion salon",
      "Aménagement et équipement",
      "Lancement et fidélisation",
    ],
  },
  {
    id: "esp-006",
    slug: "commerce-general",
    titre: "Commerce Général (Boutique)",
    description: "Lancez votre boutique de commerce général avec un sourcing optimisé et une gestion pro.",
    descriptionLongue:
      "Le commerce général reste l'une des activités les plus accessibles pour les entrepreneurs débutants. Nous vous aidons à choisir les bons produits, négocier les prix avec les grossistes, organiser votre espace, gérer votre trésorerie et développer votre chiffre d'affaires.",
    icone: "🏪",
    categorie: "Commerce",
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&h=400&fit=crop&q=80",
    investissementMin: 250000,
    investissementMax: 2000000,
    dureeAccompagnement: "2 mois",
    places: 10,
    avantages: [
      "Démarrage accessible avec peu de capital",
      "Diversité des produits possibles",
      "Clientèle locale immédiate",
      "Flexibilité et adaptabilité",
      "Possibilité d'évolution rapide",
    ],
    exigences: [
      "Local commercial ou espace de vente",
      "Capital pour le stock initial",
      "Organisation et rigueur",
      "Sens du commerce",
    ],
    etapes: [
      "Inscription et évaluation du dossier",
      "Validation par l'administrateur",
      "Analyse de la zone et des besoins",
      "Formation en gestion commerciale",
      "Mise en relation avec les fournisseurs",
      "Suivi et optimisation",
    ],
  },
  {
    id: "esp-007",
    slug: "boulangerie-patisserie",
    titre: "Boulangerie & Pâtisserie",
    description: "Créez votre boulangerie artisanale avec des recettes, l'équipement et l'encadrement.",
    descriptionLongue:
      "La boulangerie est un secteur porteur avec une demande quotidienne. Pain, viennoiseries, gâteaux : nous vous formons aux recettes, vous aidons à choisir l'équipement adapté, à trouver vos fournisseurs de farine et matières premières, et à fidéliser votre clientèle de quartier.",
    icone: "🥖",
    categorie: "Alimentaire",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop&q=80",
    investissementMin: 600000,
    investissementMax: 4000000,
    dureeAccompagnement: "4 mois",
    places: 4,
    avantages: [
      "Demande quotidienne et stable",
      "Fidélisation clientèle naturelle",
      "Diversification produits facile",
      "Reconnaissance dans le quartier",
      "Revenus dès le premier jour",
    ],
    exigences: [
      "Local avec accès électrique adapté",
      "Intérêt pour la boulangerie / pâtisserie",
      "Capacité à gérer une équipe",
      "Respect des normes d'hygiène alimentaire",
    ],
    etapes: [
      "Inscription et évaluation du dossier",
      "Validation par l'administrateur",
      "Formation boulangerie et gestion",
      "Équipement et installation du four",
      "Lancement et communication locale",
      "Suivi qualité et développement",
    ],
  },
  {
    id: "esp-008",
    slug: "pharmacie-parapharmacie",
    titre: "Parapharmacie & Produits de Santé",
    description: "Ouvrez votre espace parapharmacie avec un accompagnement en réglementation et sourcing.",
    descriptionLongue:
      "Le secteur de la santé et du bien-être est en forte croissance. Nous vous accompagnons dans la création d'une parapharmacie : réglementation, sourcing de produits certifiés, aménagement de l'espace, formation sur les produits et stratégie commerciale pour attirer et fidéliser votre clientèle.",
    icone: "💊",
    categorie: "Santé & Bien-être",
    image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&h=400&fit=crop&q=80",
    investissementMin: 1000000,
    investissementMax: 5000000,
    dureeAccompagnement: "5 mois",
    places: 3,
    avantages: [
      "Secteur en croissance constante",
      "Marges élevées sur certains produits",
      "Clientèle de confiance récurrente",
      "Diversification cosmétiques possible",
      "Image professionnelle valorisante",
    ],
    exigences: [
      "Local en zone passante",
      "Diplôme ou formation en santé (souhaitée)",
      "Respect strict de la réglementation",
      "Capital pour le stock initial",
    ],
    etapes: [
      "Inscription et évaluation du dossier",
      "Validation par l'administrateur",
      "Accompagnement réglementaire",
      "Formation produits et conseils",
      "Aménagement et ouverture",
      "Suivi et développement",
    ],
  },
];

export const categories = [...new Set(espaces.map((e) => e.categorie))];

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}
