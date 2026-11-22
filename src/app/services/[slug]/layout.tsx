import { Metadata } from "next";
import { services } from "@/lib/data";
import { readFile } from "fs/promises";
import path from "path";
import type { DynamicService } from "@/lib/services-data";
import { stripHtml } from "@/lib/strip-html";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://smartlifecm.com").replace(/\/$/, "");

async function findService(slug: string): Promise<{ title: string; description: string; longDescription?: string } | null> {
  const stat = services.find((s) => s.slug === slug);
  if (stat) return stat;

  try {
    const raw = await readFile(path.join(process.cwd(), "private", "services-data.json"), "utf-8");
    const all: DynamicService[] = JSON.parse(raw);
    return all.find((s) => s.slug === slug && s.enabled) ?? null;
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
  const svc = await findService(slug);

  if (!svc) return { title: "Service introuvable | Smart Life" };

  const desc = stripHtml(svc.longDescription || svc.description);
  const description = desc.length > 155 ? desc.slice(0, 152) + "…" : desc;
  const title = `${svc.title} | Smart Life`;
  const url = `${APP_URL}/services/${slug}`;

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
      images: [{ url: `${APP_URL}/logo-smartlife.jpeg`, width: 1200, height: 630, alt: svc.title }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function ServiceSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
