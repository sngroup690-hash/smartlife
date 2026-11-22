import { Metadata } from "next";
import { readFile } from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import PackDetailClient, { type PackData } from "./PackDetailClient";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://smartlifecm.com").replace(/\/$/, "");
const FILE = path.join(process.cwd(), "private", "packs-data.json");

async function getPack(slug: string): Promise<PackData | null> {
  try {
    const data = JSON.parse(await readFile(FILE, "utf-8"));
    return (data.packs || []).find((p: PackData) => p.slug === slug) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pack = await getPack(slug);

  if (!pack) return { title: "Pack introuvable | Smart Life" };

  const title = `${pack.nom} | Smart Life`;
  const description = pack.description
    ? pack.description.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 155)
    : `Pack incluant ${pack.items.length} contenu${pack.items.length > 1 ? "s" : ""} — accès immédiat après paiement.`;
  const pageUrl = `${APP_URL}/packs/${slug}`;
  const imageUrl = pack.image
    ? pack.image.startsWith("http") ? pack.image : `${APP_URL}${pack.image}`
    : `${APP_URL}/logo-smartlife.jpeg`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "website",
      siteName: "Smart Life",
      url: pageUrl,
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: pack.nom }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PackDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pack = await getPack(slug);
  if (!pack || pack.statut !== "actif") notFound();
  return <PackDetailClient pack={pack} />;
}
