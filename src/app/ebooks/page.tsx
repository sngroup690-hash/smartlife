import type { Metadata } from "next";
import { BookOpen, Filter, Star, CheckCircle } from "lucide-react";
import { ebooks, testimonials, type Ebook } from "@/lib/data";
import EbooksGrid from "@/components/EbooksGrid";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { readFile } from "fs/promises";
import path from "path";

export const metadata: Metadata = {
  title: "Catalogue d'Ebooks | Smart Life – Guides Pratiques Africains",
  description: "Découvrez plus de 35 ebooks pratiques sur l'entrepreneuriat, le développement personnel, l'élevage, l'agriculture et le business numérique. Téléchargement immédiat. À partir de 3 500 FCFA.",
  alternates: { canonical: "https://smartlifecm.com/ebooks" },
  openGraph: {
    type: "website",
    url: "https://smartlifecm.com/ebooks",
    title: "Catalogue d'Ebooks | Smart Life",
    description: "Plus de 35 guides pratiques pour booster vos compétences et votre business. Livraison immédiate par email.",
    siteName: "Smart Life",
    images: [{ url: "https://smartlifecm.com/logo-smartlife.jpeg", width: 1200, height: 630, alt: "Smart Life Ebooks" }],
  },
  twitter: { card: "summary_large_image", title: "Catalogue d'Ebooks | Smart Life", description: "Plus de 35 guides pratiques pour l'Afrique." },
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

  // staticEbooks : ebooks data.ts filtrés pour le SSR initial (avant hydratation JS)
  const filtered = (cat && cat !== "Tous"
    ? ebooks.filter((e) => e.category === cat)
    : ebooks
  ).filter((e) => serverData.actif[e.id] !== false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <AnimateOnScroll variant="fadeUp">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-green-400 text-sm mb-4">
            <BookOpen size={16} />
            <span>Bibliothèque digitale</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Notre <span className="gradient-text">Catalogue</span> d&apos;Ebooks
          </h1>
          <p className="text-gray-600 font-bold max-w-2xl mx-auto text-sm sm:text-base md:text-lg">
            Des guides pratiques et des formations écrites pour booster vos compétences et votre business.
          </p>
        </div>
      </AnimateOnScroll>

      {/* Filter by category */}
      <AnimateOnScroll variant="fadeUp" delay={0.1}>
        <div className="mb-8">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
            <Filter size={16} />
            <span>Filtrer par catégorie :</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            {CATEGORIES.map((category) => {
              const isActive = (!cat && category === "Tous") || cat === category;
              return (
                <a
                  key={category}
                  href={category === "Tous" ? "/ebooks" : `/ebooks?cat=${encodeURIComponent(category)}`}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all border whitespace-nowrap ${
                    isActive
                      ? "bg-green-600 text-white border-green-600"
                      : "border-gray-300 text-gray-700 hover:border-green-500 hover:text-green-700"
                  }`}
                >
                  {category}
                </a>
              );
            })}
          </div>
        </div>
      </AnimateOnScroll>

      {/* Grid — tous les ebooks sont pré-chargés côté serveur (pas d'attente client) */}
      <AnimateOnScroll variant="fadeUp" delay={0.2}>
        <EbooksGrid staticEbooks={filtered} currentCat={cat} initialQuery={q} initialServerData={serverData} />
      </AnimateOnScroll>

      {/* Témoignages clients */}
      <AnimateOnScroll variant="blurUp">
      <div className="mt-12 relative overflow-hidden py-2">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#f9f8f5] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#f9f8f5] to-transparent z-10 pointer-events-none" />
        <div className="flex gap-4 animate-marquee-left" style={{ width: "max-content", animationDuration: "35s" }}>
          {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
            <div key={i} className="flex-shrink-0 w-72 sm:w-80 p-5 bg-white border border-gray-200 rounded-2xl flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-gray-900 text-sm font-bold">{t.name}</div>
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                    <CheckCircle size={11} /> {t.role}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">{t.content}</p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={13} className={j < t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                ))}
                <span className="text-gray-500 text-xs ml-1">{t.rating}/5</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      </AnimateOnScroll>

      {/* Promo banner */}
      <AnimateOnScroll variant="scaleUp" delay={0.1}>
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-center">
          <h3 className="text-gray-900 text-2xl font-bold mb-2">📦 Pack Complet – 3 Ebooks pour le prix de 2</h3>
          <p className="text-gray-600 font-bold mb-6">Économisez jusqu&apos;à 40% en achetant plusieurs ebooks ensemble.</p>
          <a
            href="/packs"
            className="inline-block px-8 py-3 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-bold rounded-xl transition-all"
          >
            Découvrez nos packs maintenant →
          </a>
        </div>
      </AnimateOnScroll>
    </div>
  );
}
