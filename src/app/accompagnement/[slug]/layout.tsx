import { Metadata } from "next";
import { espaces as STATIC_ESPACES } from "@/lib/accompagnement-data";
import { readFile, access } from "fs/promises";
import path from "path";
import { titreAccompagnement, descriptionAccompagnement, jsonLd } from "@/lib/seo";
import { photoPourEspace } from "@/lib/photo-espace";

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

  const title = `${titreAccompagnement(espace.titre)} | Smart Life`;
  const description = descriptionAccompagnement(espace.titre);
  const url = `${APP_URL}/accompagnement/${slug}`;
  const image = await visuelEspace(slug, espace.titre);

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
      images: [{ url: image, alt: espace.titre }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

async function visuelEspace(id: string, titre: string): Promise<string> {
  const nom = `${String(id).replace(/[^a-zA-Z0-9_-]/g, "_")}.webp`;
  try {
    await access(path.join(process.cwd(), "public", "espaces", nom));
    return `${APP_URL}/espaces/${nom}`;
  } catch {
    const photo = await photoPourEspace(titre);
    return photo ? `${APP_URL}${photo}` : `${APP_URL}/logo-smartlife.jpeg`;
  }
}

export default async function AccompagnementSlugLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const espace = await findEspace(slug);
  const url = `${APP_URL}/accompagnement/${slug}`;
  // Étiquettes Google : un service d'accompagnement proposé au Cameroun et en Afrique.
  const donnees = espace && [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: titreAccompagnement(espace.titre),
      serviceType: "Accompagnement entrepreneurial",
      description: descriptionAccompagnement(espace.titre),
      provider: { "@type": "Organization", name: "Smart Life", url: APP_URL },
      areaServed: ["Cameroun", "Afrique"],
      url,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: APP_URL },
        { "@type": "ListItem", position: 2, name: "Accompagnement", item: `${APP_URL}/accompagnement` },
        { "@type": "ListItem", position: 3, name: espace.titre, item: url },
      ],
    },
  ];
  return (
    <>
      {donnees && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(donnees) }} />}
      {children}
    </>
  );
}
