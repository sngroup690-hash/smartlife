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

async function buildMaps(): Promise<{ prix: Map<string, number>; covers: Map<string, string> }> {
  const prix = new Map<string, number>();
  const covers = new Map<string, string>();

  for (const e of staticEbooks) {
    prix.set(e.id, e.price);
    if ((e as { cover?: string }).cover) covers.set(e.id, (e as { cover?: string }).cover!);
  }

  try {
    const data = JSON.parse(await readFile(EBOOKS_FILE, "utf-8"));
    for (const e of data.ebooks || []) {
      if (e.id && e.price) prix.set(e.id, Number(e.price));
      if (e.id && e.cover) covers.set(e.id, e.cover);
    }
  } catch {}

  try {
    const data = JSON.parse(await readFile(FORMATIONS_FILE, "utf-8"));
    for (const f of data.formations || []) {
      if (f.id && f.prix) prix.set(f.id, Number(f.prix));
    }
  } catch {}

  return { prix, covers };
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

    const { prix: priceMap, covers: coverMap } = await buildMaps();

    const enriched = packs.map((pack) => {
      const items = (pack.items || []).map((item) => ({
        ...item,
        prix: priceMap.get(item.id) || 0,
        cover: coverMap.get(item.id) || "",
      }));
      const originalValeur = items.reduce((sum, item) => sum + item.prix, 0);
      return { ...pack, items, originalValeur };
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
