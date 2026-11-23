import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { abonner, categoriesDesProduits, clesEnvoi, desabonner, etatAbonne } from "@/lib/notifications-nouveautes";

export const dynamic = "force-dynamic";

/**
 * Clé publique dont le téléphone a besoin pour accepter nos notifications,
 * et noms des catégories des produits donnés (?produits=id1,id2).
 */
export async function GET(req: NextRequest) {
  const { publique } = await clesEnvoi();
  const ids = (req.nextUrl.searchParams.get("produits") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50);
  const categories = ids.length ? await categoriesDesProduits(ids) : [];
  return NextResponse.json({ cle: publique, categories }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * action "abonner" : { jeton?, email?, prenom?, produits: string[], appareil? }
 * action "etat"    : { jeton }
 * action "arreter" : { jeton }
 */
export async function POST(req: NextRequest) {
  const limite = rateLimit(req, { limit: 30, windowMs: 10 * 60_000 });
  if (limite) return limite;

  const corps = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!corps) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  const jeton = typeof corps.jeton === "string" ? corps.jeton.slice(0, 64) : undefined;

  if (corps.action === "abonner") {
    const produits = Array.isArray(corps.produits) ? corps.produits.filter((p): p is string => typeof p === "string") : [];
    const r = await abonner({
      jeton,
      email: typeof corps.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(corps.email) ? corps.email : undefined,
      prenom: typeof corps.prenom === "string" ? corps.prenom : undefined,
      produits,
      appareil: corps.appareil,
    });
    return NextResponse.json(r);
  }

  if (!jeton) return NextResponse.json({ error: "Jeton manquant" }, { status: 400 });

  if (corps.action === "etat") {
    const e = await etatAbonne(jeton);
    return NextResponse.json(e ?? { actif: false, categories: [], telephone: false, inconnu: true });
  }

  if (corps.action === "arreter") {
    const ok = await desabonner(jeton);
    return NextResponse.json({ ok });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
