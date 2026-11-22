import { MetadataRoute } from "next";
import { readFile } from "fs/promises";
import path from "path";
import { ebooks as STATIC_EBOOKS } from "@/lib/data";
import { services as STATIC_SERVICES } from "@/lib/data";
import { espaces as STATIC_ESPACES } from "@/lib/accompagnement-data";
import type { Ebook } from "@/lib/data";

const BASE = "https://smartlifecm.com";

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), "private", file), "utf-8")) as T;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Pages statiques prioritaires
  const staticPages = [
    { url: BASE, priority: 1.0, changeFrequency: "daily" as const },
    { url: `${BASE}/ebooks`, priority: 0.9, changeFrequency: "daily" as const },
    { url: `${BASE}/services`, priority: 0.8, changeFrequency: "weekly" as const },
    { url: `${BASE}/accompagnement`, priority: 0.8, changeFrequency: "weekly" as const },
    { url: `${BASE}/formation`, priority: 0.8, changeFrequency: "weekly" as const },
    { url: `${BASE}/packs`, priority: 0.7, changeFrequency: "weekly" as const },
    { url: `${BASE}/nos-consultants`, priority: 0.6, changeFrequency: "monthly" as const },
    { url: `${BASE}/temoignages`, priority: 0.6, changeFrequency: "monthly" as const },
    { url: `${BASE}/ressources-gratuites`, priority: 0.6, changeFrequency: "weekly" as const },
    { url: `${BASE}/contact`, priority: 0.5, changeFrequency: "monthly" as const },
    { url: `${BASE}/cgv`, priority: 0.3, changeFrequency: "yearly" as const },
    { url: `${BASE}/mentions-legales`, priority: 0.3, changeFrequency: "yearly" as const },
    { url: `${BASE}/confidentialite`, priority: 0.3, changeFrequency: "yearly" as const },
  ];
  entries.push(...staticPages);

  // Ebooks — statiques de base
  const ebookSlugsAdded = new Set<string>();
  for (const e of STATIC_EBOOKS) {
    const slug = (e as Ebook & { customSlug?: string }).customSlug || e.slug;
    if (slug && !ebookSlugsAdded.has(slug)) {
      entries.push({ url: `${BASE}/ebooks/${slug}`, priority: 0.8, changeFrequency: "monthly" as const });
      ebookSlugsAdded.add(slug);
    }
  }

  // Ebooks dynamiques créés par l'admin
  const ebooksData = await readJson<{ ebooks?: (Ebook & { actif?: boolean; deletedAt?: string; customSlug?: string })[] }>("ebooks-data.json");
  if (ebooksData?.ebooks) {
    for (const e of ebooksData.ebooks) {
      if (e.actif === false || e.deletedAt) continue;
      const slug = e.customSlug || e.slug;
      if (slug && !ebookSlugsAdded.has(slug)) {
        entries.push({ url: `${BASE}/ebooks/${slug}`, priority: 0.8, changeFrequency: "monthly" as const });
        ebookSlugsAdded.add(slug);
      }
    }
  }

  // Services statiques
  const serviceSlugsAdded = new Set<string>();
  for (const s of STATIC_SERVICES) {
    if (s.slug && !serviceSlugsAdded.has(s.slug)) {
      entries.push({ url: `${BASE}/services/${s.slug}`, priority: 0.75, changeFrequency: "monthly" as const });
      serviceSlugsAdded.add(s.slug);
    }
  }

  // Services dynamiques
  const dynServices = await readJson<Array<{ slug: string; enabled: boolean }>>("services-data.json");
  if (Array.isArray(dynServices)) {
    for (const s of dynServices) {
      if (!s.enabled || !s.slug || serviceSlugsAdded.has(s.slug)) continue;
      entries.push({ url: `${BASE}/services/${s.slug}`, priority: 0.75, changeFrequency: "monthly" as const });
      serviceSlugsAdded.add(s.slug);
    }
  }

  // Espaces accompagnement — statiques (routing par id)
  const espaceIdsAdded = new Set<string>();
  for (const e of STATIC_ESPACES) {
    if (e.id && !espaceIdsAdded.has(e.id)) {
      entries.push({ url: `${BASE}/accompagnement/${e.id}`, priority: 0.7, changeFrequency: "monthly" as const });
      espaceIdsAdded.add(e.id);
    }
  }

  // Espaces dynamiques
  const dynEspaces = await readJson<Array<{ id: string; actif?: boolean }>>("espaces.json");
  if (Array.isArray(dynEspaces)) {
    for (const e of dynEspaces) {
      if (!e.id || e.actif === false || espaceIdsAdded.has(e.id)) continue;
      entries.push({ url: `${BASE}/accompagnement/${e.id}`, priority: 0.7, changeFrequency: "monthly" as const });
      espaceIdsAdded.add(e.id);
    }
  }

  // Packs
  const packsData = await readJson<{ packs?: Array<{ slug: string; statut?: string }> }>("packs-data.json");
  if (packsData?.packs) {
    for (const p of packsData.packs) {
      if (!p.slug || p.statut === "inactif") continue;
      entries.push({ url: `${BASE}/packs/${p.slug}`, priority: 0.7, changeFrequency: "monthly" as const });
    }
  }

  // Formations
  const formationsData = await readJson<{ formations?: Array<{ id: string; actif?: boolean }> }>("formations-data.json");
  if (formationsData?.formations) {
    for (const f of formationsData.formations) {
      if (!f.id || f.actif === false) continue;
      entries.push({ url: `${BASE}/formation/${f.id}`, priority: 0.75, changeFrequency: "monthly" as const });
    }
  }

  return entries;
}
