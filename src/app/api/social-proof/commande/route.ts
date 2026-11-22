import { NextRequest, NextResponse } from "next/server";
import { appendRecentActivity } from "../route";

// Enregistre une vraie commande en cours (« X est en train de commander… ») pour la preuve sociale.
const derniereParIp = new Map<string, number>();

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnu";
  if (Date.now() - (derniereParIp.get(ip) ?? 0) < 60_000) return NextResponse.json({ ok: true });
  derniereParIp.set(ip, Date.now());

  try {
    const corps = await req.json();
    const prenom = String(corps.prenom || "").replace(/[^\p{L}' -]/gu, "").trim().slice(0, 20);
    const produit = String(corps.produit || "").replace(/[<>]/g, "").trim().slice(0, 120);
    if (prenom.length < 2 || !produit) return NextResponse.json({ ok: false }, { status: 400 });
    const premier = prenom.split(" ")[0];
    await appendRecentActivity({
      type: "checkout",
      prenom: premier.charAt(0).toUpperCase() + premier.slice(1).toLowerCase(),
      ville: "",
      produit,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
