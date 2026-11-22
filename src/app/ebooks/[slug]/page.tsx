import { Metadata } from "next";
import { readFile } from "fs/promises";
import path from "path";
import { ebooks, type Ebook } from "@/lib/data";
import EbookLandingPageClient from "./EbookLandingPageClient";
import { stripHtml } from "@/lib/strip-html";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://smartlifecm.com").replace(/\/$/, "");

function buildOgDescription(ebook: Ebook): string {
  if (ebook.description) {
    const plain = stripHtml(ebook.description);
    return plain.length > 155 ? plain.slice(0, 152) + "…" : plain;
  }
  return `Ebook numérique • ${ebook.category}. Accès immédiat après paiement — livré par email.`;
}

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

  const title = `${ebook.title} | Smart Life`;
  const description = buildOgDescription(ebook);
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

export default function EbookPage() {
  return <EbookLandingPageClient />;
}
