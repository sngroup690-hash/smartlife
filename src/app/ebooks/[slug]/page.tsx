import { Metadata } from "next";
import { readFile } from "fs/promises";
import path from "path";
import { ebooks, type Ebook } from "@/lib/data";
import EbookLandingPageClient from "./EbookLandingPageClient";
import { stripHtml } from "@/lib/strip-html";
import { titreGuide, descriptionGuide, jsonLd } from "@/lib/seo";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://smartlifecm.com").replace(/\/$/, "");

function resolveImageUrl(src: string | undefined): string | null {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${APP_URL}${src.startsWith("/") ? "" : "/"}${src}`;
}

async function getEbook(slug: string): Promise<Ebook | null> {
  // 1. Ebooks statiques (données de base)
  const staticEbook = ebooks.find((e) => e.slug === slug) ?? null;

  // 2. Données dynamiques (admin) — overrides + ebooks créés dans l'admin
  try {
    const raw = await readFile(
      path.join(process.cwd(), "private", "ebooks-data.json"),
      "utf-8"
    );
    const data = JSON.parse(raw);
    const overrides: Record<string, Partial<Ebook>> = data.overrides || {};
    const dynamicEbooks: Ebook[] = (data.ebooks || []).filter(
      (e: Ebook & { actif?: boolean; deletedAt?: string }) =>
        e.actif !== false && !e.deletedAt
    );

    // Ebook admin créé dynamiquement
    const dynamicMatch = dynamicEbooks.find((e) => e.slug === slug);
    if (dynamicMatch) {
      return { ...dynamicMatch, ...(overrides[dynamicMatch.id] || {}) };
    }

    // Ebook statique avec overrides admin appliqués
    if (staticEbook) {
      return { ...staticEbook, ...(overrides[staticEbook.id] || {}) };
    }
  } catch {
    // Fichier absent ou malformé — utiliser données statiques seules
  }

  return staticEbook;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ebook = await getEbook(slug);

  if (!ebook) return { title: "Ebook introuvable | Smart Life" };

  const title = `${titreGuide(ebook.title)} | Smart Life`;
  const description = descriptionGuide(ebook.title, ebook.price, (ebook as Ebook & { ventes?: number }).ventes);
  const pageUrl = `${APP_URL}/ebooks/${slug}`;

  // Préférer la bannière (format paysage) à la couverture pour les previews OG
  const rawImage = (ebook as Ebook & { banner?: string }).banner || ebook.cover;
  const imageUrl = resolveImageUrl(rawImage) ?? `${APP_URL}/logo-smartlife.jpeg`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "article",
      url: pageUrl,
      title,
      description,
      siteName: "Smart Life",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: ebook.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function EbookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ebook = await getEbook(slug);

  // Étiquettes lues par Google : fiche produit (prix, image), fil d'Ariane et questions fréquentes.
  // Pas de note ni de nombre d'avis : Google interdit les avis qui ne viennent pas de vrais clients.
  const urlPage = `${APP_URL}/ebooks/${slug}`;
  const faq = (ebook?.faq ?? []).filter((q) => q.q && q.a);
  const donneesGoogle = ebook && [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: ebook.title,
      image: resolveImageUrl(ebook.cover || (ebook as Ebook & { banner?: string }).banner) ?? undefined,
      description: descriptionGuide(ebook.title, ebook.price, (ebook as Ebook & { ventes?: number }).ventes),
      category: ebook.category,
      brand: { "@type": "Brand", name: "Smart Life" },
      offers: {
        "@type": "Offer",
        price: ebook.price,
        priceCurrency: "XAF",
        availability: "https://schema.org/InStock",
        url: urlPage,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: APP_URL },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${APP_URL}/ebooks` },
        { "@type": "ListItem", position: 3, name: ebook.title, item: urlPage },
      ],
    },
    ...(faq.length > 0 ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((q) => ({
        "@type": "Question",
        name: q.q,
        acceptedAnswer: { "@type": "Answer", text: stripHtml(q.a) },
      })),
    }] : []),
  ];

  return (
    <>
      {donneesGoogle && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(donneesGoogle) }} />
      )}
      <EbookLandingPageClient initial={ebook} />
    </>
  );
}
