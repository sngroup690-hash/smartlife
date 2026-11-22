import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { ebooks as staticEbooks } from "@/lib/data";
import { assurerPacksProposes } from "@/lib/packs-proposes";

export const dynamic = "force-dynamic";

const FILE = path.join(process.cwd(), "private", "packs-data.json");
const EBOOKS_FILE = path.join(process.cwd(), "private", "ebooks-data.json");
const FORMATIONS_FILE = path.join(process.cwd(), "private", "formations-data.json");
const NO_STORE = { headers: { "Cache-Control": "no-store" } };

async function buildPriceMap(): Promise<Map<string, number>> {
  const map = new Map<string, number>();

  // Static ebooks
  for (const e of staticEbooks) {
    map.set(e.id, e.price);
  }

  // Dynamic ebooks (admin-created)
  try {
    const data = JSON.parse(await readFile(EBOOKS_FILE, "utf-8"));
    for (const e of data.ebooks || []) {
      if (e.id && e.price) map.set(e.id, Number(e.price));
    }
  } catch {}

  // Formations
  try {
    const data = JSON.parse(await readFile(FORMATIONS_FILE, "utf-8"));
    for (const f of data.formations || []) {
      if (f.id && f.prix) map.set(f.id, Number(f.prix));
    }
  } catch {}

  return map;
}

export async function GET(req: NextRequest) {
  try {
    await assurerPacksProposes().catch(() => 0);
    const data = JSON.parse(await readFile(FILE, "utf-8"));
    const packs: Array<{
      statut: string;
      id: string;
      items?: Array<{ type: string; id: string; title: string }>;
    }> = data.packs || [];

    const priceMap = await buildPriceMap();

    const enriched = packs.map((pack) => {
      const items = pack.items || [];
      const originalValeur = items.reduce(
        (sum, item) => sum + (priceMap.get(item.id) || 0),
        0
      );
      return { ...pack, originalValeur };
    });

    const id = req.nextUrl.searchParams.get("id");
    const slug = req.nextUrl.searchParams.get("slug");
    if (id) {
      const pack = enriched.find((p) => p.id === id);
      if (!pack) return NextResponse.json({ error: "Pack introuvable" }, { status: 404, ...NO_STORE });
      return NextResponse.json({ pack }, NO_STORE);
    }
    if (slug) {
      const pack = enriched.find((p) => (p as { slug?: string }).slug === slug);
      if (!pack) return NextResponse.json({ error: "Pack introuvable" }, { status: 404, ...NO_STORE });
      return NextResponse.json({ pack }, NO_STORE);
    }

    return NextResponse.json(
      { packs: enriched.filter((p) => p.statut === "actif") },
      NO_STORE
    );
  } catch {
    return NextResponse.json({ packs: [] }, NO_STORE);
  }
}
