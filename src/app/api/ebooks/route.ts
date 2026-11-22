import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const FILE = path.join(process.cwd(), "private", "ebooks-data.json");

// Champs inutiles pour le catalogue (landing page seulement)
const HEAVY_FIELDS = new Set([
  "sections", "faq", "avisClients",
  "metaTitle", "metaDescription", "ogImage", "customSlug",
  "commentAcheterUrl",
  "ctaLabel", "ctaAnimation", "reviewCardSize",
  "promoEndDate", "promoCyclique", "promoDureeHeures",
  "communityBgColor", "communityTextColor",
  "videoUrl", "coverLayout", "banner",
  "priceColor", "ctaBgColor", "ctaTextColor",
]);

const DESC_SLIM_MAX = 220;

// Cache mémoire : évite une lecture disque à chaque requête
let cache: { data: unknown; slimData: unknown; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

function stripHeavy(e: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k in e) {
    if (HEAVY_FIELDS.has(k)) continue;
    if (k === "description" && typeof e[k] === "string") {
      // Tronquer la description pour le catalogue (pas besoin du HTML complet)
      const desc = e[k] as string;
      out[k] = desc.length > DESC_SLIM_MAX ? desc.slice(0, DESC_SLIM_MAX) + "…" : desc;
    } else {
      out[k] = e[k];
    }
  }
  return out;
}

async function getData() {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache;

  const raw = await readFile(FILE, "utf-8");
  const data = JSON.parse(raw) as { ebooks?: Record<string, unknown>[]; overrides?: unknown; actif?: unknown };

  const slimData = Array.isArray(data.ebooks)
    ? { ...data, ebooks: data.ebooks.map(stripHeavy) }
    : data;

  cache = { data, slimData, expiresAt: now + CACHE_TTL_MS };
  return cache;
}

export async function GET(req: NextRequest) {
  const slim = req.nextUrl.searchParams.get("slim") === "1";
  const slug = req.nextUrl.searchParams.get("slug") ?? "";

  try {
    const { data, slimData } = await getData();
    const source = slim ? slimData : data;
    const d = source as { ebooks?: Record<string, unknown>[]; overrides?: unknown; actif?: unknown };

    // ?slug=xxx → renvoie uniquement l'ebook correspondant (landing page)
    // Gain : 2,2 Mo → ~30 Ko, le cache mémoire absorbe la lecture disque
    if (slug && Array.isArray(d.ebooks)) {
      const match = d.ebooks.find((e) => e.slug === slug || e.id === slug);
      const payload = {
        ebooks: match ? [match] : [],
        overrides: match
          ? { [(match.id as string)]: (d.overrides as Record<string, unknown>)?.[match.id as string] ?? {} }
          : {},
        actif: match
          ? { [(match.id as string)]: (d.actif as Record<string, unknown>)?.[match.id as string] ?? true }
          : {},
      };
      return NextResponse.json(payload, {
        headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
      });
    }

    const headers = slim
      ? { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" }
      : { "Cache-Control": "no-store" };
    return NextResponse.json(source, { headers });
  } catch {
    return NextResponse.json({ ebooks: [], overrides: {}, actif: {} });
  }
}
