import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { readUsers } from "@/lib/purchase-guard";
import { creerCodeEmail, envoyerCodeParEmail } from "@/lib/securite-compte";

export const dynamic = "force-dynamic";

// POST /api/auth/code { email } — envoie un code à 6 chiffres à l'adresse du compte.
// Il prouve que la personne a bien accès à cette boîte e-mail avant de créer ou changer un code PIN.
export async function POST(req: NextRequest) {
  const limite = rateLimit(req, { limit: 6, windowMs: 15 * 60_000 });
  if (limite) return limite;

  const body = await req.json().catch(() => null) as { email?: string } | null;
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }

  const users = await readUsers();
  const user = users.find((u) => String(u.email ?? "").toLowerCase() === email);
  if (!user) return NextResponse.json({ error: "Aucun compte trouvé pour cet e-mail." }, { status: 404 });

  const code = await creerCodeEmail(email);
  if (!code) {
    return NextResponse.json({ error: "Un code vient d'être envoyé. Attends une minute avant d'en demander un autre." }, { status: 429 });
  }
  const envoye = await envoyerCodeParEmail(email, code, String(user.firstName ?? ""));
  if (!envoye) {
    return NextResponse.json({ error: "Le code n'a pas pu être envoyé. Réessaie dans un instant ou écris-nous sur WhatsApp." }, { status: 502 });
  }
  return NextResponse.json({ success: true });
}
