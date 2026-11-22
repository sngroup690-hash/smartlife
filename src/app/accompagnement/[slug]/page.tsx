"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, ArrowRight, Users, AlertCircle, Send, Mail,
  TrendingUp, Clock, Wallet, Shield, Star, ChevronRight,
  MapPin, Phone, Briefcase, MessageSquare,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useAccompagnementStore, EspacePersonnalise } from "@/lib/accompagnement-store";
import { espaces as STATIC_ESPACES } from "@/lib/accompagnement-data";
import { useUserStore } from "@/lib/user-store";
import ReviewSection from "@/components/ReviewSection";
import { DescriptionRenderer } from "@/components/DescriptionRenderer";
import AnimateOnScroll, { StaggerContainer, StaggerItem, AnimatedCounter } from "@/components/AnimateOnScroll";

const PHOTOS_PRO: { mots: string[]; url: string }[] = [
  { mots: ["assurance", "compagnie"], url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop&q=80" },
  { mots: ["cuisine", "restaurant", "snack", "caftria", "cafétéria"], url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=600&fit=crop&q=80" },
  { mots: ["poisson", "pisciculture", "poissonnerie"], url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=600&fit=crop&q=80" },
  { mots: ["boulangerie", "pâtisserie", "ptisserie", "bonbon", "biscuit", "chocolat"], url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&h=600&fit=crop&q=80" },
  { mots: ["pressing", "blanchisserie", "laverie"], url: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=1200&h=600&fit=crop&q=80" },
  { mots: ["coiffure", "salon", "beauté", "styliste", "cosmeti"], url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=600&fit=crop&q=80" },
  { mots: ["quincaillerie", "aluminium", "vitre", "parpaing", "pavé", "construction", "topograph"], url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1200&h=600&fit=crop&q=80" },
  { mots: ["commerce", "boutique", "alimentation", "pices", "épice"], url: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&h=600&fit=crop&q=80" },
  { mots: ["pharmacie", "parapharmacie", "santé", "baume", "gel douche", "dtergent", "savon"], url: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&h=600&fit=crop&q=80" },
  { mots: ["élevage", "levage", "poulet", "porc", "boeuf", "buf", "canard", "lapin", "escargot", "hanneton"], url: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&h=600&fit=crop&q=80" },
  { mots: ["culture", "plantain", "tomate", "oignon", "gombo", "aubergine", "avocat", "carotte", "haricot", "gingembre", "poivron", "pomme de terre", "concombre", "chou", "piment", "pastèque", "champignon", "aloe", "poivre"], url: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&h=600&fit=crop&q=80" },
  { mots: ["palmier", "huile"], url: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&h=600&fit=crop&q=80" },
  { mots: ["apiculture", "miel", "abeille"], url: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=1200&h=600&fit=crop&q=80" },
  { mots: ["école", "crèche", "garderie", "code de la route"], url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=600&fit=crop&q=80" },
  { mots: ["microfinance", "librairie"], url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&h=600&fit=crop&q=80" },
  { mots: ["vnementielle", "événementiel", "agence"], url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop&q=80" },
  { mots: ["whatsapp", "distance", "digital"], url: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200&h=600&fit=crop&q=80" },
  { mots: ["boisson", "dépôt", "dpot"], url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=600&fit=crop&q=80" },
  { mots: ["shawarma", "glace"], url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&h=600&fit=crop&q=80" },
  { mots: ["sécurité", "gardiennage", "scurit"], url: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&h=600&fit=crop&q=80" },
  { mots: ["meublé", "meubl"], url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&h=600&fit=crop&q=80" },
  { mots: ["lunette", "optique"], url: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1200&h=600&fit=crop&q=80" },
  { mots: ["oeuf", "dpt dufs", "dpot dufs"], url: "https://images.unsplash.com/photo-1569288063643-5d29ad64df09?w=1200&h=600&fit=crop&q=80" },
  { mots: ["automobile", "pièces"], url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&h=600&fit=crop&q=80" },
  { mots: ["maison", "construire"], url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=600&fit=crop&q=80" },
  { mots: ["froid", "climatisation"], url: "https://images.unsplash.com/photo-1631545806609-30b2d6e1d890?w=1200&h=600&fit=crop&q=80" },
  { mots: ["aliment", "fabriqu", "fabrication"], url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=600&fit=crop&q=80" },
];

function getPhotoPro(titre: string): string | null {
  const t = titre.toLowerCase();
  for (const p of PHOTOS_PRO) {
    if (p.mots.some((m) => t.includes(m))) return p.url;
  }
  return null;
}

const IMAGES_CONTENU: { mots: string[]; images: { url: string; legende: string }[] }[] = [
  { mots: ["assurance", "compagnie"], images: [
    { url: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=500&fit=crop&q=80", legende: "Contrat professionnel" },
    { url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=500&fit=crop&q=80", legende: "Suivi personnalisé" },
  ]},
  { mots: ["cuisine", "restaurant", "snack", "caftria", "cafétéria"], images: [
    { url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=450&fit=crop&q=80", legende: "Une présentation soignée pour fidéliser" },
    { url: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=450&fit=crop&q=80", legende: "Un chef passionné à l'œuvre" },
  ]},
  { mots: ["poisson", "pisciculture", "poissonnerie"], images: [
    { url: "https://images.unsplash.com/photo-1498654200943-1088dd4438ae?w=800&h=450&fit=crop&q=80", legende: "Bassins professionnels modernes" },
    { url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&h=450&fit=crop&q=80", legende: "Poissons frais et de qualité" },
  ]},
  { mots: ["boulangerie", "pâtisserie", "ptisserie"], images: [
    { url: "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800&h=450&fit=crop&q=80", legende: "Le savoir-faire artisanal" },
    { url: "https://images.unsplash.com/photo-1486427944544-d2c246c4df4a?w=800&h=450&fit=crop&q=80", legende: "Des produits qui font revenir les clients" },
  ]},
  { mots: ["pressing", "blanchisserie", "laverie"], images: [
    { url: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&h=450&fit=crop&q=80", legende: "Équipement professionnel performant" },
    { url: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&h=450&fit=crop&q=80", legende: "Service impeccable garanti" },
  ]},
  { mots: ["coiffure", "salon", "beauté", "cosmeti"], images: [
    { url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=450&fit=crop&q=80", legende: "Un salon moderne et accueillant" },
    { url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=450&fit=crop&q=80", legende: "Des soins de qualité professionnelle" },
  ]},
  { mots: ["quincaillerie", "aluminium", "construction", "topograph"], images: [
    { url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=450&fit=crop&q=80", legende: "Matériaux de qualité pour vos projets" },
    { url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=450&fit=crop&q=80", legende: "Le secteur BTP en plein essor" },
  ]},
  { mots: ["commerce", "boutique", "alimentation"], images: [
    { url: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&h=450&fit=crop&q=80", legende: "Un commerce bien organisé attire les clients" },
    { url: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&h=450&fit=crop&q=80", legende: "Diversité des produits et satisfaction" },
  ]},
  { mots: ["pharmacie", "parapharmacie", "santé", "savon", "dtergent"], images: [
    { url: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800&h=450&fit=crop&q=80", legende: "Un espace de santé de confiance" },
    { url: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&h=450&fit=crop&q=80", legende: "Des produits certifiés et fiables" },
  ]},
  { mots: ["élevage", "levage", "poulet", "porc", "boeuf"], images: [
    { url: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=450&fit=crop&q=80", legende: "Un élevage bien géré" },
    { url: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=450&fit=crop&q=80", legende: "Le potentiel de l'agriculture africaine" },
  ]},
  { mots: ["culture", "plantain", "tomate", "agriculture", "gombo", "champignon", "aloe"], images: [
    { url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=450&fit=crop&q=80", legende: "Des récoltes abondantes et saines" },
    { url: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=450&fit=crop&q=80", legende: "L'agriculture, pilier de l'économie" },
  ]},
  { mots: ["école", "crèche", "garderie", "code de la route"], images: [
    { url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop&q=80", legende: "Investir dans l'éducation" },
    { url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=450&fit=crop&q=80", legende: "Un cadre d'apprentissage de qualité" },
  ]},
  { mots: ["vnementielle", "événementiel", "agence"], images: [
    { url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop&q=80", legende: "Des événements mémorables" },
    { url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=450&fit=crop&q=80", legende: "Organisation et créativité" },
  ]},
  { mots: ["sécurité", "gardiennage", "scurit"], images: [
    { url: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&h=450&fit=crop&q=80", legende: "Protection et vigilance" },
    { url: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=450&fit=crop&q=80", legende: "Équipement de sécurité moderne" },
  ]},
  { mots: ["meublé", "meubl"], images: [
    { url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=450&fit=crop&q=80", legende: "Intérieurs de qualité" },
    { url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=450&fit=crop&q=80", legende: "Le confort qui fait la différence" },
  ]},
  { mots: ["maison", "construire"], images: [
    { url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=450&fit=crop&q=80", legende: "Votre projet immobilier accompagné" },
    { url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=450&fit=crop&q=80", legende: "Construire avec les bons partenaires" },
  ]},
];

function getImagesContenu(titre: string): { url: string; legende: string }[] {
  const t = titre.toLowerCase();
  for (const ic of IMAGES_CONTENU) {
    if (ic.mots.some((m) => t.includes(m))) return ic.images;
  }
  return [];
}

const IMAGES_AVANTAGES: { mots: string[]; url: string }[] = [
  { mots: ["investissement", "capital", "départ", "accessible"], url: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=250&fit=crop&q=80" },
  { mots: ["retour", "rentab", "bénéfic", "marges", "revenus", "chiffre"], url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop&q=80" },
  { mots: ["clientèle", "fidèle", "client", "récurrent"], url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=250&fit=crop&q=80" },
  { mots: ["demande", "croissant", "porteur", "essor", "expansion"], url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=250&fit=crop&q=80" },
  { mots: ["concurrence", "faible", "zone"], url: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=250&fit=crop&q=80" },
  { mots: ["subventionné", "état", "gouvernement"], url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=250&fit=crop&q=80" },
  { mots: ["environnement", "nature", "durable", "respect"], url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=250&fit=crop&q=80" },
  { mots: ["diversif", "extension", "évolution", "produits possible"], url: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=400&h=250&fit=crop&q=80" },
  { mots: ["flexib", "adaptab", "horaire"], url: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400&h=250&fit=crop&q=80" },
  { mots: ["quotidien", "stable", "régulier", "constant", "premier jour"], url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=250&fit=crop&q=80" },
  { mots: ["professionnel", "valorisant", "image", "confiance", "reconnaissance"], url: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=250&fit=crop&q=80" },
  { mots: ["réseau", "fournisseur", "partenaire", "livraison"], url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop&q=80" },
  { mots: ["saisonnal", "féminin", "vente"], url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=250&fit=crop&q=80" },
  { mots: ["terrain", "terre", "local", "site"], url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=250&fit=crop&q=80" },
];

function getImageAvantage(texte: string): string {
  const t = texte.toLowerCase();
  for (const ia of IMAGES_AVANTAGES) {
    if (ia.mots.some((m) => t.includes(m))) return ia.url;
  }
  return "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=250&fit=crop&q=80";
}

const inputCls =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#27A827] focus:ring-2 focus:ring-[#27A827]/10 focus:bg-white transition-all text-sm";
const selectCls =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#27A827] focus:ring-2 focus:ring-[#27A827]/10 focus:bg-white transition-all text-sm";
const labelCls = "block text-gray-700 text-sm font-medium mb-1.5";

const PHOTOS_SECTIONS: { mots: string[]; url: string }[] = [
  { mots: ["comprendre", "fonctionnement", "découvrir", "explorer"], url: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=800&h=400&fit=crop&q=80" },
  { mots: ["marché", "opportunit", "étudier", "analyser", "recherche"], url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop&q=80" },
  { mots: ["modèle", "entreprise", "business", "plan", "stratég"], url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop&q=80" },
  { mots: ["formation", "apprendre", "maîtriser", "compétence"], url: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=800&h=400&fit=crop&q=80" },
  { mots: ["financ", "budget", "investiss", "capital", "trésorerie"], url: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=400&fit=crop&q=80" },
  { mots: ["lancer", "ouverture", "démarr", "install"], url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=400&fit=crop&q=80" },
  { mots: ["gestion", "organiser", "gérer", "quotidien"], url: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=400&fit=crop&q=80" },
  { mots: ["marketing", "communication", "promouvoir", "vendre", "vente"], url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=400&fit=crop&q=80" },
  { mots: ["client", "fidélis", "satisfaction", "accueil"], url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=400&fit=crop&q=80" },
  { mots: ["équipe", "recrutement", "personnel", "employé"], url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop&q=80" },
  { mots: ["hygiène", "norme", "réglementati", "qualité", "sécurité"], url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=400&fit=crop&q=80" },
  { mots: ["présentation", "dressage", "recette", "cuisine", "plat"], url: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&h=400&fit=crop&q=80" },
  { mots: ["technique", "équipement", "matériel", "outil"], url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&h=400&fit=crop&q=80" },
  { mots: ["croissance", "développ", "expansion", "suivi"], url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop&q=80" },
];

function enrichirDescription(html: string): string {
  let compteur = 0;
  return html.replace(
    /(<\/h[23]>|<\/b>|<\/strong>)/gi,
    (match, tag, offset) => {
      const avant = html.slice(Math.max(0, offset - 200), offset).toLowerCase();
      for (const ps of PHOTOS_SECTIONS) {
        if (ps.mots.some((m) => avant.includes(m))) {
          compteur++;
          if (compteur <= 4) {
            return `${match}<img src="${ps.url}" alt="" style="width:100%;height:auto;border-radius:16px;margin:16px 0;box-shadow:0 4px 15px rgba(0,0,0,0.1)" loading="lazy" />`;
          }
          return match;
        }
      }
      return match;
    }
  );
}

type Mode = "info" | "login" | "inscription";

function TimelineStep({ step, index, total }: { step: string; index: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="flex gap-4 relative"
    >
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ type: "spring", stiffness: 300, delay: index * 0.1 + 0.1 }}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8B800] to-[#27A827] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md"
        >
          {index + 1}
        </motion.div>
        {index < total - 1 && (
          <div className="w-0.5 flex-1 bg-gradient-to-b from-[#27A827]/30 to-transparent mt-1" />
        )}
      </div>
      <div className="pb-6">
        <p className="text-gray-800 text-base font-medium leading-relaxed pt-2">{step}</p>
      </div>
    </motion.div>
  );
}

export default function EspaceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const store = useAccompagnementStore();

  const [allServerEspaces, setAllServerEspaces] = useState<EspacePersonnalise[]>(store.espaces);
  const [serverLoading, setServerLoading] = useState(true);

  useEffect(() => {
    fetch("/api/espaces")
      .then((r) => r.json())
      .then((data: { espaces: EspacePersonnalise[] }) => {
        if (Array.isArray(data.espaces) && data.espaces.length > 0) {
          setAllServerEspaces(data.espaces);
        }
      })
      .catch(() => {})
      .finally(() => setServerLoading(false));
  }, [slug]);

  const espace = allServerEspaces.find((e) => e.id === slug);
  const staticEspace = STATIC_ESPACES.find((e) => e.id === slug);
  const userStore = useUserStore();
  const clientConnecte = store.clientConnecte ? store.getClientById(store.clientConnecte) : null;
  const demandeExistante = clientConnecte
    ? store.getDemandeParEspace(clientConnecte.id, slug)
    : undefined;

  const [mode, setMode] = useState<Mode>("info");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const [form, setForm] = useState({
    nom: "", email: "", telephone: "", ville: "",
    profession: "", capital: "", motivation: "",
    secteurActivite: "", secteurAutre: "",
  });

  useEffect(() => {
    const user = userStore.currentUser;
    if (!user || store.clientConnecte) return;
    const existing = store.connecterClient(user.email);
    if (!existing) {
      setForm((prev) => ({
        ...prev,
        nom: prev.nom || [user.firstName, user.lastName].filter(Boolean).join(" "),
        email: prev.email || user.email,
        telephone: prev.telephone || user.phone,
      }));
      setMode("inscription");
    }
  }, [userStore.currentUser, store.clientConnecte, store]);
  const [imgError, setImgError] = useState(false);
  const [secteurs, setSecteurs] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/secteurs")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.secteurs)) setSecteurs(d.secteurs); })
      .catch(() => {});
  }, []);

  if (serverLoading && !espace) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-[#E8B800] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!espace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">😔</div>
        <h1 className="text-gray-900 text-2xl font-bold mb-2">Espace introuvable</h1>
        <p className="text-gray-600 mb-6">Cet espace n&apos;existe pas ou a été désactivé.</p>
        <Link href="/accompagnement" className="px-6 py-3 bg-[#E8B800] text-black rounded-xl font-bold">
          Voir tous les espaces
        </Link>
      </div>
    );
  }

  const autresEspaces = allServerEspaces
    .filter((e) => e.actif && e.id !== espace.id)
    .slice(0, 3);

  const demandesEspace = store.demandes.filter((d) => d.espaceId === espace.id);
  const validees = demandesEspace.filter((d) => d.statut === "validee").length;
  const enAttente = demandesEspace.filter((d) => d.statut === "en_attente").length;
  const coverImage = espace.image || staticEspace?.image;
  const photoPro = getPhotoPro(espace.titre);
  const heroImage = photoPro || coverImage;
  const imagesContenu = getImagesContenu(espace.titre);
  const icone = staticEspace?.icone;
  const duree = staticEspace?.dureeAccompagnement;
  const investMin = staticEspace?.investissementMin;
  const investMax = staticEspace?.investissementMax;

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const client = store.connecterClient(loginEmail);
    if (!client) setLoginError("Aucun compte trouvé avec cet email. Veuillez vous inscrire.");
    else setLoginError("");
  }

  async function handleInscription(e: React.FormEvent) {
    e.preventDefault();
    if (!espace || !message.trim()) return;

    const existingClient = store.connecterClient(form.email);

    if (existingClient) {
      store.soumettreDemandeClient(existingClient.id, espace.id, espace.id, espace.titre, message);
      await fetch("/api/demandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { nom: existingClient.nom, email: existingClient.email, telephone: existingClient.telephone, ville: existingClient.ville ?? "", profession: existingClient.profession ?? "", capital: existingClient.capital ?? "", motivation: existingClient.motivation ?? "" },
          espaceId: espace.id, espaceSlug: espace.id, espaceTitre: espace.titre, message,
        }),
      }).catch(() => {});
    } else {
      const secteurFinal = form.secteurActivite === "Autre" ? form.secteurAutre.trim() || "Autre" : form.secteurActivite;
      const professionFull = [form.profession, secteurFinal].filter(Boolean).join(" — Secteur : ");
      store.soumettreDemandeAvecInscription(
        { nom: form.nom, email: form.email, telephone: form.telephone, ville: form.ville, profession: professionFull, capital: form.capital, motivation: form.motivation },
        espace.id, espace.id, espace.titre, message
      );
      await fetch("/api/demandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { nom: form.nom, email: form.email, telephone: form.telephone, ville: form.ville, profession: professionFull, capital: form.capital, motivation: form.motivation },
          espaceId: espace.id, espaceSlug: espace.id, espaceTitre: espace.titre, message,
        }),
      }).catch(() => {});
    }
    setSubmitted(true);
  }

  async function handleDemandeClientConnecte(e: React.FormEvent) {
    e.preventDefault();
    if (!espace || !clientConnecte || !message.trim()) return;
    store.soumettreDemandeClient(clientConnecte.id, espace.id, espace.id, espace.titre, message);
    await fetch("/api/demandes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: { nom: clientConnecte.nom, email: clientConnecte.email, telephone: clientConnecte.telephone, ville: clientConnecte.ville, profession: clientConnecte.profession ?? "", capital: clientConnecte.capital ?? "", motivation: clientConnecte.motivation ?? "" },
        espaceId: espace.id,
        espaceSlug: espace.id,
        espaceTitre: espace.titre,
        message,
      }),
    }).catch(() => {});
    setSubmitted(true);
  }

  const statutBadgeCls = (s: string) =>
    s === "validee" ? "bg-[#27A827]/10 border-[#27A827]/30 text-[#1a7a1a]"
    : s === "rejetee" ? "bg-red-50 border-red-200 text-red-600"
    : "bg-yellow-50 border-yellow-200 text-yellow-600";

  const statutLabel = (s: string) =>
    s === "validee" ? "Demande validée" : s === "rejetee" ? "Demande rejetée" : "En attente de validation";

  const etapes = espace.inclus?.filter(Boolean).length
    ? espace.inclus.filter(Boolean)
    : [
        "Étude personnalisée de votre projet et de votre zone",
        "Formation adaptée à votre secteur d'activité",
        "Mise en relation avec nos partenaires et fournisseurs",
        "Suivi régulier et conseils d'un expert dédié",
        "Accès au réseau d'entrepreneurs accompagnés",
      ];

  function scrollToPostuler() {
    document.getElementById("postuler")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen">

      {/* ═══ HERO AVEC IMAGE ═══ */}
      <section className="relative overflow-hidden">
        {heroImage && !imgError ? (
          <>
            <img
              src={heroImage}
              alt={espace.titre}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/50 to-white" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-yellow-50" />
        )}

        <div className="relative px-4 sm:px-6 lg:px-8 pt-6 pb-10 sm:pb-14">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 text-xs text-gray-500 mb-6"
          >
            <Link href="/accompagnement" className="hover:text-[#27A827] transition-colors">
              Accompagnement
            </Link>
            <ChevronRight size={12} />
            <span className="text-gray-700 font-medium">{espace.titre}</span>
          </motion.nav>

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-2 mb-4"
          >
            {icone && (
              <span className="text-2xl">{icone}</span>
            )}
            <span className="px-3 py-1 bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-600 rounded-full text-xs font-medium">
              {espace.domaine}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${
              espace.placesDisponibles <= 2
                ? "bg-orange-50/80 border-orange-200 text-orange-600"
                : "bg-[#27A827]/10 border-[#27A827]/30 text-[#1a7a1a]"
            }`}>
              <motion.span
                animate={espace.placesDisponibles <= 2 ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5 align-middle"
              />
              {espace.placesDisponibles} place{espace.placesDisponibles > 1 ? "s" : ""} disponible{espace.placesDisponibles > 1 ? "s" : ""}
            </span>
          </motion.div>

          {/* Titre */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-4 leading-[1.05]"
          >
            {espace.titre}
          </motion.h1>

          {/* Description courte */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-gray-600 text-lg sm:text-xl leading-relaxed max-w-xl mb-6"
          >
            {espace.descriptionCourte || espace.descriptionLongue?.slice(0, 150)}
          </motion.p>

          {/* Stats rapides */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-3 mb-6"
          >
            {duree && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-100 text-xs">
                <Clock size={14} className="text-[#E8B800]" />
                <span className="text-gray-700 font-medium">{duree}</span>
              </div>
            )}
            {investMin && investMax && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-100 text-xs">
                <Wallet size={14} className="text-[#27A827]" />
                <span className="text-gray-700 font-medium">
                  {(investMin / 1000).toFixed(0)}k – {(investMax / 1000000) >= 1 ? `${(investMax / 1000000).toFixed(0)}M` : `${(investMax / 1000).toFixed(0)}k`} FCFA
                </span>
              </div>
            )}
          </motion.div>

          {/* CTA hero */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              onClick={scrollToPostuler}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-3.5 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-white font-bold rounded-xl shadow-lg shadow-[#27A827]/20 flex items-center gap-2 text-sm"
            >
              Je veux être accompagné
              <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ═══ BANDE D'ACCROCHE ═══ */}
      <section className="bg-gradient-to-r from-[#27A827]/5 via-[#E8B800]/5 to-[#27A827]/5 border-y border-[#E8B800]/10">
        <div className="max-w-5xl mx-auto px-4 py-5 sm:py-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-[#27A827]" />
              <span className="text-gray-800 text-sm sm:text-base font-semibold">100% Gratuit</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-[#E8B800]/30" />
            <div className="flex items-center gap-2">
              <Star size={18} className="text-[#E8B800]" />
              <span className="text-gray-800 text-sm sm:text-base font-semibold">Expert dédié à votre projet</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-[#E8B800]/30" />
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[#27A827]" />
              <span className="text-gray-800 text-sm sm:text-base font-semibold">Réponse sous 48h</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-[#E8B800]/30" />
            <div className="flex items-center gap-2">
              <Users size={18} className="text-[#E8B800]" />
              <span className="text-gray-800 text-sm sm:text-base font-semibold">Réseau d&apos;entrepreneurs</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CONTENU PRINCIPAL ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start">

          {/* ── COLONNE INFO (3/5) ── */}
          <div className="lg:col-span-3 space-y-10">

            {/* Description longue */}
            {espace.descriptionLongue && (
              <AnimateOnScroll variant="fadeUp">
                <div className="prose prose-gray max-w-none">
                  <DescriptionRenderer
                    html={enrichirDescription(espace.descriptionLongue)}
                    className="text-gray-700 text-lg sm:text-xl leading-relaxed
                      [&_img]:rounded-xl [&_img]:my-4 [&_img]:shadow-lg
                      [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:text-lg
                      [&_li]:text-gray-700
                      [&_b]:text-[#E8B800] [&_b]:font-extrabold [&_b]:text-xl [&_b]:sm:text-2xl
                      [&_strong]:text-[#E8B800] [&_strong]:font-extrabold [&_strong]:text-xl [&_strong]:sm:text-2xl
                      [&_h2]:text-3xl [&_h2]:sm:text-4xl [&_h2]:font-black [&_h2]:text-[#E8B800] [&_h2]:mt-10 [&_h2]:mb-5 [&_h2]:border-l-4 [&_h2]:border-[#E8B800] [&_h2]:pl-4
                      [&_h3]:text-2xl [&_h3]:sm:text-3xl [&_h3]:font-bold [&_h3]:text-[#E8B800] [&_h3]:mt-8 [&_h3]:mb-4
                      [&_p]:mb-4
                      [&_i]:italic [&_em]:italic"
                  />
                </div>
              </AnimateOnScroll>
            )}

            {/* Images d'illustration dans le contenu */}
            {imagesContenu.length > 0 && (
              <AnimateOnScroll variant="fadeUp">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {imagesContenu.map((img, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 shadow-lg group">
                      <img
                        src={img.url}
                        alt={img.legende}
                        className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(ev) => { (ev.target as HTMLImageElement).closest('.group')!.remove(); }}
                      />
                      <div className="bg-[#E8B800] px-4 py-3">
                        <p className="text-white text-base sm:text-lg font-extrabold tracking-wide">{img.legende}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AnimateOnScroll>
            )}

            {/* Affiche admin dans le contenu */}
            {coverImage && photoPro && !imgError && (
              <AnimateOnScroll variant="fadeUp">
                <div className="rounded-2xl overflow-hidden border-2 border-[#E8B800]/20 shadow-xl bg-white">
                  <img
                    src={coverImage}
                    alt={espace.titre}
                    className="w-full object-contain max-h-[400px] sm:max-h-[500px]"
                    style={{ imageRendering: "auto" }}
                    onError={(ev) => { (ev.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                  />
                </div>
              </AnimateOnScroll>
            )}

            {/* Chiffres clés */}
            <AnimateOnScroll variant="fadeUp">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-5 bg-gradient-to-br from-[#E8B800]/5 to-[#E8B800]/10 border border-[#E8B800]/15 rounded-2xl text-center">
                  <div className="text-3xl sm:text-4xl font-black text-[#E8B800] mb-1">
                    <AnimatedCounter value={espace.placesDisponibles} />
                  </div>
                  <div className="text-gray-600 text-sm font-medium">place{espace.placesDisponibles > 1 ? "s" : ""} restante{espace.placesDisponibles > 1 ? "s" : ""}</div>
                </div>
                {espace.clientsSatisfaits > 0 && (
                  <div className="p-5 bg-gradient-to-br from-[#27A827]/5 to-[#27A827]/10 border border-[#27A827]/15 rounded-2xl text-center">
                    <div className="text-3xl sm:text-4xl font-black text-[#27A827] mb-1">
                      <AnimatedCounter value={espace.clientsSatisfaits} />
                    </div>
                    <div className="text-gray-600 text-sm font-medium">client{espace.clientsSatisfaits > 1 ? "s" : ""} satisfait{espace.clientsSatisfaits > 1 ? "s" : ""}</div>
                  </div>
                )}
                {validees > 0 && (
                  <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                    <div className="text-3xl sm:text-4xl font-black text-emerald-600 mb-1">{validees}</div>
                    <div className="text-gray-600 text-sm font-medium">candidature{validees > 1 ? "s" : ""} validée{validees > 1 ? "s" : ""}</div>
                  </div>
                )}
                {enAttente > 0 && (
                  <div className="p-5 bg-yellow-50 border border-yellow-100 rounded-2xl text-center">
                    <div className="text-3xl sm:text-4xl font-black text-yellow-600 mb-1">{enAttente}</div>
                    <div className="text-gray-600 text-sm font-medium">en cours d&apos;examen</div>
                  </div>
                )}
              </div>
            </AnimateOnScroll>

            {/* Avantages du secteur */}
            {espace.avantages?.filter(Boolean).length > 0 && (
              <AnimateOnScroll variant="fadeUp">
                <div className="p-5 sm:p-8 bg-gradient-to-br from-[#E8B800]/5 via-white to-[#27A827]/5 border-2 border-[#E8B800]/20 rounded-2xl">
                  <h3 className="text-gray-900 font-black text-2xl sm:text-3xl mb-8 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E8B800] to-[#27A827] flex items-center justify-center shadow-lg">
                      <TrendingUp size={24} className="text-white" />
                    </div>
                    Pourquoi ce secteur ?
                  </h3>
                  <StaggerContainer className="space-y-4">
                    {espace.avantages.filter(Boolean).map((a, i) => (
                      <StaggerItem key={i}>
                        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-md bg-white group">
                          <div className="flex flex-col sm:flex-row">
                            <div className="sm:w-32 sm:min-w-[8rem] h-28 sm:h-auto relative overflow-hidden">
                              <img
                                src={getImageAvantage(a)}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                                onError={(ev) => { (ev.target as HTMLImageElement).style.display = "none"; }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                            </div>
                            <div className="flex items-start gap-3 p-4 sm:p-5 flex-1">
                              <div className="w-8 h-8 rounded-full bg-[#27A827] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                <CheckCircle size={18} className="text-white" />
                              </div>
                              <p className="text-gray-900 text-lg sm:text-xl font-bold leading-snug">{a}</p>
                            </div>
                          </div>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </div>
              </AnimateOnScroll>
            )}

            {/* Étapes de l'accompagnement */}
            <AnimateOnScroll variant="fadeUp">
              <div className="p-5 sm:p-7 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <h3 className="text-gray-900 font-bold text-xl sm:text-2xl mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#27A827]/10 flex items-center justify-center">
                    <CheckCircle size={20} className="text-[#27A827]" />
                  </div>
                  Ce que comprend l&apos;accompagnement
                </h3>
                <div className="pl-1">
                  {etapes.map((step, i) => (
                    <TimelineStep key={i} step={step} index={i} total={etapes.length} />
                  ))}
                </div>
              </div>
            </AnimateOnScroll>

            {/* Consultants spécialisés */}
            {store.consultants.filter((c) => c.actif && c.domainesIds.includes(espace.id)).length > 0 && (
              <AnimateOnScroll variant="fadeUp">
                <div className="p-5 sm:p-6 bg-[#E8B800]/5 border border-[#E8B800]/15 rounded-2xl">
                  <h3 className="text-gray-900 font-bold text-lg mb-4 flex items-center gap-2">
                    <Users size={18} className="text-[#E8B800]" />
                    Vos consultants pour cet espace
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {store.consultants.filter((c) => c.actif && c.domainesIds.includes(espace.id)).map((c) => (
                      <div key={c.id} className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border border-[#E8B800]/10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8B800] to-[#27A827] flex items-center justify-center text-white font-bold text-sm">
                          {c.prenom.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-gray-900 font-semibold text-sm">{c.prenom}</p>
                          <p className="text-gray-500 text-xs">{c.clientsAccompa} client{c.clientsAccompa > 1 ? "s" : ""} · {c.entreprisesAccompa} entreprise{c.entreprisesAccompa > 1 ? "s" : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimateOnScroll>
            )}
          </div>

          {/* ── COLONNE FORMULAIRE (2/5) ── */}
          <div className="lg:col-span-2 lg:sticky lg:top-20" id="postuler">

            {/* Bande de confiance */}
            <AnimateOnScroll variant="fadeUp">
              <div className="flex items-center justify-center gap-4 mb-4 p-3 bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Shield size={12} className="text-[#27A827]" />
                  <span>Gratuit</span>
                </div>
                <div className="w-px h-3 bg-gray-200" />
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock size={12} className="text-[#E8B800]" />
                  <span>Réponse 48h</span>
                </div>
                <div className="w-px h-3 bg-gray-200" />
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Star size={12} className="text-[#E8B800]" />
                  <span>Expert dédié</span>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Demande existante */}
            {demandeExistante && !submitted ? (
              <AnimateOnScroll variant="scaleUp">
                <div className={`p-6 sm:p-8 border rounded-2xl ${statutBadgeCls(demandeExistante.statut)}`}>
                  <div className="text-4xl mb-4 text-center">
                    {demandeExistante.statut === "validee" ? "✅" : demandeExistante.statut === "rejetee" ? "❌" : "⏳"}
                  </div>
                  <h3 className="text-gray-900 text-xl font-bold mb-2 text-center">{statutLabel(demandeExistante.statut)}</h3>
                  <p className="text-sm text-center mb-6 text-gray-400">
                    Soumise le {new Date(demandeExistante.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  {demandeExistante.noteAdmin && (
                    <div className="p-4 bg-white/60 rounded-xl mb-4">
                      <p className="text-gray-500 text-xs mb-1">Note de l&apos;administrateur :</p>
                      <p className="text-gray-900 text-sm">{demandeExistante.noteAdmin}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Link href="/mon-espace" className="flex-1 text-center py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium">
                      Mon espace
                    </Link>
                    <button onClick={store.deconnecterClient} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200">
                      Changer de compte
                    </button>
                  </div>
                </div>
              </AnimateOnScroll>

            ) : submitted ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-6 sm:p-8 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                  className="text-5xl mb-4"
                >
                  ✅
                </motion.div>
                <h3 className="text-gray-900 text-xl font-bold mb-3">Candidature envoyée !</h3>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  Votre demande pour <strong className="text-gray-900">{espace.titre}</strong> a bien été reçue.
                  Notre équipe vous contactera sous <strong className="text-gray-900">48–72h</strong>.
                </p>
                <div className="flex gap-3">
                  <Link href="/mon-espace" className="flex-1 text-center py-3 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-white font-bold rounded-xl text-sm">
                    Suivre ma demande
                  </Link>
                  <Link href="/accompagnement" className="flex-1 text-center py-3 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50">
                    Autres espaces
                  </Link>
                </div>
              </motion.div>

            ) : clientConnecte ? (
              <AnimateOnScroll variant="fadeUp">
                <div className="p-6 sm:p-8 bg-white border border-gray-100 rounded-2xl shadow-lg shadow-gray-100/50">
                  <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">Connecté</p>
                      <p className="text-gray-900 font-bold text-sm">{clientConnecte.nom}</p>
                      <p className="text-gray-500 text-xs">{clientConnecte.email}</p>
                    </div>
                    <button onClick={store.deconnecterClient} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                      Changer
                    </button>
                  </div>
                  <h3 className="text-gray-900 text-lg font-bold mb-1">Postuler pour cet espace</h3>
                  <p className="text-gray-500 text-sm mb-5">Expliquez votre projet et votre motivation.</p>
                  <form onSubmit={handleDemandeClientConnecte} className="space-y-4">
                    <div>
                      <label className={labelCls}>Votre motivation <span className="text-[#E8B800]">*</span></label>
                      <textarea
                        required rows={5} value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className={`${inputCls} resize-none`}
                        placeholder={`Pourquoi souhaitez-vous vous lancer dans le secteur ${espace.titre} ?`}
                      />
                    </div>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-gradient-to-r from-[#27A827] to-[#1f8c1f] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#27A827]/20"
                    >
                      <Send size={16} /> Envoyer ma candidature
                    </motion.button>
                    <p className="text-gray-400 text-xs text-center">Réponse sous 48–72h</p>
                  </form>
                </div>
              </AnimateOnScroll>

            ) : mode === "info" ? (
              <AnimateOnScroll variant="fadeUp">
                <div className="p-6 sm:p-8 bg-white border border-gray-100 rounded-2xl shadow-lg shadow-gray-100/50">
                  <div className="text-center mb-6">
                    {heroImage ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        className="w-16 h-16 mx-auto rounded-2xl overflow-hidden border-2 border-[#E8B800]/20 mb-4"
                      >
                        <img src={heroImage} alt="" className="w-full h-full object-cover" />
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#E8B800]/20 to-[#27A827]/10 border border-[#E8B800]/20 flex items-center justify-center mb-4"
                      >
                        <span className="text-[#E8B800] font-black text-2xl">{icone || espace.titre.charAt(0).toUpperCase()}</span>
                      </motion.div>
                    )}
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-gray-900 text-lg font-bold mb-1"
                    >
                      Bénéficier de l&apos;accompagnement
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-gray-500 text-sm"
                    >
                      Faites votre demande en quelques clics.
                    </motion.p>
                  </div>
                  <div className="mb-6">
                    <motion.button
                      onClick={() => setMode("inscription")}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, type: "spring" }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-4 bg-gradient-to-r from-[#27A827] to-[#1f8c1f] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#27A827]/20 transition-all relative overflow-hidden"
                    >
                      <motion.span
                        className="absolute inset-0 bg-white/10 rounded-xl"
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <ArrowRight size={18} /> Je veux être accompagné
                    </motion.button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {espace.clientsSatisfaits > 0 && (
                      <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                        <span className="text-gray-500">Satisfaits</span>
                        <span className="text-gray-900 font-bold">{espace.clientsSatisfaits}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-gray-500">Places</span>
                      <span className={`font-bold ${espace.placesDisponibles <= 2 ? "text-orange-500" : "text-[#27A827]"}`}>
                        {espace.placesDisponibles}
                      </span>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>

            ) : mode === "login" ? (
              <AnimateOnScroll variant="fadeUp">
                <div className="p-6 sm:p-8 bg-white border border-gray-100 rounded-2xl shadow-lg shadow-gray-100/50">
                  <button onClick={() => setMode("info")} className="text-gray-500 text-xs mb-5 hover:text-gray-700 flex items-center gap-1 transition-colors">
                    <ChevronRight size={12} className="rotate-180" /> Retour
                  </button>
                  <h3 className="text-gray-900 text-lg font-bold mb-1">Me connecter</h3>
                  <p className="text-gray-500 text-sm mb-5">Entrez l&apos;email de votre compte.</p>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className={labelCls}>Email <span className="text-[#E8B800]">*</span></label>
                      <input required type="email" value={loginEmail}
                        onChange={(e) => { setLoginEmail(e.target.value); setLoginError(""); }}
                        className={inputCls} placeholder="jean@exemple.com" />
                      {loginError && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} />{loginError}</p>}
                    </div>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-white font-bold rounded-xl shadow-lg"
                    >
                      Continuer
                    </motion.button>
                    <button type="button" onClick={() => setMode("inscription")} className="w-full text-center text-gray-500 text-sm hover:text-gray-700 transition-colors">
                      Pas de compte ? S&apos;inscrire
                    </button>
                  </form>
                </div>
              </AnimateOnScroll>

            ) : (
              <AnimateOnScroll variant="fadeUp">
                <div className="p-5 sm:p-7 bg-white border border-gray-100 rounded-2xl shadow-lg shadow-gray-100/50">
                  <button onClick={() => { setMode("info"); setStep(1); setStepError(""); }} className="text-gray-500 text-xs mb-4 hover:text-gray-700 flex items-center gap-1 transition-colors">
                    <ChevronRight size={12} className="rotate-180" /> Retour
                  </button>

                  <div className="mb-5">
                    <h3 className="text-gray-900 text-lg font-bold mb-1">Demander mon accompagnement</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Candidature pour : <strong className="text-gray-900">{espace.titre}</strong>
                    </p>
                    <div className="flex items-center gap-1.5 mb-1">
                      {[1, 2, 3].map((s) => (
                        <div key={s} className="flex-1">
                          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-[#E8B800] to-[#27A827]"
                              initial={{ width: "0%" }}
                              animate={{ width: step >= s ? "100%" : "0%" }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-400 text-xs">Étape {step} sur 3</p>
                      <p className="text-gray-400 text-xs">{step === 1 ? "Coordonnées" : step === 2 ? "Votre profil" : "Votre projet"}</p>
                    </div>
                  </div>

                  {stepError && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-xs flex items-center gap-1 mb-3 p-2 bg-red-50 rounded-lg">
                      <AlertCircle size={12} /> {stepError}
                    </motion.p>
                  )}

                  <form onSubmit={handleInscription}>
                    <AnimatePresence mode="wait">
                      {step === 1 && (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -30 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center gap-2 p-2.5 bg-green-50/70 rounded-xl border border-green-100/50">
                            <div className="w-6 h-6 rounded-full bg-[#27A827] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                            <span className="text-gray-700 text-sm font-medium">Vos coordonnées</span>
                          </div>
                          <div>
                            <label className={labelCls}>Nom complet <span className="text-[#E8B800]">*</span></label>
                            <input type="text" value={form.nom} onChange={(e) => { setForm({ ...form, nom: e.target.value }); setStepError(""); }} className={inputCls} placeholder="Jean Dupont" />
                          </div>
                          <div>
                            <label className={labelCls}>Email <span className="text-[#E8B800]">*</span></label>
                            <input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setStepError(""); }} className={inputCls} placeholder="jean@exemple.com" />
                          </div>
                          <div>
                            <label className={labelCls}>Téléphone <span className="text-[#E8B800]">*</span></label>
                            <input type="tel" value={form.telephone} onChange={(e) => { setForm({ ...form, telephone: e.target.value }); setStepError(""); }} className={inputCls} placeholder="+237 6XX..." />
                          </div>
                          <motion.button
                            type="button"
                            onClick={() => {
                              if (!form.nom.trim() || !form.email.trim() || !form.telephone.trim()) {
                                setStepError("Remplissez tous les champs pour continuer.");
                                return;
                              }
                              setStepError("");
                              setStep(2);
                            }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3.5 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-white font-bold rounded-xl flex items-center justify-center gap-2 mt-1 shadow-lg shadow-[#27A827]/20"
                          >
                            Continuer <ArrowRight size={16} />
                          </motion.button>
                        </motion.div>
                      )}

                      {step === 2 && (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -30 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center gap-2 p-2.5 bg-green-50/70 rounded-xl border border-green-100/50">
                            <div className="w-6 h-6 rounded-full bg-[#27A827] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                            <span className="text-gray-700 text-sm font-medium">Votre situation</span>
                          </div>
                          <div>
                            <label className={labelCls}>Profession <span className="text-[#E8B800]">*</span></label>
                            <input type="text" value={form.profession} onChange={(e) => { setForm({ ...form, profession: e.target.value }); setStepError(""); }} className={inputCls} placeholder="Ex: Commerçant, Étudiant..." />
                          </div>
                          {secteurs.length > 0 && (
                            <div>
                              <label className={labelCls}>Secteur ciblé</label>
                              <select
                                value={form.secteurActivite}
                                onChange={(e) => setForm({ ...form, secteurActivite: e.target.value, secteurAutre: "" })}
                                className={selectCls}
                              >
                                <option value="">— Choisir (optionnel) —</option>
                                {secteurs.map((s) => (
                                  <option key={s} value={s}>{s === "Autre" ? "Autre (préciser)" : s}</option>
                                ))}
                              </select>
                              {form.secteurActivite === "Autre" && (
                                <input
                                  type="text"
                                  value={form.secteurAutre}
                                  onChange={(e) => setForm({ ...form, secteurAutre: e.target.value })}
                                  className={`${inputCls} mt-2`}
                                  placeholder="Précisez votre secteur..."
                                />
                              )}
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={labelCls}>Ville <span className="text-[#E8B800]">*</span></label>
                              <input type="text" value={form.ville} onChange={(e) => { setForm({ ...form, ville: e.target.value }); setStepError(""); }} className={inputCls} placeholder="Yaoundé" />
                            </div>
                            <div>
                              <label className={labelCls}>Capital <span className="text-[#E8B800]">*</span></label>
                              <select value={form.capital} onChange={(e) => { setForm({ ...form, capital: e.target.value }); setStepError(""); }} className={`${selectCls} bg-[#E8B800]/10 border-[#E8B800]/30 font-semibold`}>
                                <option value="">Fourchette...</option>
                                <option value="moins-500k">- de 500k FCFA</option>
                                <option value="500k-1m">500k – 1M FCFA</option>
                                <option value="1m-3m">1M – 3M FCFA</option>
                                <option value="3m-10m">3M – 10M FCFA</option>
                                <option value="plus-10m">+ de 10M FCFA</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-3 mt-1">
                            <button type="button" onClick={() => { setStep(1); setStepError(""); }} className="flex-1 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-colors">
                              Précédent
                            </button>
                            <motion.button
                              type="button"
                              onClick={() => {
                                if (!form.profession.trim() || !form.ville.trim() || !form.capital) {
                                  setStepError("Remplissez tous les champs pour continuer.");
                                  return;
                                }
                                setStepError("");
                                setStep(3);
                              }}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex-1 py-3.5 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#27A827]/20"
                            >
                              Continuer <ArrowRight size={16} />
                            </motion.button>
                          </div>
                        </motion.div>
                      )}

                      {step === 3 && (
                        <motion.div
                          key="step3"
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -30 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center gap-2 p-2.5 bg-green-50/70 rounded-xl border border-green-100/50">
                            <div className="w-6 h-6 rounded-full bg-[#27A827] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                            <span className="text-gray-700 text-sm font-medium">Votre projet</span>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-1.5">
                            <div className="flex items-center gap-2"><CheckCircle size={12} className="text-[#27A827] flex-shrink-0" /> <span className="truncate">{form.nom} · {form.email}</span></div>
                            <div className="flex items-center gap-2"><CheckCircle size={12} className="text-[#27A827] flex-shrink-0" /> <span className="truncate">{form.profession} · {form.ville}</span></div>
                          </div>
                          <div>
                            <label className={labelCls}>Décrivez votre projet et votre motivation <span className="text-[#E8B800]">*</span></label>
                            <textarea
                              required rows={5} value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              className={`${inputCls} resize-none`}
                              placeholder={`Pourquoi souhaitez-vous vous lancer dans le secteur ${espace.titre} ? Quelle est votre vision ? Avez-vous déjà de l'expérience ?`}
                            />
                          </div>
                          <div className="flex gap-3 mt-1">
                            <button type="button" onClick={() => { setStep(2); setStepError(""); }} className="flex-1 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-colors">
                              Précédent
                            </button>
                            <motion.button
                              type="submit"
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex-1 py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#27A827]/20"
                            >
                              <Send size={16} /> Envoyer
                            </motion.button>
                          </div>
                          <p className="text-gray-400 text-xs text-center">Vous serez contacté dans les 48–72h.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </div>
              </AnimateOnScroll>
            )}
          </div>
        </div>
      </div>

      {/* ═══ AVIS CLIENTS ═══ */}
      <div className="py-10 sm:py-14 border-t border-gray-100 bg-gradient-to-br from-gray-50/50 via-white to-green-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ReviewSection
            productId={espace.id}
            productType="accompagnement"
            userId={clientConnecte?.id ?? null}
            userName={clientConnecte?.nom ?? ""}
            isPurchased={demandeExistante?.statut === "validee"}
          />
        </div>
      </div>

      {/* ═══ AUTRES DOMAINES ═══ */}
      {(() => {
        const similaires = (espace.espacesSimilaires ?? [])
          .map((id) => allServerEspaces.find((e) => e.actif && e.id === id))
          .filter(Boolean) as typeof autresEspaces;
        const aAfficher = similaires.length > 0 ? similaires : autresEspaces;
        if (aAfficher.length === 0) return null;

        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <AnimateOnScroll variant="fadeUp">
              <h3 className="text-gray-900 font-bold text-2xl sm:text-3xl mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8B800]/10 flex items-center justify-center">
                  <ArrowRight size={20} className="text-[#E8B800]" />
                </div>
                {similaires.length > 0 ? "Domaines similaires" : "Autres domaines disponibles"}
              </h3>
            </AnimateOnScroll>
            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {aAfficher.slice(0, 3).map((e) => {
                const img = e.image || STATIC_ESPACES.find((s) => s.id === e.id)?.image;
                const emoji = STATIC_ESPACES.find((s) => s.id === e.id)?.icone;
                return (
                  <StaggerItem key={e.id}>
                    <Link href={`/accompagnement/${e.id}`}
                      className="group block bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#E8B800]/20 transition-all">
                      <div className="h-36 sm:h-40 overflow-hidden relative">
                        {img ? (
                          <img
                            src={img}
                            alt={e.titre}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(ev) => { (ev.target as HTMLImageElement).style.display = "none"; (ev.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }}
                          />
                        ) : null}
                        <div className={`${img ? "hidden" : ""} absolute inset-0 bg-gradient-to-br from-[#E8B800]/10 to-[#27A827]/5 flex items-center justify-center`}>
                          <span className="text-5xl">{emoji || e.titre.charAt(0)}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-900 font-bold text-sm group-hover:text-[#27A827] transition-colors">{e.titre}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{e.domaine}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-[#27A827]/10 flex items-center justify-center transition-colors">
                            <ArrowRight size={14} className="text-gray-400 group-hover:text-[#27A827] transition-colors" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        );
      })()}

      {/* ═══ BOUTON FLOTTANT — toujours visible ═══ */}
      {!submitted && !demandeExistante && (
        <div className="fixed bottom-20 lg:bottom-6 left-0 right-0 z-40 px-4 sm:px-6 pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto">
            <motion.button
              onClick={scrollToPostuler}
              initial={{ y: 60, opacity: 0 }}
              animate={{
                y: 0,
                opacity: 1,
                scale: [1, 1.03, 1],
                boxShadow: [
                  "0 10px 25px -5px rgba(0,0,0,0.15)",
                  "0 15px 35px -5px rgba(232,184,0,0.35)",
                  "0 10px 25px -5px rgba(0,0,0,0.15)",
                ],
              }}
              transition={{
                y: { delay: 1, type: "spring", stiffness: 200 },
                opacity: { delay: 1 },
                scale: { delay: 2, duration: 2, repeat: Infinity, ease: "easeInOut" },
                boxShadow: { delay: 2, duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-white font-bold rounded-2xl flex items-center justify-center gap-2.5 text-sm shadow-xl shadow-black/15 border border-white/20"
            >
              <Send size={16} />
              Je veux être accompagné
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight size={16} />
              </motion.span>
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
