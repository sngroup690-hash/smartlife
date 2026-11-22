import type { Metadata } from "next";
import { ebooks, testimonials, type Ebook } from "@/lib/data";
import VitrineBoutique from "./VitrineBoutique";
import { readFile } from "fs/promises";
import path from "path";

export const metadata: Metadata = {
  title: "Catalogue d'Ebooks | Smart Life – Guides Pratiques Africains",
  description: "Plus de 80 guides pratiques pour lancer et réussir ton activité en Afrique : élevage, agriculture, commerce, fabrication artisanale. Livraison instantanée, paiement Mobile Money.",
  alternates: { canonical: "https://smartlifecm.com/ebooks" },
  openGraph: {
    type: "website",
    url: "https://smartlifecm.com/ebooks",
    title: "Catalogue d'Ebooks | Smart Life",
    description: "Plus de 80 guides pratiques pour l'Afrique. Livraison instantanée, paiement Mobile Money.",
    siteName: "Smart Life",
    images: [{ url: "https://smartlifecm.com/logo-smartlife.jpeg", width: 1200, height: 630, alt: "Smart Life Ebooks" }],
  },
  twitter: { card: "summary_large_image", title: "Catalogue d'Ebooks | Smart Life", description: "Plus de 80 guides pratiques pour l'Afrique." },
};

const SLIM_STRIP = new Set([
  "sections", "faq", "avisClients", "metaTitle", "metaDescription", "ogImage", "customSlug",
  "commentAcheterUrl", "ctaLabel", "ctaAnimation", "reviewCardSize",
  "promoEndDate", "promoCyclique", "promoDureeHeures",
  "communityBgColor", "communityTextColor", "videoUrl", "coverLayout", "banner",
  "priceColor", "ctaBgColor", "ctaTextColor",
]);

type ServerData = { ebooks: Ebook[]; overrides: Record<string, Partial<Ebook>>; actif: Record<string, boolean> };

function slimRecord(e: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k in e) {
    if (SLIM_STRIP.has(k)) continue;
    if (k === "description" && typeof e[k] === "string") {
      const d = e[k] as string;
      out[k] = d.length > 220 ? d.slice(0, 220) + "…" : d;
    } else { out[k] = e[k]; }
  }
  return out;
}

async function getServerEbooks(): Promise<ServerData> {
  try {
    const raw = await readFile(path.join(process.cwd(), "private", "ebooks-data.json"), "utf-8");
    const json = JSON.parse(raw) as { ebooks?: Record<string, unknown>[]; overrides?: Record<string, Record<string, unknown>>; actif?: unknown };
    const slimmed: Ebook[] = Array.isArray(json.ebooks)
      ? json.ebooks
          .filter((e) => e.actif !== false && !e.deletedAt)
          .map((e) => slimRecord(e) as unknown as Ebook)
      : [];
    // Slim les overrides aussi — ils peuvent contenir des sections HTML volumineuses
    const rawOverrides = json.overrides || {};
    const slimmedOverrides: Record<string, Partial<Ebook>> = {};
    for (const [id, ov] of Object.entries(rawOverrides)) {
      slimmedOverrides[id] = slimRecord(ov) as Partial<Ebook>;
    }
    return {
      ebooks: slimmed,
      overrides: slimmedOverrides,
      actif: (json.actif as Record<string, boolean>) || {},
    };
  } catch {
    return { ebooks: [], overrides: {}, actif: {} };
  }
}

const CATEGORIES = [
  "Tous",
  "Développement Personnel, Compétences & Spiritualité",
  "Santé, Bien-être & Soins Corporels",
  "Élevage & Dresseurs",
  "Agriculture & Cultures Rentables",
  "Création d'Entreprises & Commerce Réel",
  "Fabrication Artisanale & Transformation",
  "Business Numérique, IA & Tech",
  "Gestion, Droit & Finance",
];

export default async function EbooksPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const { cat, q } = await searchParams;
  const serverData = await getServerEbooks();

  // Tous les guides visibles : ceux de base (avec leurs réglages admin) + ceux créés dans l'admin.
  const deBase = ebooks
    .filter((e) => serverData.actif[e.id] !== false)
    .map((e) => ({ ...e, ...(serverData.overrides[e.id] || {}) }));
  const idsBase = new Set(deBase.map((e) => e.id));
  const guides = [...deBase, ...serverData.ebooks.filter((e) => !idsBase.has(e.id))].filter((e) => e.slug);
  const categoriesPresentes = CATEGORIES.filter((c) => c === "Tous" || guides.some((g) => g.category === c));

  return (
    <VitrineBoutique
      guides={guides}
      categories={categoriesPresentes}
      temoignages={testimonials}
      categorieInitiale={cat}
      rechercheInitiale={q}
    />
  );
}
