import { Metadata } from "next";
import { espaces as STATIC_ESPACES } from "@/lib/accompagnement-data";
import { readFile } from "fs/promises";
import path from "path";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://smartlifecm.com").replace(/\/$/, "");

type DynEspace = {
  id: string;
  titre: string;
  descriptionCourte?: string;
  descriptionLongue?: string;
  actif?: boolean;
  investissementMin?: number;
  investissementMax?: number;
};

async function findEspace(id: string): Promise<{ titre: string; description: string; investissementMin?: number; investissementMax?: number } | null> {
  // Statiques d'abord
  const stat = STATIC_ESPACES.find((e) => e.id === id);
  if (stat) {
    return { titre: stat.titre, description: stat.description, investissementMin: stat.investissementMin, investissementMax: stat.investissementMax };
  }

  // Dynamiques
  try {
    const raw = await readFile(path.join(process.cwd(), "private", "espaces.json"), "utf-8");
    const all: DynEspace[] = JSON.parse(raw);
    const found = all.find((e) => e.id === id && e.actif !== false);
    if (found) {
      return {
        titre: found.titre,
        description: found.descriptionCourte || found.descriptionLongue || "",
        investissementMin: found.investissementMin,
        investissementMax: found.investissementMax,
      };
    }
  } catch { /* fichier absent */ }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const espace = await findEspace(slug);

  if (!espace) return { title: "Accompagnement | Smart Life" };

  const investStr =
    espace.investissementMin && espace.investissementMax
      ? ` — Investissement : ${espace.investissementMin.toLocaleString("fr-FR")} à ${espace.investissementMax.toLocaleString("fr-FR")} FCFA`
      : "";
  const desc = `${espace.description}${investStr}`;
  const description = desc.length > 155 ? desc.slice(0, 152) + "…" : desc;
  const title = `${espace.titre} | Smart Life Accompagnement`;
  const url = `${APP_URL}/accompagnement/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "Smart Life",
      images: [{ url: `${APP_URL}/logo-smartlife.jpeg`, width: 1200, height: 630, alt: espace.titre }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function AccompagnementSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
