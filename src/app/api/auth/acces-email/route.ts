import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { readUsers } from "@/lib/purchase-guard";

export const dynamic = "force-dynamic";

// POST /api/auth/acces-email { email } — choix de Frank (22/11/2026) : un client qui a payé
// retrouve ses achats avec son adresse e-mail seule, sans code.
// Garde-fous : seuls les comptes avec au moins un achat s'ouvrent ainsi, le téléphone n'est pas renvoyé,
// et un même appareil ne peut pas essayer beaucoup d'adresses à la suite.
export async function POST(req: NextRequest) {
  const limite = rateLimit(req, { limit: 8, windowMs: 15 * 60_000 });
  if (limite) return limite;

  const body = await req.json().catch(() => null) as { email?: string } | null;
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }

  const users = await readUsers();
  const user = users.find((u) => String(u.email ?? "").toLowerCase() === email);
  const ebooks = new Set((user?.ebooksAchetes as string[] | undefined) ?? []);
  const formations = new Set((user?.formationsAchetees as string[] | undefined) ?? []);
  // Achats confirmés présents dans le registre des ventes mais pas encore rattachés au compte.
  try {
    const { queryAllSales } = await import("@/lib/analytics");
    for (const v of await queryAllSales()) {
      if (v.customerEmail?.toLowerCase() !== email) continue;
      if (v.productType === "ebook") ebooks.add(v.productId);
      else if (v.productType === "formation") formations.add(v.productId);
    }
  } catch { /* registre indisponible : on garde ce qui est sur le compte */ }
  if (!user || (ebooks.size === 0 && formations.size === 0)) {
    return NextResponse.json({ error: "Aucun achat trouvé pour cet e-mail. Vérifie l'adresse utilisée lors du paiement." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email,
      ebooksAchetes: [...ebooks],
      formationsAchetees: [...formations],
    },
  });
}
