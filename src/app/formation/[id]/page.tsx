import { Metadata } from "next";
import { readFile } from "fs/promises";
import path from "path";
import { FORMATIONS, type Formation } from "@/lib/formations-data";
import FormationLandingPageClient from "./FormationLandingPageClient";
import { stripHtml } from "@/lib/strip-html";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://smartlifecm.com").replace(/\/$/, "");

function buildOgDescription(formation: Formation): string {
  if (formation.description) {
    const plain = stripHtml(formation.description);
    return plain.length > 155 ? plain.slice(0, 152) + "…" : plain;
  }
  return `Formation ${formation.niveau} • ${formation.categorie}. ${formation.duree} de contenu, accès immédiat.`;
}

function resolveImageUrl(src: string | undefined): string | null {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${APP_URL}${src.startsWith("/") ? "" : "/"}${src}`;
}

async function getFormation(id: string): Promise<Formation | null> {
  // 1. Formations statiques
  const staticFormation = FORMATIONS.find((f) => f.id === id) ?? null;

  // 2. Données dynamiques (admin)
  try {
    const raw = await readFile(
      path.join(process.cwd(), "private", "formations-data.json"),
      "utf-8"
    );
    const data = JSON.parse(raw);
    const overrides: Record<string, Partial<Formation>> = data.overrides || {};
    const dynamicFormations: Formation[] = (data.formations || []).filter(
      (f: Formation & { actif?: boolean; deletedAt?: string }) =>
        f.actif !== false && !f.deletedAt
    );

    const dynamicMatch = dynamicFormations.find((f) => f.id === id);
    if (dynamicMatch) {
      return { ...dynamicMatch, ...(overrides[dynamicMatch.id] || {}) };
    }

    if (staticFormation) {
      return { ...staticFormation, ...(overrides[staticFormation.id] || {}) };
    }
  } catch {
    // Fichier absent — utiliser données statiques seules
  }

  return staticFormation;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const formation = await getFormation(id);

  if (!formation) return { title: "Formation introuvable | Smart Life" };

  const title = `${formation.titre} | Smart Life`;
  const description = buildOgDescription(formation);
  const pageUrl = `${APP_URL}/formation/${id}`;
  const imageUrl = resolveImageUrl(formation.cover) ?? `${APP_URL}/logo-smartlife.jpeg`;

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
          alt: formation.titre,
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

export default function FormationPage() {
  return <FormationLandingPageClient />;
}
